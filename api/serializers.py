from rest_framework import serializers
from .models import Member


class MessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=200)
    timestamp = serializers.DateTimeField(read_only=True)


class MemberSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Member
        fields = ["id", "email", "name", "created_at", "updated_at"]


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(allow_blank=True, required=False, max_length=255)
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_email(self, value: str) -> str:
        if Member.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already registered")
        return value

    def create(self, validated_data):
        name = validated_data.get("name", "")
        member = Member(email=validated_data["email"], name=name)
        member.set_password(validated_data["password"])
        member.save()
        return member


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        try:
            member = Member.objects.get(email=email)
        except Member.DoesNotExist:
            raise serializers.ValidationError({"email": "Invalid credentials"})
        if not member.check_password(password):
            raise serializers.ValidationError({"password": "Invalid credentials"})
        attrs["member"] = member
        return attrs
