
from django.contrib.auth import authenticate

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    permission_classes
)
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated
)
from rest_framework.response import Response

from .auth_serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    user = serializer.save()
    token, _ = Token.objects.get_or_create(user=user)

    return Response(
        {
            'message': 'Registration successful.',
            'token': token.key,
            'user': UserSerializer(user).data
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    user = authenticate(
        request,
        username=username,
        password=password
    )

    if user is None:
        return Response(
            {'error': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'error': 'This account is inactive.'},
            status=status.HTTP_403_FORBIDDEN
        )

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'message': 'Login successful.',
        'token': token.key,
        'user': UserSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    if request.auth is not None:
        request.auth.delete()

    return Response({
        'message': 'Logout successful.'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_me(request):
    serializer = UserSerializer(request.user)

    data = serializer.data.copy()

    data['is_staff'] = request.user.is_staff
    data['is_superuser'] = request.user.is_superuser
    data['is_doctor'] = hasattr(request.user, 'doctor_profile')

    return Response(data)