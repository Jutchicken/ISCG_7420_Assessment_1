from datetime import datetime

from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action

from .models import AppointmentSlot, Doctor, Appointment, Status, Department
from .serializers import AppointmentSlotSerializer, AdminDoctorSerializer, AppointmentRequestSerializer, \
    AppointmentSerializer, AdminPatientSerializer, DepartmentSerializer
from .permissions import IsAdminOrReadOnly


class AppointmentSlotViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSlotSerializer
    permission_classes = [IsAdminOrReadOnly]

    http_method_names = [
        'get', 'post', 'patch', 'delete',
        'head', 'options'
    ]

    def get_queryset(self):
        queryset = AppointmentSlot.objects.select_related(
            'doctor',
            'doctor__user'
        ).all()

        doctor_id = self.request.query_params.get('doctor')

        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        user = self.request.user

        if not (user.is_authenticated and user.is_staff):
            queryset = queryset.filter(
                is_available=True,
                date__gte = timezone.localdate()
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            return Response(
                {'error': 'A slot with this starting time already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, *args, **kwargs):
        with transaction.atomic():
            slot = AppointmentSlot.objects.select_for_update().get(pk=self.get_object().pk)

            active_appointments = slot.appointments.filter(
                Q(appointment_status__name__iexact='pending') |
                Q(appointment_status__name__iexact='approved')
            )

            if active_appointments.exists():
                raise ValidationError({'error': 'This slot is already booked.'})

            if slot.appointments.exists():
                protected_fields = [
                    'doctor',
                    'date',
                    'start_time',
                    'end_time'
                ]

                if any(field in request.data for field in protected_fields):
                    raise ValidationError({
                        'error': (
                            'A slot with appointment history cannot '
                            'change its doctor or time.'
                        )
                    })

            serializer = self.get_serializer(slot, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        slot = self.get_object()

        if slot.appointments.exists():
            return Response(
                {
                    'error': (
                        'This slot has appointment records '
                        'and cannot be deleted.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        slot.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

class AdminDoctorViewSet(viewsets.ModelViewSet):
    serializer_class = AdminDoctorSerializer
    permission_classes = [IsAdminUser]

    queryset = Doctor.objects.select_related(
        'user',
        'department'
    ).all().order_by('id')

    def destroy(self, request, *args, **kwargs):
        doctor = self.get_object()

        if Appointment.objects.filter(
            doctor=doctor.user
        ).exists():
            return Response(
                {
                    'error': (
                        'This doctor has appointment records '
                        'and cannot be removed.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if doctor.appointment_slots.exists():
            return Response(
                {
                    'error': (
                        'This doctor has appointment slots '
                        'and cannot be removed.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            user = doctor.user

            doctor.delete()

            user.is_active = False
            user.save(update_fields=['is_active'])

            # Revoke the user's authentication token.
            from rest_framework.authtoken.models import Token
            Token.objects.filter(user=user).delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    http_method_names = [
        'get', 'post', 'patch', 'delete',
        'head', 'options'
    ]

    def get_serializer_class(self):
        if self.action in ['create', 'partial_update']:
            return AppointmentRequestSerializer

        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user

        queryset = Appointment.objects.select_related(
            'patient',
            'doctor',
            'department',
            'appointment_status',
            'slot'
        ).order_by('-appointment_date', '-appointment_time')

        if user.is_staff:
            return queryset

        if Doctor.objects.filter(user=user).exists():
            return queryset.filter(doctor=user)

        return queryset.filter(patient=user)

    def active_status_filter(self):
        return (
            Q(appointment_status__name__iexact='pending')
            | Q(appointment_status__name__iexact='approved')
        )

    def get_status(self, name):
        result = Status.objects.filter(
            name__iexact=name
        ).first()

        if result is None:
            raise ValidationError({
                'status': f'Status "{name}" does not exist.'
            })

        return result

    def check_slot(self, slot, exclude_id=None):
        if not slot.is_available:
            raise ValidationError({
                'slot': 'This appointment slot is unavailable.'
            })

        start = datetime.combine(
            slot.date,
            slot.start_time
        )

        start = timezone.make_aware(
            start,
            timezone.get_current_timezone()
        )

        if start <= timezone.now():
            raise ValidationError({
                'slot': 'Cannot book a past appointment.'
            })

        if slot.doctor.department is None:
            raise ValidationError({
                'slot': 'Doctor has no department.'
            })

        conflicts = (Appointment.objects.filter(
            doctor=slot.doctor.user,
            appointment_date=slot.date
        )
        .filter(self.active_status_filter()).
        filter(
            Q(
                slot__start_time__lt=slot.end_time,
                slot__end_time__gt=slot.start_time
            ) |
            Q(
                slot__isnull=True,
                appointment_time=slot.start_time
            )
        ))

        if exclude_id is not None:
            conflicts = conflicts.exclude(pk=exclude_id)

        if conflicts.exists():
            raise ValidationError({
                'slot': 'This time is already booked.'
            })

    def create(self, request, *args, **kwargs):
        if (
            request.user.is_staff
            or Doctor.objects.filter(user=request.user).exists()
        ):
            raise PermissionDenied(
                'Only patients can book appointments.'
            )

        serializer = self.get_serializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        requested_slot = serializer.validated_data.get('slot')

        if requested_slot is None:
            raise ValidationError({
                'slot': 'Appointment slot is required.'
            })

        with transaction.atomic():
            slot = AppointmentSlot.objects.select_for_update().get(
                pk=requested_slot.pk
            )

            self.check_slot(slot)

            appointment = Appointment.objects.create(
                patient=request.user,
                doctor=slot.doctor.user,
                department=slot.doctor.department,
                appointment_date=slot.date,
                appointment_time=slot.start_time,
                appointment_status=self.get_status('pending'),
                appointment_details=serializer.validated_data.get(
                    'appointment_details', ''
                ),
                slot=slot
            )

            slot.is_available = False
            slot.save(update_fields=['is_available'])

        return Response(
            {
                'message': 'Appointment booked successfully.',
                'appointment': AppointmentSerializer(
                    appointment
                ).data
            },
            status=status.HTTP_201_CREATED
        )

    def partial_update(self, request, *args, **kwargs):
        if Doctor.objects.filter(user=request.user).exists() and not request.user.is_staff:
            raise PermissionDenied(
                'Doctors cannot edit appointments.'
            )

        serializer = self.get_serializer(
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            allowed = self.get_object()

            appointment = Appointment.objects.select_for_update().get(
                pk=allowed.pk
            )

            if not (
                appointment.appointment_status.name.lower()
                in ['pending', 'approved']
            ):
                raise ValidationError({
                    'status': 'This appointment cannot be edited.'
                })

            old_slot_id = appointment.slot_id
            new_slot = serializer.validated_data.get('slot')

            if new_slot and new_slot.pk != old_slot_id:
                slot_ids = [new_slot.pk]

                if old_slot_id:
                    slot_ids.append(old_slot_id)

                locked_slots = {
                    s.pk: s
                    for s in AppointmentSlot.objects.select_for_update()
                    .select_related('doctor__user', 'doctor__department')
                    .filter(pk__in=slot_ids)
                    .order_by('pk')
                }

                target_slot = locked_slots[new_slot.pk]
                self.check_slot(
                    target_slot,
                    exclude_id=appointment.pk
                )

                if old_slot_id:
                    previous_slot = locked_slots[old_slot_id]
                    previous_slot.is_available = True
                    previous_slot.save(
                        update_fields=['is_available']
                    )

                appointment.slot = target_slot
                appointment.doctor = target_slot.doctor.user
                appointment.department = target_slot.doctor.department
                appointment.appointment_date = target_slot.date
                appointment.appointment_time = target_slot.start_time

                target_slot.is_available = False
                target_slot.save(
                    update_fields=['is_available']
                )

            if 'appointment_details' in serializer.validated_data:
                appointment.appointment_details = (
                    serializer.validated_data['appointment_details']
                )

            appointment.save()

        return Response(
            AppointmentSerializer(appointment).data
        )

    @action(detail=True, methods=['post'], url_path='doctor-status')
    def doctor_status(self, request, pk=None):
        if (request.user.is_staff or not Doctor.objects.filter(user=request.user).exists()):
            raise PermissionDenied('Only doctors can manage their appointments.')

        decision = request.data.get('status')

        if decision not in ['approved', 'canceled']:
            raise ValidationError({'status': 'Choose approved or canceled.'})

        with transaction.atomic():
            appointment = Appointment.objects.select_for_update().get(pk=self.get_object().pk)

            if appointment.doctor_id != request.user.id:
                raise PermissionDenied('You can only manage your own appointments.')

            current_status = appointment.appointment_status.name.lower()

            if decision == 'approved':
                if current_status != 'pending':
                    raise ValidationError({'status': 'Only pending appointments can be approved.'})
                appointment.appointment_status = self.get_status('approved')

            elif decision == 'canceled':
                if current_status not in ['pending', 'approved']:
                    raise ValidationError({'status': 'This appointment cannot be canceled.'})

                if appointment.slot_id:
                    slot = AppointmentSlot.objects.select_for_update().get(
                        pk=appointment.slot_id
                    )

                    slot.is_available = True
                    slot.save(update_fields=['is_available'])

                appointment.appointment_status = self.get_status('canceled')

            appointment.save(update_fields=['appointment_status'])

        return Response({
            'message': f'Appointment {decision} successfully.',
            'appointment': AppointmentSerializer(appointment).data
        })



    def destroy(self, request, *args, **kwargs):
        if Doctor.objects.filter(user=request.user).exists() and not request.user.is_staff:
            raise PermissionDenied(
                'Doctors cannot cancel appointments.'
            )

        with transaction.atomic():
            allowed = self.get_object()

            appointment = Appointment.objects.select_for_update().get(
                pk=allowed.pk
            )

            if appointment.appointment_status.name.lower() not in [
                'pending', 'approved'
            ]:
                raise ValidationError({
                    'status': 'This appointment cannot be canceled.'
                })

            if appointment.slot_id:
                slot = AppointmentSlot.objects.select_for_update().get(
                    pk=appointment.slot_id
                )
                slot.is_available = True
                slot.save(update_fields=['is_available'])

            appointment.appointment_status = self.get_status('canceled')
            appointment.save(
                update_fields=['appointment_status']
            )

        return Response({
            'message': 'Appointment canceled successfully.'
        })

class AdminPatientViewSet(viewsets.ModelViewSet):
    serializer_class = AdminPatientSerializer
    permission_classes = [IsAdminUser]

    http_method_names = [
        'get',
        'patch',
        'delete',
        'head',
        'options'
    ]

    def get_queryset(self):
        return User.objects.filter(
            is_staff=False,
            is_superuser=False,
            doctor_profile__isnull=True
        ).exclude(
            groups__name="Doctor"
        ).distinct().order_by("id")

    def destroy(self, request, *args, **kwargs):
        patient = self.get_object()

        if not patient.is_active:
            return Response(
                {'message': 'Patient is already disabled.'},
                status=status.HTTP_200_OK
            )

        with transaction.atomic():
            patient.is_active = False
            patient.save(update_fields=['is_active'])

            Token.objects.filter(user=patient).delete()

        return Response(
            {'message': 'Patient account disabled successfully.'},
            status=status.HTTP_200_OK
        )

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request,*args,**kwargs)

        if response.data.get('is_active') is False:
            Token.objects.filter(
                user_id=response.data['id']
            ).delete()

        return response



class AdminDepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminUser]

    queryset =  Department.objects.all().order_by('name')

    def perform_create(self, serializer):
        name = serializer.validated_data['name'].strip()

        if Department.objects.filter(
            name__iexact=name
        ).exists():
            raise ValidationError({
                'name': 'This department already exists.'
            })

        serializer.save(name=name)

    def perform_update(self, serializer):
        name = serializer.validated_data.get(
            'name',
            serializer.instance.name
        ).strip()

        existing = Department.objects.filter(
            name__iexact=name
        ).exclude(
            pk=serializer.instance.pk
        )

        if existing.exists():
            raise ValidationError({
                'name': 'This department already exists.'
            })

        serializer.save(name=name)

    def destroy(self, request, *args, **kwargs):
        department = self.get_object()

        if Doctor.objects.filter(
            department=department
        ).exists():
            return Response(
                {
                    'error': (
                        'This department has doctors '
                        'and cannot be deleted.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if Appointment.objects.filter(
            department=department
        ).exists():
            return Response(
                {
                    'error': (
                        'This department has appointment records '
                        'and cannot be deleted.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        department.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


