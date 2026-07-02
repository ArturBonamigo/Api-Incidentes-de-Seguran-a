from rest_framework import permissions

class IsAdminProfile(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.perfil == "ADMIN"
            )
        )