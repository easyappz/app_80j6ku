from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from .serializers import MessageSerializer, RegisterSerializer, LoginSerializer, MemberSerializer
from .authentication import MemberJWTAuthentication
from .auth import create_jwt


class HelloView(APIView):
    """
    A simple API endpoint that returns a greeting message.
    """

    @extend_schema(
        responses={200: MessageSerializer}, description="Get a hello world message"
    )
    def get(self, request):
        data = {"message": "Hello!", "timestamp": timezone.now()}
        serializer = MessageSerializer(data)
        return Response(serializer.data)


class AuthRegisterView(APIView):
    @extend_schema(
        request=RegisterSerializer,
        responses={201: {"type": "object", "properties": {"message": {"type": "string"}}}},
        description="Register a new member",
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "registered"}, status=status.HTTP_201_CREATED)


class AuthLoginView(APIView):
    @extend_schema(
        request=LoginSerializer,
        responses={200: {"type": "object"}},
        description="Login and obtain JWT token",
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = serializer.validated_data["member"]
        token = create_jwt({"id": member.id, "email": member.email})
        return Response({"token": token, "member": MemberSerializer(member).data}, status=status.HTTP_200_OK)


class ProfileView(APIView):
    authentication_classes = [MemberJWTAuthentication]

    @extend_schema(
        responses={200: MemberSerializer},
        description="Get authenticated member profile",
    )
    def get(self, request):
        member = getattr(request, "member", None)
        return Response(MemberSerializer(member).data)
