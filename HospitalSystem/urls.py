from django.urls import path

from . import views
from .views import home, register_view, login_view, logout_view, doctor_list, doctor_detail, book_appointment, \
    appointment_list, appointment_edit, appointment_cancel, admin_dashboard, admin_appointment_list, admin_doctor_list, \
    admin_patient_list, admin_department_list, admin_doctor_edit, admin_doctor_delete, admin_department_edit, \
    admin_department_delete, admin_doctor_add, admin_department_add, doctor_dashboard, patient_dashboard

urlpatterns = [
    path('', home, name='home'),
    path('register/', register_view, name='register'),
    path('login/', login_view,name='login'),
    path('logout/', logout_view, name='logout'),
    path('doctors/', doctor_list, name='doctor_list'),
    path('doctors/<int:doctor_id>/', doctor_detail, name='doctor_detail'),
    path('book-appointment/', book_appointment, name='book_appointment'),
    path('appointment-list/', appointment_list, name='appointment_list'),
    path('appointment-edit/<int:appointment_id>/', appointment_edit, name='appointment_edit'),
    path('appointment-cancel/<int:appointment_id>/', appointment_cancel, name='appointment_cancel'),
    # Admin URLs
    path('admin-dashboard/', admin_dashboard, name='admin_dashboard'),
    path('admin-patient-list/', admin_patient_list, name='admin_patient_list'),
    path('admin-doctor-list/', admin_doctor_list, name='admin_doctor_list'),
    path('admin-appointment-list/', admin_appointment_list, name='admin_appointment_list'),
    path('admin-department-list/', admin_department_list, name='admin_department_list'),
    path('admin-doctor-create/', admin_doctor_add, name='admin_doctor_create'),
    path('admin-doctor-edit/<int:doctor_id>/', admin_doctor_edit, name='admin_doctor_edit'),
    path('admin-doctor-delete/<int:doctor_id>/', admin_doctor_delete, name='admin_doctor_delete'),
    path('admin-department-create/', admin_department_add, name='admin_department_create'),
    path('admin-department-edit/<int:department_id>/', admin_department_edit, name='admin_department_edit'),
    path('admin-department-delete/<int:department_id>/', admin_department_delete, name='admin_department_delete'),
    # Doctor URLs
    path('doctor_dashboard/', doctor_dashboard, name='doctor_dashboard'),
    # Patient URLs
    path('patient_dashboard/', patient_dashboard, name='patient_dashboard'),
]