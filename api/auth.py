import json
import time
import base64
import hmac
import hashlib
from typing import Optional, Dict, Any
from django.conf import settings


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_jwt(payload: Dict[str, Any], exp_minutes: int = 60) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = dict(payload or {})
    payload["exp"] = int(time.time()) + int(exp_minutes) * 60

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_jwt(token: str) -> Dict[str, Any]:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError as exc:
        raise ValueError("Invalid token format") from exc

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(_b64url_encode(expected_sig), signature_b64):
        raise ValueError("Invalid signature")

    payload_json = _b64url_decode(payload_b64).decode("utf-8")
    payload = json.loads(payload_json)

    exp = int(payload.get("exp", 0))
    if exp <= int(time.time()):
        raise ValueError("Token expired")

    return payload


def get_authorization_token(request) -> Optional[str]:
    auth_header = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
    if not auth_header:
        return None
    parts = auth_header.split(" ")
    if len(parts) != 2:
        return None
    scheme, token = parts[0], parts[1]
    if scheme.lower() != "bearer":
        return None
    return token
