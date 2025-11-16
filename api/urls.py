from django.urls import path
from .views import (
    HelloView,
    AuthRegisterView,
    AuthLoginView,
    ProfileView,
    ProjectListCreateView,
    ProjectDetailView,
    ProjectAssetsView,
    ProjectHistoryView,
    AssetChunkedInitView,
    AssetChunkedUploadView,
    AssetChunkedCompleteView,
)

urlpatterns = [
    path("hello/", HelloView.as_view(), name="hello"),
    path("auth/register/", AuthRegisterView.as_view(), name="auth-register"),
    path("auth/login/", AuthLoginView.as_view(), name="auth-login"),
    path("auth/profile/", ProfileView.as_view(), name="auth-profile"),
    path("projects/", ProjectListCreateView.as_view(), name="project-list-create"),
    path("projects/<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("projects/<int:pk>/assets/", ProjectAssetsView.as_view(), name="project-assets"),
    path("projects/<int:pk>/history/", ProjectHistoryView.as_view(), name="project-history"),
    path("projects/<int:pk>/assets/chunked/init/", AssetChunkedInitView.as_view(), name="project-assets-chunked-init"),
    path("projects/<int:pk>/assets/chunked/<uuid:uid>/", AssetChunkedUploadView.as_view(), name="project-assets-chunked-upload"),
    path("projects/<int:pk>/assets/chunked/<uuid:uid>/complete/", AssetChunkedCompleteView.as_view(), name="project-assets-chunked-complete"),
]
