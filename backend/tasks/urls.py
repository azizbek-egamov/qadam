from django.urls import path
from .views import (
    AttachmentDownloadView, AttachmentUploadView, DeveloperDetailView,
    DeveloperListCreateView, MeView, PasswordChangeView, TaskActivityCreateView,
    TaskDetailView, TaskListCreateView, TaskStatusView, csrf_token, sign_in, sign_out
)

urlpatterns = [
    path('csrf/', csrf_token, name='csrf-token'),
    path('login/', sign_in, name='login'),
    path('logout/', sign_out, name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('password/', PasswordChangeView.as_view(), name='password-change'),
    path('tasks/', TaskListCreateView.as_view(), name='tasks'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:pk>/status/', TaskStatusView.as_view(), name='task-status'),
    path('tasks/<int:pk>/activity/', TaskActivityCreateView.as_view(), name='task-activity'),
    path('tasks/<int:pk>/attachments/', AttachmentUploadView.as_view(), name='task-attachments'),
    path('attachments/<int:pk>/file/', AttachmentDownloadView.as_view(), name='attachment-file'),
    path('developers/', DeveloperListCreateView.as_view(), name='developers'),
    path('developers/<int:pk>/', DeveloperDetailView.as_view(), name='developer-detail'),
    path('developers/<int:pk>/reset-password/', DeveloperDetailView.as_view(), name='developer-reset-password'),
]
