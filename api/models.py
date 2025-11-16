from django.db import models
import os
import base64
import hashlib
import hmac
import uuid


class Member(models.Model):
    id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True)
    password_hash = models.CharField(max_length=512)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    PBKDF2_ITERATIONS = 390000

    def __str__(self) -> str:  # pragma: no cover
        return self.email

    @property
    def is_authenticated(self) -> bool:
        # For DRF permissions compatibility when using Member as user surrogate
        return True

    def set_password(self, raw: str) -> None:
        if not raw:
            raise ValueError("Password cannot be empty")
        salt_bytes = os.urandom(16)
        salt = base64.urlsafe_b64encode(salt_bytes).decode("utf-8").rstrip("=")
        iterations = int(self.PBKDF2_ITERATIONS)
        dk = hashlib.pbkdf2_hmac(
            "sha256",
            raw.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        hash_b64 = base64.urlsafe_b64encode(dk).decode("utf-8").rstrip("=")
        self.password_hash = f"pbkdf2_sha256${iterations}${salt}${hash_b64}"

    def check_password(self, raw: str) -> bool:
        try:
            algo, iterations_str, salt, stored_hash = self.password_hash.split("$", 3)
        except Exception:
            return False
        if algo != "pbkdf2_sha256":
            return False
        try:
            iterations = int(iterations_str)
        except Exception:
            return False
        dk = hashlib.pbkdf2_hmac(
            "sha256",
            raw.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        calc_hash = base64.urlsafe_b64encode(dk).decode("utf-8").rstrip("=")
        return hmac.compare_digest(calc_hash, stored_hash)


class Project(models.Model):
    owner = models.ForeignKey(Member, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"Project #{self.id} - {self.title}"


class Asset(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="assets")
    file = models.FileField(upload_to="videos/")
    original_name = models.CharField(max_length=255)
    size = models.IntegerField()
    mime = models.CharField(max_length=100, default="video/mp4")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"Asset #{self.id} of Project #{self.project_id} - {self.original_name}"


class EditHistory(models.Model):
    ACTION_TRIM = "trim"
    ACTION_MERGE = "merge"
    ACTION_ADD_TEXT = "add_text"
    ACTION_CROP = "crop"

    ACTION_CHOICES = [
        (ACTION_TRIM, ACTION_TRIM),
        (ACTION_MERGE, ACTION_MERGE),
        (ACTION_ADD_TEXT, ACTION_ADD_TEXT),
        (ACTION_CROP, ACTION_CROP),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="history")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    params = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"EditHistory #{self.id} - {self.action} (Project #{self.project_id})"


class ChunkedUpload(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="chunked_uploads")
    filename = models.CharField(max_length=255)
    mime = models.CharField(max_length=100, default="video/mp4")
    total_size = models.IntegerField()
    received_size = models.IntegerField(default=0)
    temp_path = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):  # pragma: no cover
        return f"ChunkedUpload {self.id} for Project {self.project_id} ({self.filename})"
