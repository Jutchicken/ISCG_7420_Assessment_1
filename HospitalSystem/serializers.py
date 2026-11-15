from django.utils import timezone
from rest_framework import serializers

from .models import Department, Status, Doctor, Appointment, AppointmentSlot


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ['id', 'name']


class DoctorSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(
        source='user.first_name',
        read_only=True
    )
    last_name = serializers.CharField(
        source='user.last_name',
        read_only=True
    )
    department_name = serializers.CharField(
        source='department.name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Doctor
        fields = [
            'id',
            'first_name',
            'last_name',
            'department',
            'department_name'
        ]


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(
        source='patient.username',
        read_only=True
    )
    doctor_name = serializers.CharField(
        source='doctor.username',
        read_only=True
    )
    department_name = serializers.CharField(
        source='department.name',
        read_only=True
    )
    status_name = serializers.CharField(
        source='appointment_status.name',
        read_only=True
    )

    class Meta:
        model = Appointment
        fields = [
            'id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_name',
            'department',
            'department_name',
            'appointment_date',
            'appointment_time',
            'appointment_status',
            'status_name',
            'appointment_details'
        ]

class AppointmentSlotSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(
        source='doctor.user.get_full_name',
        read_only=True
    )

    class Meta:
        model = AppointmentSlot
        fields = [
            'id',
            'doctor',
            'doctor_name',
            'date',
            'start_time',
            'end_time',
            'is_available',
        ]

    def validate(self, attrs):
        instance = self.instance

        doctor = attrs.get(
            'doctor',
            instance.doctor if instance else None
        )
        date = attrs.get(
            'date',
            instance.date if instance else None
        )
        start_time = attrs.get(
            'start_time',
            instance.start_time if instance else None
        )
        end_time = attrs.get(
            'end_time',
            instance.end_time if instance else None
        )

        if not all([doctor, date, start_time, end_time]):
            raise serializers.ValidationError(
                'Doctor, date and times are required.'
            )

        if end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })

        today = timezone.localdate()
        now_time = timezone.localtime().time().replace(
            tzinfo=None
        )

        if date < today or (
            date == today and start_time <= now_time
        ):
            raise serializers.ValidationError({
                'date': 'The slot must start in the future.'
            })

        overlapping = AppointmentSlot.objects.filter(
            doctor=doctor,
            date=date,
            start_time__lt=end_time,
            end_time__gt=start_time
        )

        if instance:
            overlapping = overlapping.exclude(pk=instance.pk)

        if overlapping.exists():
            raise serializers.ValidationError({
                'start_time': 'This doctor already has an overlapping slot.'
            })

        return attrs

