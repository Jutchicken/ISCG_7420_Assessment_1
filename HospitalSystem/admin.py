from django.contrib import admin

from HospitalSystem.models import Department, Appointment, Status

# Register your models here.
admin.site.register(Department)
admin.site.register(Appointment)
admin.site.register(Status)


