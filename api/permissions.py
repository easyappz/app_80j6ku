from rest_framework import permissions


class IsOwnerProject(permissions.BasePermission):
    """Allow access only to the owner for project-bound objects.

    Usage:
    - Object-level checks: compares obj.owner to request.user.
    - For queryset usage, call IsOwnerProject.filter_queryset(queryset, request).
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and getattr(user, "is_authenticated", False))

    def has_object_permission(self, request, view, obj):
        owner_id = getattr(getattr(obj, "owner", None), "id", None)
        return owner_id is not None and owner_id == getattr(getattr(request, "user", None), "id", None)

    @staticmethod
    def filter_queryset(queryset, request):
        user_id = getattr(getattr(request, "user", None), "id", None)
        if user_id is None:
            return queryset.none()
        return queryset.filter(owner_id=user_id)
