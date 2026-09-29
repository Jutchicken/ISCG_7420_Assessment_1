from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User, Group

from HospitalSystem.models import Appointment, Doctor, Department


class RegisterForm(UserCreationForm):
    ROLE_CHOICES = (
        ('Patient', 'Patient'),
        ('Doctor', 'Doctor'),
    )

    email = forms.EmailField(required=True)

    role = forms.ChoiceField(
        choices=ROLE_CHOICES,
        widget=forms.RadioSelect
    )

    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'password1',
            'password2'
        ]

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']

        if commit:
            user.save()
            role = self.cleaned_data['role']
            group, created = Group.objects.get_or_create(name=role)
            user.groups.add(group)

        return user

class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField(
        widget=forms.PasswordInput
    )

class DoctorForm(forms.ModelForm):
    username = forms.CharField()
    first_name = forms.CharField()
    last_name = forms.CharField()
    email = forms.EmailField(required=False)
    password = forms.CharField(
        widget=forms.PasswordInput,
        required=False
    )

    class Meta:
        model = Doctor
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'password',
            'department',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if self.instance and self.instance.pk:
            user = self.instance.user
            self.fields['username'].initial = user.username
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name
            self.fields['email'].initial = user.email

    def save(self, commit=True):
        doctor = super().save(commit=False)
        if doctor.pk:
            user = doctor.user
            user.username = self.cleaned_data['username']
            user.first_name = self.cleaned_data['first_name']
            user.last_name = self.cleaned_data['last_name']
            user.email = self.cleaned_data['email']
            password = self.cleaned_data.get('password')

            if password:
                user.set_password(password)

            if commit:
                user.save()

        else:
            user = User.objects.create_user(
                username=self.cleaned_data['username'],
                first_name=self.cleaned_data['first_name'],
                last_name=self.cleaned_data['last_name'],
                email=self.cleaned_data['email'],
                password=self.cleaned_data['password']
            )

            doctor.user = user
            group, created = Group.objects.get_or_create(name='Doctor')
            user.groups.add(group)

            if commit:
                user.save()

        if commit:
            doctor.save()

        return doctor

class PatientForm(forms.ModelForm):
    username = forms.CharField()
    first_name = forms.CharField()
    last_name = forms.CharField()
    email = forms.EmailField(required=False)

    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'email'
        ]

class DepartmentForm(forms.ModelForm):

    class Meta:
        model = Department
        fields = ['name']

class AppointmentForm(forms.ModelForm):
    class Meta:
        model = Appointment
        fields = [
            'doctor',
            'appointment_date',
            'appointment_time',
            'appointment_details'
        ]

        widgets = {
            'appointment_date': forms.DateInput(
                attrs={'type': 'date'}
            ),
            'appointment_time': forms.TimeInput(
                attrs={'type': 'time'}
            )
        }