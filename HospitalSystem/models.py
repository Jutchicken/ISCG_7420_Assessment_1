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

    slot = models.ForeignKey(
        'AppointmentSlot',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='appointments'
    )

    def __str__(self):
        return f"{self.patient} - {self.appointment_date}"

class AppointmentSlot(models.Model):
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='appointment_slots'
    )

    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ['date', 'start_time']

        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'date', 'start_time'],
                name='unique_doctor_appointment_slot'
            ),

            models.CheckConstraint(
                condition=models.Q(
                    end_time__gt=models.F('start_time')
                ),
                name='appointment_slot_valid_time'
            )
        ]

    def __str__(self):
        return (
            f"{self.doctor} - {self.date} "
            f"{self.start_time} - {self.end_time}"
        )


