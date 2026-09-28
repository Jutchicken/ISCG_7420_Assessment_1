from django.contrib import messages
from django.contrib.auth import logout, login, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.shortcuts import render, get_object_or_404, redirect

from HospitalSystem.forms import RegisterForm, AppointmentForm, LoginForm
from HospitalSystem.models import Doctor, Appointment, Status


def home(request):
    return render(request, 'HospitalSystem/home.html')


def register_view(request):
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        form = RegisterForm(request.POST)

        if form.is_valid():
            user = form.save()
            login(request,user)
            messages.success(request,"Registration successful.")
            return redirect("home")

    else:
        form = RegisterForm()

    return render(
        request,
        "HospitalSystem/register.html",
        {
            "form": form
        }
    )


def login_view(request):

    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        form = LoginForm(request.POST)

        if form.is_valid():
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]

            user = authenticate(request, username=username, password=password)

            if user is not None:
                login(request,user)
                messages.success(request,"Login successful.")
                return redirect("home")

            else:
                form.add_error(None,"Invalid username or password.")

    else:
        form = LoginForm()

    return render(
        request,
        "registration/login.html",
        {"form": form}
    )


@login_required
def logout_view(request):
    logout(request)
    messages.success(request,"You have been logged out.")
    return redirect("home")


def doctor_list(request):
    doctors = Doctor.objects.select_related(
        "user",
        "department"
    )

    return render(
        request,
        "HospitalSystem/doctor_list.html",
        {"doctors": doctors}
    )


def doctor_detail(request, doctor_id):

    doctor = get_object_or_404(
        Doctor.objects.select_related(
            "user",
            "department"
        ),
        id=doctor_id
    )

    appointments = Appointment.objects.filter(
        doctor=doctor.user
    ).select_related(
        "department",
        "appointment_status"
    ).order_by(
        "appointment_date",
        "appointment_time"
    )

    return render(
        request,
        "HospitalSystem/doctor_detail.html",
        {
            "doctor": doctor,
            "appointments": appointments,
        }
    )


@login_required
def book_appointment(request):

    if request.method == "POST":

        form = AppointmentForm(
            request.POST
        )

        if form.is_valid():
            doctor = form.cleaned_data["doctor"]
            appointment_date = form.cleaned_data["appointment_date"]
            appointment_time = form.cleaned_data["appointment_time"]

            already_booked = Appointment.objects.filter(
                doctor=doctor.user,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
            ).exists()

            if already_booked:
                form.add_error(
                    None,
                    "This appointment slot is already booked."
                )

            else:
                appointment = form.save(
                    commit=False
                )

                appointment.patient = request.user
                appointment.department = doctor.department

                # Find Pending status
                pending_status = Status.objects.filter(
                    name__iexact="Pending"
                ).first()

                if pending_status is None:
                    form.add_error(
                        None,
                        "Pending appointment status does not exist."
                    )

                else:
                    appointment.appointment_status = (pending_status)
                    appointment.save()

                    messages.success(
                        request,
                        "Your appointment has been booked successfully."
                    )

                    return redirect(
                        "appointment_list"
                    )

    else:
        form = AppointmentForm()

    return render(
        request,
        "HospitalSystem/book_appointment.html",
        {
            "form": form
        }
    )


@login_required
def appointment_list(request):
    appointments = Appointment.objects.filter(
        patient=request.user
    ).select_related(
        "doctor",
        "department",
        "appointment_status",
    ).order_by(
        "appointment_date",
        "appointment_time"
    )

    return render(
        request,
        "HospitalSystem/appointment_list.html",
        {
            "appointments": appointments
        }
    )


@login_required
def appointment_edit(request, appointment_id):
    appointment = get_object_or_404(
        Appointment,
        id=appointment_id,
        patient=request.user
    )

    if request.method == "POST":
        form = AppointmentForm(
            request.POST,
            instance=appointment
        )

        if form.is_valid():
            doctor = form.cleaned_data["doctor"]
            appointment_date = form.cleaned_data[
                "appointment_date"
            ]

            appointment_time = form.cleaned_data["appointment_time"]

            already_booked = Appointment.objects.filter(
                doctor=doctor.user,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
            ).exclude(
                id=appointment.id
            ).exists()

            if already_booked:
                form.add_error(
                    None,
                    "This appointment slot is already booked."
                )

            else:
                updated_appointment = form.save(
                    commit=False
                )

                updated_appointment.patient = request.user
                updated_appointment.department = doctor.department

                updated_appointment.appointment_status = (
                    appointment.appointment_status
                )

                updated_appointment.save()

                messages.success(
                    request,
                    "Your appointment has been updated successfully."
                )

                return redirect(
                    "appointment_list"
                )

    else:
        # Convert existing User doctor back to Doctor
        current_doctor = Doctor.objects.filter(
            user=appointment.doctor
        ).first()

        initial_data = {}

        if current_doctor:
            initial_data["doctor"] = current_doctor

        form = AppointmentForm(
            instance=appointment,
            initial=initial_data
        )

    return render(
        request,
        "HospitalSystem/appointment_edit.html",
        {
            "form": form,
            "appointment": appointment,
        }
    )


@login_required
def appointment_cancel(request,appointment_id):

    appointment = get_object_or_404(
        Appointment,
        id=appointment_id,
        patient=request.user
    )

    if request.method == "POST":
        cancelled_status = Status.objects.filter(name__iexact="Cancelled").first()

        if cancelled_status:
            appointment.appointment_status = (
                cancelled_status
            )

            appointment.save()

            messages.success(
                request,
                "Your appointment has been cancelled."
            )

        else:
            messages.error(
                request,
                "Cancelled status does not exist."
            )

        return redirect("appointment_list")

    return render(
        request,
        "HospitalSystem/appointment_cancel.html",
        {
            "appointment": appointment
        }
    )


def is_admin(user):
    return (
        user.is_authenticated
        and user.is_staff
    )


@user_passes_test(is_admin)
def admin_dashboard(request):
    doctors = Doctor.objects.select_related(
        "user",
        "department"
    )

    appointments = Appointment.objects.select_related(
        "patient",
        "doctor",
        "department",
        "appointment_status"
    )

    patients = User.objects.filter(
        is_staff=False
    )

    return render(
        request,
        "HospitalSystem/admin_dashboard.html",
        {
            "doctors": doctors,
            "appointments": appointments,
            "patients": patients,
        }
    )


@user_passes_test(is_admin)
def admin_doctor_list(request):
    doctors = Doctor.objects.select_related(
        "user",
        "department"
    )

    return render(
        request,
        "HospitalSystem/admin_doctor_list.html",
        {
            "doctors": doctors
        }
    )


@user_passes_test(is_admin)
def admin_doctor_delete(request, doctor_id):
    doctor = get_object_or_404(
        Doctor,
        id=doctor_id
    )

    if request.method == "POST":
        user = doctor.user
        doctor.delete()
        user.delete()

        messages.success(request,"Doctor has been deleted.")

        return redirect("admin_doctor_list")

    return render(
        request,
        "HospitalSystem/admin_doctor_delete.html",
        {
            "doctor": doctor
        }
    )


@user_passes_test(is_admin)
def admin_appointment_list(request):
    appointments = Appointment.objects.select_related(
        "patient",
        "doctor",
        "department",
        "appointment_status"
    ).order_by(
        "appointment_date",
        "appointment_time"
    )

    return render(
        request,
        "HospitalSystem/admin_appointment_list.html",
        {"appointments": appointments}
    )


@user_passes_test(is_admin)
def admin_appointment_cancel(request, appointment_id):
    appointment = get_object_or_404(
        Appointment,
        id=appointment_id
    )

    if request.method == "POST":
        cancelled_status = Status.objects.filter(
            name__iexact="Cancelled"
        ).first()

        if cancelled_status:
            appointment.appointment_status = (
                cancelled_status
            )
            appointment.save()
            messages.success(request,"Appointment has been cancelled.")

        return redirect(
            "admin_appointment_list"
        )

    return render(
        request,
        "HospitalSystem/admin_appointment_cancel.html",
        {
            "appointment": appointment
        }
    )


@user_passes_test(is_admin)
def admin_patient_list(request):
    patients = User.objects.filter(
        is_staff=False
    ).order_by(
        "username"
    )

    return render(
        request,
        "HospitalSystem/admin_patient_list.html",
        {"patients": patients}
    )