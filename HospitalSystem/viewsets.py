
from django.db import IntegrityError, transaction
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from .models import AppointmentSlot, Doctor, Appointment
from .serializers import AppointmentSlotSerializer, AdminDoctorSerializer
from .permissions import IsAdminOrReadOnly


class AppointmentSlotViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSlotSerializer
    permission_classes = [IsAdminOrReadOnly]

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
