#!/usr/bin/env python3
import os
import sys
import django
import requests
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth.models import User
from accounts.models import UserProfile
from rest_framework_simplejwt.tokens import RefreshToken

backend_url = "http://127.0.0.1:8000"

def test_new_user_flow():
    """Test the complete new user flow"""
    print("=== Testing New User Flow ===\n")
    
    # Create a new test user
    email = "newuser@example.com"
    password = "newpass123"
    
    # Clean up any existing user
    try:
        existing_user = User.objects.get(email=email)
        existing_user.delete()
        print(f"Cleaned up existing user: {email}")
    except User.DoesNotExist:
        pass
    
    # Register new user
    print("1. Registering new user...")
    register_data = {
        "email": email,
        "password": password
    }
    
    try:
        register_response = requests.post(f"{backend_url}/api/auth/register/", json=register_data)
        print(f"Register response: {register_response.status_code}")
        if register_response.status_code == 201:
            print("✅ User registered successfully")
        else:
            print(f"❌ Registration failed: {register_response.text}")
            return False
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return False
    
    # Login to get token
    print("\n2. Logging in...")
    try:
        login_response = requests.post(f"{backend_url}/api/auth/login/", json=register_data)
        print(f"Login response: {login_response.status_code}")
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return False
            
        token_data = login_response.json()
        access_token = token_data.get("access")
        
        if not access_token:
            print("❌ No access token received")
            return False
            
        print("✅ Login successful")
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Test profile creation/update
    print("\n3. Testing profile creation...")
    profile_data = {
        "handle": "newuser123",
        "city": "Tehran",
        "categories": ["technology", "coding"],
        "bio": "New user bio",
        "age": 25
    }
    
    try:
        profile_response = requests.put(
            f"{backend_url}/api/auth/profile/",
            json=profile_data,
            headers=headers
        )
        
        print(f"Profile update response: {profile_response.status_code}")
        print(f"Response body: {profile_response.text}")
        
        if profile_response.status_code == 200:
            print("✅ Profile created/updated successfully")
        else:
            print("❌ Profile creation failed")
            return False
    except Exception as e:
        print(f"❌ Profile creation error: {e}")
        return False
    
    # Test photo upload
    print("\n4. Testing photo upload...")
    # Create a dummy image file for testing
    dummy_image_content = b"dummy image content"
    
    try:
        files = {"photo": ("test.jpg", dummy_image_content, "image/jpeg")}
        photo_headers = {"Authorization": f"Bearer {access_token}"}
        
        photo_response = requests.post(
            f"{backend_url}/api/auth/profile/photo/",
            files=files,
            headers=photo_headers
        )
        
        print(f"Photo upload response: {photo_response.status_code}")
        print(f"Response body: {photo_response.text}")
        
        if photo_response.status_code == 200:
            print("✅ Photo upload successful")
        else:
            print("❌ Photo upload failed")
            return False
    except Exception as e:
        print(f"❌ Photo upload error: {e}")
        return False
    
    # Test post creation
    print("\n5. Testing post creation...")
    try:
        files = {"image": ("test_post.jpg", dummy_image_content, "image/jpeg")}
        post_headers = {"Authorization": f"Bearer {access_token}"}
        
        post_response = requests.post(
            f"{backend_url}/api/auth/posts/",
            files=files,
            headers=post_headers
        )
        
        print(f"Post creation response: {post_response.status_code}")
        print(f"Response body: {post_response.text}")
        
        if post_response.status_code == 200:
            print("✅ Post creation successful")
        else:
            print("❌ Post creation failed")
            return False
    except Exception as e:
        print(f"❌ Post creation error: {e}")
        return False
    
    print("\n🎉 All tests passed! New user flow is working correctly.")
    return True

if __name__ == "__main__":
    success = test_new_user_flow()
    if not success:
        print("\n💥 Some tests failed. Check the output above for details.")
