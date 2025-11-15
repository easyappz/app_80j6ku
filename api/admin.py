from django.contrib import admin
from .models import Member


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "name", "created_at", "updated_at")
    search_fields = ("email", "name")
    ordering = ("-id",)
