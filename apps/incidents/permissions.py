from rest_framework import permissions

class CanAccessIncident(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if (
            request.user.perfil == "AUDITOR"
            and request.method not in permissions.SAFE_METHODS
        ):
            return False
        return True
    
    def has_object_permission(self, request, view, obj):
        user = request.user

        if not user or not user.is_authenticated:
            return False
        
        if user.is_superuser or user.perfil == "ADMIN":
            return True
        
        if user.perfil in ["GESTOR", "ANALISTA_SOC"]:
            return True
        
        if user.perfil == "AUDITOR":
            return request.method in permissions.SAFE_METHODS
        
        if user.perfil == "USUARIO_COMUM":
            return obj.usuario_reportante == user
        
        return False
