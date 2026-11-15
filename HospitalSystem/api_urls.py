
from django.urls import path

from . import api_views
from . import auth_views
from rest_framework.routers import DefaultRouter
from .viewsets import AppointmentSlotViewSet



urlpatterns = [
    path('', api_views.api_home, name='api_home'),
    path('departments/', api_views.api_departments, name='api_departments'),
    path('doctors/', api_views.api_doctors, name='api_doctors'),
    path('statuses/', api_views.api_statuses, name='api_statuses'),
    path('register/', auth_views.api_register, name='api_register'),
    path('login/', auth_views.api_login, name='api_login'),
    path('logout/', auth_views.api_logout, name='api_logout'),
    path('me/', auth_views.api_me, name='api_me'),
]

router = DefaultRouter()

router.register(
    r'slots',
    AppointmentSlotViewSet,
    basename='appointment-slot'
)

urlpatterns += router.urls
