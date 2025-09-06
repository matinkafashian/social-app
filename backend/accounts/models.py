from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

def avatar_upload_path(instance, filename): return f"avatars/user_{instance.user_id}/{filename}"
def post_upload_path(instance, filename): return f"posts/user_{instance.user_id}/{filename}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    handle = models.SlugField(max_length=32, unique=True, null=True, blank=True)
    photo = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)
    city = models.CharField(max_length=64, null=True, blank=True)
    categories = models.JSONField(default=list, blank=True)
    bio = models.TextField(blank=True, default="")
    age = models.PositiveIntegerField(null=True, blank=True)
    followers_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_private = models.BooleanField(default=False)
    def __str__(self): return f"{self.user.email} ({self.handle})" if self.handle else self.user.email

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    image = models.ImageField(upload_to=post_upload_path)
    caption = models.TextField(blank=True, default="")
    categories = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class PostLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: unique_together = ("user", "post")

class PostComment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class PostSave(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="saves")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: unique_together = ("user", "post")

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ("follower","following")
        indexes = [models.Index(fields=["follower","following"])]

NOTIF_TYPES = (("like","like"),("comment","comment"),("follow","follow"))
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="actor_notifications")
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="notifications", null=True, blank=True)
    type = models.CharField(max_length=16, choices=NOTIF_TYPES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        indexes = [models.Index(fields=["user","is_read","created_at"])]
        ordering = ["-created_at"]
