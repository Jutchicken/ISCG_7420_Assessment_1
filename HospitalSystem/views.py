from django.contrib import messages
from django.contrib.auth import logout, login, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.shortcuts import render, get_object_or_404, redirect

from HospitalSystem.forms import RegisterForm, AppointmentForm, DoctorForm, DepartmentForm
from HospitalSystem.models import Doctor, Appointment, Status, Department


def home(request):
    return render(request, 'HospitalSystem/home.html')


def is_admin(user):
    return user.is_authenticated and user.is_staff


def is_doctor(user):
    return (
        user.is_authenticated and
        user.groups.filter(name='Doctor').exists()
    )


def is_patient(user):
    return (
        user.is_authenticated and
        user.groups.filter(name='Patient').exists()
    )


def register_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')

    if request.method == 'POST':
        form = RegisterForm(request.POST)

        if form.is_valid():
            user = form.save()
            messages.success(request, 'Your account has been created successfully.')
            return redirect('login')

    else:
        form = RegisterForm()

    return render(request, 'registration/register.html', {'form': form})


def login_view(request):

    if request.user.is_authenticated:
        return redirect("dashboard")

    if request.method == 'POST':

        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            login(request, user)

            return redirect('dashboard')

        messages.error(
            request,
            'Invalid username or password.'
        )

    return render(request,'registration/login.html')


@login_required
def logout_view(request):
    logout(request)
    messages.success(request,"You have been logged out.")
    return redirect("login")


@login_required
def dashboard(request):
    user = request.user

    if is_admin(user):
        return redirect('admin_dashboard')

    if is_doctor(user):
        return redirect('doctor_dashboard')

    if is_patient(user):
        return redirect('patient_dashboard')

    messages.error(request, 'Your account does not have a valid role.')
    return redirect('home')


@login_required
def doctor_list(request):
    if not (is_admin(request.user) or is_patient(request.user)):
        return redirect('dashboard')

    doctors = Doctor.objects.select_related('user', 'department')
    return render( request, 'HospitalSystem/doctor_list.html', {'doctors': doctors})


@login_required
def doctor_detail(request, doctor_id):
    if not (is_admin(request.user) or is_patient(request.user)):
        return redirect('dashboard')
    doctor = get_object_or_404(Doctor.objects.select_related('user', 'department'), id=doctor_id)
    return render( request, 'HospitalSystem/doctor_detail.html', {'doctor': doctor})


@login_required
def book_appointment(request):
    if not (is_admin(request.user) or is_patient(request.user)):
        return redirect('dashboard')

    if request.method == 'POST':
        form = AppointmentForm(request.POST)

        if form.is_valid():
            appointment = form.save(commit=False)
            doctor = appointment.doctor

            existing = Appointment.objects.filter(
                doctor=doctor,
                appointment_date=appointment.appointment_date,
                appointment_time=appointment.appointment_time
            ).exclude(
                appointment_status__name='Cancelled'
            ).exists()

            if existing:
                messages.error(request, 'This appointment slot is already booked.')

                return render(
                    request,
                    'HospitalSystem/book_appointment.html',
                    {'form': form}
                )
            appointment.patient = request.user
            appointment.department = doctor.doctor_profile.department
            pending_status, created = Status.objects.get_or_create(name='Pending')
            appointment.appointment_status = pending_status
            appointment.save()
            messages.success(request, 'Appointment booked successfully.')

            return redirect('appointment_list')

    else:
        form = AppointmentForm()

    return render(
        request,
        'HospitalSystem/book_appointment.html',
        {
            'form': form
        }
    )


@login_required
def appointment_list(request):
    if not (is_admin(request.user) or is_patient(request.user)):
        return redirect('dashboard')

    appointments = Appointment.objects.filter(
        patient=request.user
    ).select_related(
        'doctor',
        'department',
        'appointment_status'
    ).order_by(
        'appointment_date',
        'appointment_time'
    )

    return render(
        request,
        'HospitalSystem/appointment_list.html',
        {
            'appointments': appointments
        }
    )


@login_required
def appointment_edit(request, appointment_id):
    if not is_patient(request.user):
        return redirect('dashboard')

    appointment = get_object_or_404(
        Appointment,
        id=appointment_id,
        patient=request.user
    )

    if appointment.appointment_status.name == 'Cancelled':

        messages.error(request, 'Cancelled appointments cannot be edited.')

        return redirect('appointment_list')

    if request.method == 'POST':
        form = AppointmentForm(request.POST, instance=appointment)

        if form.is_valid():
            new_appointment = form.save(commit=False)

            existing = Appointment.objects.filter(
                doctor=new_appointment.doctor,
                appointment_date=new_appointment.appointment_date,
                appointment_time=new_appointment.appointment_time
            ).exclude(
                id=appointment.id
            ).exclude(
                appointment_status__name='Cancelled'
            ).exists()

            if existing:
                messages.error(request, 'This appointment slot is already booked.')
                return render(request, 'HospitalSystem/appointment_edit.html', {'form': form})

            new_appointment.patient = request.user
            new_appointment.department = (new_appointment.doctor.doctor_profile.department)
            new_appointment.appointment_status = (appointment.appointment_status)
            new_appointment.save()
            messages.success(request, 'Appointment updated successfully.')

            return redirect('appointment_list')

    else:
        form = AppointmentForm(instance=appointment)

    return render(request, 'HospitalSystem/appointment_edit.html', {'form': form})


@login_required
def appointment_cancel(request, appointment_id):
    if not is_patient(request.user):
        return redirect('dashboard')

    appointment = get_object_or_404(
        Appointment,
        id=appointment_id,
        patient=request.user
    )

    if request.method == 'POST':
        cancelled_status, created = Status.objects.get_or_create(name='Cancelled')
        appointment.appointment_status = cancelled_status
        appointment.save()
        messages.success( request, 'Appointment cancelled successfully.')

    return redirect('appointment_list')


# Admin
@login_required
def admin_dashboard(request):

    if not is_admin(request.user):
        messages.error(request,'You do not have permission to access this page.')
        return redirect('dashboard')

    context = {
        'doctor_count': Doctor.objects.count(),
        'patient_count': User.objects.filter(
            groups__name='Patient'
        ).count(),
        'department_count': Department.objects.count(),
        'appointment_count': Appointment.objects.count(),
    }

    return render(request, 'Admin/admin_dashboard.html', context)


# Admin - Doctor
@login_required
def admin_doctor_list(request):
    if not is_admin(request.user):
        return redirect('dashboard')

    doctors = Doctor.objects.select_related('user', 'department')

    return render(
        request,
        'Admin/admin_doctor_list.html',
        {'doctors': doctors}
    )


@login_required
def admin_doctor_add(request):
    if not is_admin(request.user):
        return redirect('dashboard')

    if request.method == 'POST':
        form = DoctorForm(request.POST)

        if form.is_valid():
            form.save()
            messages.success(request, 'Doctor added successfully.')
            return redirect('admin_doctor_list')

    else:
        form = DoctorForm()

    return render(
        request,
        'Admin/admin_doctor_form.html',
        {'form': form, 'title': 'Add Doctor'}
    )


@login_required
def admin_doctor_edit(request, doctor_id):
    if not is_admin(request.user):
        return redirect('dashboard')

    doctor = get_object_or_404(Doctor, id=doctor_id)

    if request.method == 'POST':
        form = DoctorForm(request.POST, instance=doctor)

        if form.is_valid():
            form.save()
            messages.success(request, 'Doctor updated successfully.')
            return redirect('admin_doctor_list')

    else:
        form = DoctorForm(instance=doctor)

    return render(
        request,
        'Admin/admin_doctor_form.html',
        {'form': form, 'title': 'Edit Doctor'}
    )


@login_required
def admin_doctor_delete(request, doctor_id):
    if not is_admin(request.user):
        return redirect('dashboard')

    doctor = get_object_or_404(Doctor, id=doctor_id)

    if request.method == 'POST':
        user = doctor.user
        doctor.delete()
        user.delete()
        messages.success(request, 'Doctor deleted successfully.')

    return redirect('admin_doctor_list')


# Admin - Appointment
@login_required
def admin_appointment_list(request):
    if not is_admin(request.user):
        return redirect('dashboard')

    appointments = Appointment.objects.select_related(
        'patient',
        'doctor',
        'department',
        'appointment_status'
    )

    return render(
        request,
        'Admin/admin_appointment_list.html',
        {'appointments': appointments}
    )


@login_required
def admin_appointment_edit(request, appointment_id):
    if not is_admin(request.user):
        return redirect('dashboard')

    appointment = get_object_or_404(Appointment, id=appointment_id)

    if request.method == 'POST':
        form = AppointmentForm(request.POST, instance=appointment)

        if form.is_valid():
            form.save()
            messages.success(request, 'Appointment updated successfully.')
            return redirect('admin_appointment_list')

    else:
        form = AppointmentForm(instance=appointment)

    return render(
        request,
        'Admin/admin_appointment_form.html',
        {
            'form': form,
            'title': 'Edit Appointment'
        }
    )


@login_required
def admin_appointment_delete(request, appointment_id):

    if not is_admin(request.user):
        return redirect('dashboard')

    appointment = get_object_or_404(Appointment, id=appointment_id)

    if request.method == 'POST':
        appointment.delete()
        messages.success(request, 'Appointment deleted successfully.')

    return redirect('admin_appointment_list')


# Admin - Patient
@login_required
def admin_patient_list(request):
    if not is_admin(request.user):
        return redirect('dashboard')

    patients = User.objects.filter(groups__name='Patient').distinct()

    return render(
        request,
        'Admin/admin_patient_list.html',
        {'patients': patients}
    )


@login_required
def admin_patient_delete(request, patient_id):
    if not is_admin(request.user):
        return redirect('dashboard')

    patient = get_object_or_404(User, id=patient_id)

    if not patient.groups.filter(name='Patient').exists():
        return redirect('admin_patient_list')

    if request.method == 'POST':
        patient.delete()
        messages.success(request, 'Patient deleted successfully.')

    return redirect('admin_patient_list')


# Admin - Department
@login_required
def admin_department_list(request):
    if not is_admin(request.user):
        return redirect('dashboard')

    departments = Department.objects.all()

    return render(
        request,
        'Admin/admin_department_list.html',
        {'departments': departments}
    )


@login_required
def admin_department_add(request):
    if not is_admin(request.user):
        return redirect('dashboard')

    if request.method == 'POST':
        form = DepartmentForm(request.POST)

        if form.is_valid():
            form.save()
            messages.success(request, 'Department added successfully.')
            return redirect('admin_department_list')

    else:
        form = DepartmentForm()

    return render(
        request,
        'Admin/admin_department_form.html',
        {'form': form, 'title': 'Add Department'}
    )


@login_required
def admin_department_edit(request, department_id):
    if not is_admin(request.user):
        return redirect('dashboard')

    department = get_object_or_404(Department,  id=department_id)

    if request.method == 'POST':
        form = DepartmentForm(request.POST, instance=department)

        if form.is_valid():
            form.save()
            messages.success(request, 'Department updated successfully.')
            return redirect('admin_department_list')

    else:
        form = DepartmentForm(instance=department)

    return render(
        request,
        'Admin/admin_department_form.html',
        {'form': form, 'title': 'Edit Department'}
    )


@login_required
def admin_department_delete(request, department_id):
    if not is_admin(request.user):
        return redirect('dashboard')

    department = get_object_or_404(Department, id=department_id)

    if request.method == 'POST':
        department.delete()
        messages.success(request, 'Department deleted successfully.')

    return redirect('admin_department_list')


# Doctor
@login_required
def doctor_dashboard(request):
    if not is_doctor(request.user):
        return redirect('dashboard')

    appointments = Appointment.objects.filter(
        doctor=request.user
    ).select_related(
        'patient',
        'department',
        'appointment_status'
    ).order_by(
        'appointment_date',
        'appointment_time'
    )

    return render(request, 'Doctor/doctor_dashboard.html', {'appointments': appointments})


@login_required
def doctor_appointment_status(request, appointment_id):
    if not is_doctor(request.user):
        return redirect('dashboard')

    appointment = get_object_or_404(Appointment, id=appointment_id, doctor=request.user)

    if request.method == 'POST':
        status_name = request.POST.get('status')

        if status_name not in ['Approved', 'Finished', 'Cancelled']:
            messages.error(request, 'Invalid appointment status.')
            return redirect('doctor_dashboard')

        status, created = Status.objects.get_or_create(name=status_name)
        appointment.appointment_status = status
        appointment.save()
        messages.success(request, f'Appointment status updated to {status_name}.')

    return redirect('doctor_dashboard')


# Patient
@login_required
def patient_dashboard(request):
    if not is_patient(request.user):
        return redirect('dashboard')

    return render(request, 'Patient/patient_dashboard.html')