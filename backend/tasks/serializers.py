from rest_framework import serializers
from .models import DeveloperProfile, Task, TaskActivity, TaskAttachment

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = ('id', 'original_name', 'size', 'created_at', 'url', 'uploaded_by_name')

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.get_username()

    def get_url(self, obj):
        return f'/api/attachments/{obj.id}/file/'

class TaskActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskActivity
        fields = ('id', 'actor_name', 'action', 'from_status', 'to_status', 'note', 'created_at')

    def get_actor_name(self, obj):
        return obj.actor.get_full_name() or obj.actor.get_username()

class TaskSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='get_category_display', read_only=True)
    category_code = serializers.CharField(source='category', read_only=True)
    priority = serializers.CharField(source='get_priority_display', read_only=True)
    priority_code = serializers.CharField(source='priority', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assignee = serializers.SerializerMethodField()
    assignee_id = serializers.IntegerField(source='assignee.id', read_only=True)
    assignee_username = serializers.CharField(source='assignee.username', read_only=True)
    creator = serializers.SerializerMethodField()
    creator_id = serializers.IntegerField(source='creator.id', read_only=True)
    initials = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()
    due = serializers.SerializerMethodField()
    updates = serializers.IntegerField(source='activity.count', read_only=True)
    attachment = serializers.SerializerMethodField()
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    activities = TaskActivitySerializer(source='activity', many=True, read_only=True)

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'category', 'category_code',
            'priority', 'priority_code', 'status', 'status_display',
            'assignee', 'assignee_id', 'assignee_username', 'creator', 'creator_id',
            'initials', 'color', 'due', 'due_date', 'updates',
            'attachment', 'attachments', 'activities', 'created_at', 'updated_at'
        )

    def get_assignee(self, obj):
        return obj.assignee.get_full_name() or obj.assignee.get_username()

    def get_creator(self, obj):
        return obj.creator.get_full_name() or obj.creator.get_username()

    def get_initials(self, obj):
        parts = (obj.assignee.get_full_name() or obj.assignee.get_username()).split()
        return ''.join(part[0] for part in parts[:2]).upper()

    def get_color(self, obj):
        palette = ['#3f6e60', '#8270b3', '#55779a', '#a16a58', '#63836a']
        return palette[obj.assignee_id % len(palette)]

    def get_due(self, obj):
        return obj.due_date.isoformat() if obj.due_date else 'Belgilanmagan'

    def get_attachment(self, obj):
        attachment = obj.attachments.first()
        return attachment.original_name if attachment else None

class TaskCreateSerializer(serializers.ModelSerializer):
    assignee_id = serializers.IntegerField(required=False)

    class Meta:
        model = Task
        fields = ('title', 'description', 'category', 'priority', 'status', 'due_date', 'assignee_id')

    def validate_assignee_id(self, value):
        from django.contrib.auth import get_user_model
        if not get_user_model().objects.filter(id=value, is_superuser=False, is_active=True).exists():
            raise serializers.ValidationError('Faol dasturchini tanlang.')
        return value

class TaskUpdateSerializer(serializers.ModelSerializer):
    assignee_id = serializers.IntegerField(required=False)

    class Meta:
        model = Task
        fields = ('title', 'description', 'category', 'priority', 'status', 'due_date', 'assignee_id')

    def validate_assignee_id(self, value):
        from django.contrib.auth import get_user_model
        if value and not get_user_model().objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Faol dasturchini tanlang.')
        return value

class DeveloperSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()
    active = serializers.BooleanField(source='is_active', read_only=True)
    completed = serializers.SerializerMethodField()
    in_progress = serializers.SerializerMethodField()
    total_tasks = serializers.SerializerMethodField()

    class Meta:
        from django.contrib.auth import get_user_model
        model = get_user_model()
        fields = ('id', 'name', 'username', 'initials', 'color', 'active', 'completed', 'in_progress', 'total_tasks', 'date_joined')

    def get_name(self, obj):
        return obj.get_full_name() or obj.get_username()

    def get_initials(self, obj):
        return ''.join(part[0] for part in (obj.get_full_name() or obj.get_username()).split()[:2]).upper()

    def get_color(self, obj):
        palette = ['#3f6e60', '#8270b3', '#55779a', '#a16a58', '#63836a']
        return palette[obj.id % len(palette)]

    def get_completed(self, obj):
        return obj.assigned_tasks.filter(status=Task.Status.DONE).count()

    def get_in_progress(self, obj):
        return obj.assigned_tasks.filter(status__in=[Task.Status.PROGRESS, Task.Status.REVIEW]).count()

    def get_total_tasks(self, obj):
        return obj.assigned_tasks.count()

class DeveloperCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, trim_whitespace=True)
    username = serializers.RegexField(r'^[A-Za-z0-9._-]{3,30}$')

    def validate_username(self, value):
        from django.contrib.auth import get_user_model
        if get_user_model().objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Bu login band. Boshqa login kiriting.')
        return value

class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False, min_length=8)

    def validate_new_password(self, value):
        from django.contrib.auth.password_validation import validate_password
        validate_password(value, self.context['request'].user)
        return value
