from django import forms
from django.contrib.auth.models import User

from HospitalSystem.models import Appointment, Doctor


class RegisterForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    password_confirm = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ["username","email","first_name","last_name","password", "password_confirm"]

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        password_confirm = cleaned_data.get("password_confirm")

        if password and password_confirm:
            if password != password_confirm:
                raise forms.ValidationError(
                    "Passwords do not match."
                )

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()

        return user

class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(
        widget=forms.PasswordInput
    )


class AppointmentForm(forms.ModelForm):

    doctor = forms.ModelChoiceField(
        queryset=Doctor.objects.select_related(
            "user",
            "department"
        ),
        empty_label="Select a doctor"
    )

    class Meta:
        model = Appointment

        fields = [
            "doctor",
            "appointment_date",
            "appointment_time",
            "appointment_details",
        ]

        widgets = {
            "appointment_date": forms.DateInput(
                attrs={"type": "datetime-local"}
            ),

            "appointment_time": forms.TimeInput(
                attrs={"type": "time"}
            ),

            "appointment_details": forms.Textarea(
                attrs={"rows": 4, "placeholder": "Enter appointment details..."}
            ),
        }

        def save(self, commit=True):
            appointment = super().save(commit=False)

            appointment.doctor = self.cleaned_data["doctor"].user

            if commit:
                appointment.save()

            return appointment