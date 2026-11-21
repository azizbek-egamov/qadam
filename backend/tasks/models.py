from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models

class DeveloperProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='developer_profile')
    must_change_password = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_developer_profiles')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.get_username()

class Task(models.Model):
    class Category(models.TextChoices):
        FRONTEND = 'frontend', 'Frontend'
        BACKEND = 'backend', 'Backend'
        DESIGN = 'design', 'Dizayn'
        ANALYSIS = 'analysis', 'Tahlil'
        OTHER = 'other', 'Boshqa'

    class Priority(models.TextChoices):
        HIGH = 'high', 'Yuqori'
        MEDIUM = 'medium', 'O‘rta'
        LOW = 'low', 'Past'

    class Status(models.TextChoices):
        NEW = 'new', 'Yangi'
        PROGRESS = 'progress', 'Jarayonda'
        REVIEW = 'review', 'Tekshiruvda'
        DONE = 'done', 'Bajarildi'

    title = models.CharField(max_length=180)
    description = models.TextField(blank=True, max_length=4000)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.NEW)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='created_tasks')
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='assigned_tasks')
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['status', 'due_date', '-created_at']
        indexes = [models.Index(fields=['assignee', 'status']), models.Index(fields=['creator', '-created_at'])]

    def __str__(self):
        return self.title

class TaskAttachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='task_attachments')
    file = models.FileField(upload_to='task-attachments/%Y/%m/', validators=[FileExtensionValidator(['png', 'jpg', 'jpeg', 'webp', 'pdf'])])
    original_name = models.CharField(max_length=255)
    size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_name

class TaskActivity(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activity')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='task_activity')
    action = models.CharField(max_length=30)
    from_status = models.CharField(max_length=12, blank=True)
    to_status = models.CharField(max_length=12, blank=True)
    note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
