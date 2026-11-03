
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Department, Doctor, Status
from .serializers import (
    DepartmentSerializer,
    DoctorSerializer,
    StatusSerializer
)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_home(request):
    return Response({
        'message': 'Piki Ora Medical Centre API',
        'status': 'success'
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def api_departments(request):
    departments = Department.objects.all().order_by('name')

    serializer = DepartmentSerializer(
        departments,
        many=True
    )

    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_doctors(request):
    doctors = Doctor.objects.select_related(
        'user',
        'department'
    ).order_by('user__first_name')

    serializer = DoctorSerializer(
        doctors,
        many=True
    )

    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def api_statuses(request):
    statuses = Status.objects.all().order_by('name')

    serializer = StatusSerializer(
        statuses,
        many=True
    )

    return Response(serializer.data)
