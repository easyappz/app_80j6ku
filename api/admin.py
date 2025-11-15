from django.contrib import admin
from .models import Member, Project, Asset, EditHistory


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "name", "created_at", "updated_at")
    search_fields = ("email", "name")
    ordering = ("-id",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "owner", "title", "created_at", "updated_at")
    search_fields = ("title",)
    list_filter = ("created_at",)
    ordering = ("-id",)


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "original_name", "size", "mime", "created_at")
    search_fields = ("original_name",)
    list_filter = ("mime", "created_at")
    ordering = ("-id",)


@admin.register(EditHistory)
class EditHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "action", "created_at")
    list_filter = ("action", "created_at")
    ordering = ("-id",)
