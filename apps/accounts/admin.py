from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User

# Register your models here.
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Perfil de Acesso', {'fields': ('perfil',)}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Perfil de Acesso', {'fields': ('perfil',)}),
    )

    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'perfil',
        'is_staff',
        'is_active',
    )

    list_filter = (
        'perfil',
        'is_staff',
        'is_active',
        'is_superuser',
    )
