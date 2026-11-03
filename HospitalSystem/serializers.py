
from rest_framework import serializers

from .models import Department, Status, Doctor, Appointment


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
