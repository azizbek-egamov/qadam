from django.contrib import admin
from .models import DeveloperProfile, Task, TaskActivity, TaskAttachment

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'priority', 'assignee', 'creator', 'due_date')
    list_filter = ('status', 'priority', 'category')
    search_fields = ('title', 'description', 'assignee__username')

admin.site.register(DeveloperProfile)
admin.site.register(TaskActivity)
admin.site.register(TaskAttachment)
