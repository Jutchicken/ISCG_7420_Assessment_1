from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

class Department(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Status(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    doctor_details = models.TextField(blank=True)

    def __str__(self):
        return f"Dr. {self.user.get_full_name()}"

class Appointment(models.Model):
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='patient_appointments',
    )
    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='doctor_appointments',
    )
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    appointment_status = models.ForeignKey(Status, on_delete=models.CASCADE)
    appointment_details = models.TextField()

    def __str__(self):
        return f"{self.patient} - {self.appointment_date}"

