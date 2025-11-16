from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.conf import settings
from django.db.models import Count
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from .serializers import (
    MessageSerializer,
    RegisterSerializer,
    LoginSerializer,
    MemberSerializer,
    ProjectSerializer,
    AssetSerializer,
    EditHistorySerializer,
)
from .authentication import MemberJWTAuthentication
from .auth import create_jwt
from .permissions import IsOwnerProject
from .models import Project, Asset, EditHistory
import os
from django.core.files.base import File
from django.http import Http404


CHUNK_SIZE = 512 * 1024


class HelloView(APIView):
    """
    A simple API endpoint that returns a greeting message.
    """

    @extend_schema(
        responses={200: MessageSerializer}, description="Get a hello world message"
    )
    def get(self, request):
        data = {"message": "Hello!", "timestamp": timezone.now()}
        serializer = MessageSerializer(instance=data)
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
        serializer.create(serializer.validated_data)
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
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: MemberSerializer},
        description="Get authenticated member profile",
    )
    def get(self, request):
        member = getattr(request, "user", None)
        return Response(MemberSerializer(member).data)


class ProjectListCreateView(APIView):
    authentication_classes = [MemberJWTAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: ProjectSerializer(many=True)})
    def get(self, request):
        qs = Project.objects.filter(owner_id=request.user.id).annotate(assets_count=Count("assets"))
        serializer = ProjectSerializer(qs.order_by("-id"), many=True)
        return Response(serializer.data)

    @extend_schema(request={"type": "object", "properties": {"title": {"type": "string"}}, "required": ["title"]}, responses={201: ProjectSerializer})
    def post(self, request):
        title = (request.data.get("title") or "").strip()
        if not title:
            return Response({"detail": "Title is required"}, status=status.HTTP_400_BAD_REQUEST)
        project = Project.objects.create(owner=request.user, title=title)
        serializer = ProjectSerializer(project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    authentication_classes = [MemberJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerProject]

    def _get_project(self, request, pk: int) -> Project:
        project = get_object_or_404(Project, pk=pk)
        # Object-level permission check
        for permission in self.permission_classes:
            if hasattr(permission, "has_object_permission"):
                perm = permission()
                if not perm.has_object_permission(request, self, project):
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You do not have permission to access this project")
        return project

    @extend_schema(responses={200: ProjectSerializer})
    def get(self, request, pk: int):
        project = self._get_project(request, pk)
        serializer = ProjectSerializer(project)
        return Response(serializer.data)

    @extend_schema(request={"type": "object", "properties": {"title": {"type": "string"}}}, responses={200: ProjectSerializer})
    def patch(self, request, pk: int):
        project = self._get_project(request, pk)
        title = request.data.get("title")
        if title is not None:
            title = title.strip()
            if not title:
                return Response({"detail": "Title cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
            project.title = title
        project.save(update_fields=["title", "updated_at"])
        serializer = ProjectSerializer(project)
        return Response(serializer.data)

    @extend_schema(responses={204: None})
    def delete(self, request, pk: int):
        project = self._get_project(request, pk)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectAssetsView(APIView):
    authentication_classes = [MemberJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerProject]
    parser_classes = [MultiPartParser, FormParser]

    def _get_project(self, request, pk: int) -> Project:
        project = get_object_or_404(Project, pk=pk)
        for permission in self.permission_classes:
            if hasattr(permission, "has_object_permission"):
                perm = permission()
                if not perm.has_object_permission(request, self, project):
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You do not have permission to access this project")
        return project

    @extend_schema(responses={200: AssetSerializer(many=True)})
    def get(self, request, pk: int):
        project = self._get_project(request, pk)
        assets = project.assets.order_by("-id")
        serializer = AssetSerializer(assets, many=True, context={"request": request})
        return Response(serializer.data)

    @extend_schema(
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "file": {"type": "string", "format": "binary"}
                },
                "required": ["file"],
            }
        },
        responses={201: AssetSerializer},
    )
    def post(self, request, pk: int):
        project = self._get_project(request, pk)
        uploaded = request.FILES.get("file")
        if not uploaded:
            return Response({"detail": "File is required"}, status=status.HTTP_400_BAD_REQUEST)

        content_type = getattr(uploaded, "content_type", "") or ""
        if content_type.lower() != "video/mp4":
            return Response({"detail": "Only MP4 videos are allowed"}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded.size > int(getattr(settings, "MAX_UPLOAD_SIZE", 50 * 1024 * 1024)):
            return Response({"detail": "File too large"}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        asset = Asset.objects.create(
            project=project,
            file=uploaded,
            original_name=uploaded.name,
            size=int(uploaded.size),
            mime="video/mp4",
        )
        serializer = AssetSerializer(asset, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectHistoryView(APIView):
    authentication_classes = [MemberJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerProject]

    def _get_project(self, request, pk: int) -> Project:
        project = get_object_or_404(Project, pk=pk)
        for permission in self.permission_classes:
            if hasattr(permission, "has_object_permission"):
                perm = permission()
                if not perm.has_object_permission(request, self, project):
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You do not have permission to access this project")
        return project

    @extend_schema(responses={200: EditHistorySerializer(many=True)})
    def get(self, request, pk: int):
        project = self._get_project(request, pk)
        history = project.history.order_by("-id")
        serializer = EditHistorySerializer(history, many=True)
        return Response(serializer.data)

    @extend_schema(
        request={"type": "object", "properties": {"action": {"type": "string"}, "params": {"type": "object"}}, "required": ["action"]},
        responses={201: EditHistorySerializer},
    )
    def post(self, request, pk: int):
        project = self._get_project(request, pk)
        action = (request.data.get("action") or "").strip()
        params = request.data.get("params") or {}

        allowed = {EditHistory.ACTION_TRIM, EditHistory.ACTION_MERGE, EditHistory.ACTION_ADD_TEXT, EditHistory.ACTION_CROP}
        if action not in allowed:
            return Response({"detail": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(params, dict):
            return Response({"detail": "Params must be an object"}, status=status.HTTP_400_BAD_REQUEST)

        item = EditHistory.objects.create(project=project, action=action, params=params)
        serializer = EditHistorySerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AssetChunkedInitView(APIView):
    authentication_classes = [MemberJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerProject]

    @extend_schema(
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "filename": {"type": "string"},
                    "size": {"type": "integer"},
                    "mime": {"type": "string"},
                },
                "required": ["filename", "size"],
            }
        },
        responses={201: {"type": "object", "properties": {"upload_id": {"type": "string"}, "chunk_size": {"type": "integer"}}}},
    )
    def post(self, request, pk: int):
        project = get_object_or_404(Project, pk=pk)
        # object permission
        for permission in self.permission_classes:
            if hasattr(permission, "has_object_permission"):
                perm = permission()
                if not perm.has_object_permission(request, self, project):
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You do not have permission to access this project")

        filename = (request.data.get("filename") or "").strip()
        total_size = int(request.data.get("size") or 0)
        mime = (request.data.get("mime") or "").strip() or "video/mp4"

        if not filename or total_size <= 0:
            return Response({"detail": "filename and size are required"}, status=status.HTTP_400_BAD_REQUEST)

        # only MP4
        if not filename.lower().endswith(".mp4") or mime.lower() != "video/mp4":
            return Response({"detail": "Only MP4 videos are allowed"}, status=status.HTTP_400_BAD_REQUEST)

        if total_size > int(getattr(settings, "MAX_UPLOAD_SIZE", 50 * 1024 * 1024)):
            return Response({"detail": "File too large"}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        tmp_dir = os.path.join(settings.MEDIA_ROOT, "tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        # unique temp path
        import uuid as _uuid
        uid = _uuid.uuid4()
        temp_path = os.path.join(tmp_dir, f"{uid}.part")

        # touch empty file
        with open(temp_path, "wb") as f:
            pass

        from .models import ChunkedUpload
        cu = ChunkedUpload.objects.create(
            id=uid,
            project=project,
            filename=filename,
            mime="video/mp4",
            total_size=total_size,
            temp_path=temp_path,
        )

        return Response({"upload_id": str(cu.id), "chunk_size": CHUNK_SIZE}, status=status.HTTP_201_CREATED)


class AssetChunkedUploadView(APIView):
    authentication_classes = [MemberJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerProject]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "chunk": {"type": "string", "format": "binary"},
                    "index": {"type": "integer"},
                },
                "required": ["chunk"],
            }
        },
        responses={200: {"type": "object", "properties": {"received": {"type": "integer"}, "done": {"type": "boolean"}}}},
    )
    def post(self, request, pk: int, uid):
        from .models import ChunkedUpload
        try:
            cu = ChunkedUpload.objects.select_related("project").get(id=uid, project_id=pk)
        except ChunkedUpload.DoesNotExist:
            raise Http404

        # object permission check against project
        for permission in self.permission_classes:
            if hasattr(permission, "has_object_permission"):
                perm = permission()
                if not perm.has_object_permission(request, self, cu.project):
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You do not have permission to access this project")

        chunk = request.FILES.get("chunk")
        if not chunk:
            return Response({"detail": "chunk is required"}, status=status.HTTP_400_BAD_REQUEST)

        # prevent overflow
        new_received = cu.received_size + int(chunk.size)
        if new_received > cu.total_size:
            return Response({"detail": "Received size exceeds declared total"}, status=status.HTTP_400_BAD_REQUEST)

        with open(cu.temp_path, "ab") as f:
            for data in chunk.chunks():
                f.write(data)

        cu.received_size = new_received
        cu.save(update_fields=["received_size", "updated_at"])

        done = cu.received_size >= cu.total_size
        return Response({"received": cu.received_size, "done": done})


class AssetChunkedCompleteView(APIView):
    authentication_classes = [MemberJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerProject]

    @extend_schema(responses={201: AssetSerializer})
    def post(self, request, pk: int, uid):
        from .models import ChunkedUpload
        try:
            cu = ChunkedUpload.objects.select_related("project").get(id=uid, project_id=pk)
        except ChunkedUpload.DoesNotExist:
            raise Http404

        # object permission check
        for permission in self.permission_classes:
            if hasattr(permission, "has_object_permission"):
                perm = permission()
                if not perm.has_object_permission(request, self, cu.project):
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied("You do not have permission to access this project")

        if cu.received_size != cu.total_size:
            return Response({"detail": "Upload is not complete"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file still within size and mp4
        if not cu.filename.lower().endswith(".mp4"):
            return Response({"detail": "Only MP4 videos are allowed"}, status=status.HTTP_400_BAD_REQUEST)
        if cu.total_size > int(getattr(settings, "MAX_UPLOAD_SIZE", 50 * 1024 * 1024)):
            return Response({"detail": "File too large"}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)

        # Save as Asset
        from .models import Asset
        import uuid as _uuid
        new_name = f"{_uuid.uuid4().hex}_{os.path.basename(cu.filename)}"
        with open(cu.temp_path, "rb") as f:
            django_file = File(f, name=new_name)
            asset = Asset.objects.create(
                project=cu.project,
                original_name=cu.filename,
                size=cu.total_size,
                mime="video/mp4",
            )
            asset.file.save(new_name, django_file, save=True)

        # cleanup
        try:
            os.remove(cu.temp_path)
        except Exception:
            pass
        cu.delete()

        serializer = AssetSerializer(asset, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
