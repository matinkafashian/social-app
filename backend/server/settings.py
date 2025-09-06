from pathlib import Path
import os
from dotenv import load_dotenv
import dj_database_url
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key")
DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() == "true"
_hosts = [h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()]
ALLOWED_HOSTS = _hosts if _hosts else (["*"] if DEBUG else [])

INSTALLED_APPS = [
    "django.contrib.admin","django.contrib.auth","django.contrib.contenttypes",
    "django.contrib.sessions","django.contrib.messages","django.contrib.staticfiles",
    "channels", "rest_framework","corsheaders","accounts",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "server.urls"
TEMPLATES = [{
  "BACKEND":"django.template.backends.django.DjangoTemplates",
  "DIRS":[], "APP_DIRS":True,
  "OPTIONS":{"context_processors":[
    "django.template.context_processors.debug",
    "django.template.context_processors.request",
    "django.contrib.auth.context_processors.auth",
    "django.contrib.messages.context_processors.messages",
  ]},
}]
WSGI_APPLICATION = "server.wsgi.application"
ASGI_APPLICATION = "server.asgi.application"

DATABASES = {"default":{"ENGINE":"django.db.backends.sqlite3","NAME": BASE_DIR / "db.sqlite3"}}
_db_url = os.environ.get("DATABASE_URL", "")
if _db_url:
    DATABASES = {"default": dj_database_url.parse(_db_url, conn_max_age=600)}
AUTH_PASSWORD_VALIDATORS = [
  {"NAME":"django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
  {"NAME":"django.contrib.auth.password_validation.MinimumLengthValidator"},
  {"NAME":"django.contrib.auth.password_validation.CommonPasswordValidator"},
  {"NAME":"django.contrib.auth.password_validation.NumericPasswordValidator"},
]
LANGUAGE_CODE="en-us"; TIME_ZONE="UTC"; USE_I18N=True; USE_TZ=True
STATIC_URL="static/"; STATIC_ROOT = BASE_DIR / "staticfiles"; DEFAULT_AUTO_FIELD="django.db.models.BigAutoField"

REST_FRAMEWORK = {
  "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",)
}
_cors = os.environ.get("CORS_ALLOWED_ORIGINS", "")
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]
_csrf = os.environ.get("CSRF_TRUSTED_ORIGINS", "")
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf.split(",") if o.strip()]
CORS_ALLOW_HEADERS = [
    "accept", "accept-encoding", "authorization", "content-type", "dnt",
    "origin", "user-agent", "x-csrftoken", "x-requested-with",
]
MEDIA_URL=os.environ.get("MEDIA_URL", "/media/"); MEDIA_ROOT = BASE_DIR / "media"

REDIS_URL = os.environ.get("REDIS_URL", "")
SENTRY_DSN = os.environ.get("SENTRY_DSN", "")

CHANNEL_LAYERS = {"default": {"BACKEND":"channels.layers.InMemoryChannelLayer"}}
