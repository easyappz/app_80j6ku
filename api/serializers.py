from rest_framework import serializers
from .models import Member, Project, Asset, EditHistory


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


class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.IntegerField(source="owner_id", read_only=True)
    assets_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Project
        fields = ["id", "owner", "title", "assets_count", "created_at", "updated_at"]
        read_only_fields = ["id", "owner", "created_at", "updated_at", "assets_count"]


class AssetSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = ["id", "project", "original_name", "size", "mime", "file", "created_at"]
        read_only_fields = ["id", "project", "created_at", "file"]

    def get_file(self, obj):
        try:
            url = obj.file.url
        except Exception:
            return ""
        # Return relative URL path (e.g., /media/videos/filename.mp4)
        return url


class EditHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EditHistory
        fields = ["id", "project", "action", "params", "created_at"]
        read_only_fields = ["id", "project", "created_at"]
