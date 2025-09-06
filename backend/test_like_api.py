#!/usr/bin/env python3
"""
Simple script to test the like API endpoint
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()


def test_like_functionality():
    from django.contrib.auth.models import User
    from accounts.models import UserProfile, Post, PostLike
    from django.core.files.uploadedfile import SimpleUploadedFile
    from accounts.views import post_like
    from django.test import RequestFactory
    from rest_framework.test import force_authenticate

    print("=== Testing Like Functionality ===")

    # Get or create a test user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={'username': 'test@example.com'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"Created test user: {user.email}")
    else:
        print(f"Using existing test user: {user.email}")
    # Create user profile
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={'handle': 'testuser'}
    )
    # Get or create a test post
    if not Post.objects.filter(user=user).exists():
        dummy_image = SimpleUploadedFile(
            "test.jpg",
            b"fake-image-bytes",
            content_type="image/jpeg",
        )
        post = Post.objects.create(
            user=user,
            image=dummy_image,
            caption="test",
        )
        print(f"Created dummy post with ID: {post.id}")
    else:
        post = Post.objects.filter(user=user).first()
    print(f"Testing with post ID: {post.id}")
    # Test like functionality
    initial_like_count = PostLike.objects.filter(post=post).count()
    print(f"Initial like count: {initial_like_count}")
    # Create a like
    like, created = PostLike.objects.get_or_create(user=user, post=post)
    if created:
        print("✓ Like created successfully")
    else:
        print("✓ Like already exists")
    new_like_count = PostLike.objects.filter(post=post).count()
    print(f"New like count: {new_like_count}")

    factory = RequestFactory()
    request = factory.post(f"/api/auth/posts/{post.id}/like/")
    force_authenticate(request, user=user)
    try:
        response = post_like(request, pk=post.id)
        print(f"✓ API response: {response.status_code}")
        print(f"✓ API data: {response.data}")
    except Exception as e:
        print(f"✗ API error: {e}")
    print("=== Test Complete ===")

 
if __name__ == '__main__':
    test_like_functionality()
