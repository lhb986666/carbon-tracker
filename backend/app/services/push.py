# app/services/push.py
import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_push_notification(expo_token: str, title: str, body: str, data: dict = {}):
    if not expo_token or not expo_token.startswith("ExponentPushToken"):
        return

    payload = {
        "to": expo_token,
        "title": title,
        "body": body,
        "data": data,
        "sound": "default",
        "badge": 1,
    }

    async with httpx.AsyncClient() as client:
        try:
            await client.post(EXPO_PUSH_URL, json=payload, timeout=5.0)
        except Exception:
            pass