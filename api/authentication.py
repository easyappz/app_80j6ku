from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .auth import decode_jwt, get_authorization_token
from .models import Member


class MemberJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = get_authorization_token(request)
        if not token:
            return None
        try:
            payload = decode_jwt(token)
        except Exception:
            raise AuthenticationFailed("Invalid token")

        member_id = payload.get("id")
        if not member_id:
            raise AuthenticationFailed("Invalid token payload")

        try:
            member = Member.objects.get(id=member_id)
        except Member.DoesNotExist:
            raise AuthenticationFailed("User not found")

        # Attach to request for convenience
        request.member = member
        return (member, token)
