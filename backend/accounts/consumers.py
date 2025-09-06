from urllib.parse import parse_qs
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser, User
from jwt import decode as jwt_decode

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = AnonymousUser()
        try:
            qs = parse_qs(self.scope["query_string"].decode())
            token = qs.get("token", [None])[0]
            if token:
                UntypedToken(token)  # validate
                data = jwt_decode(token, options={"verify_signature": False})
                uid = data.get("user_id")
                if uid:
                    self.user = await User.objects.aget(id=uid)
        except (InvalidToken, TokenError, Exception):
            pass
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        self.group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notify(self, event):
        await self.send_json({"type": "notification", "item": event.get("item")})
