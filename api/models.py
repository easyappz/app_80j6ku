from django.db import models
import os
import base64
import hashlib
import hmac


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
