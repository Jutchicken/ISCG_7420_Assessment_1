from django.urls import path

from . import views
from .views import home, register_view, login_view, logout_view, doctor_list, doctor_detail, book_appointment, \
    appointment_list, appointment_edit, appointment_cancel, admin_dashboard, admin_appointment_list, admin_doctor_list, \
    admin_patient_list

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
    path('admin-dashboard/', admin_dashboard, name='admin_dashboard'),
    path('admin-patient-list/', admin_patient_list, name='admin_patient_list'),
    path('admin-doctor-list/', admin_doctor_list, name='admin_doctor_list'),
    path('admin-appointment-list/', admin_appointment_list, name='admin_appointment_list'),


]