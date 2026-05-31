"""
Регистрирует webhook Telegram-бота и настраивает команды меню.
Вызвать один раз: GET запрос на этот эндпоинт.
"""
import os
import json
import urllib.request

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}


def tg(method: str, payload: dict) -> dict:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    webhook_url = os.environ.get("TELEGRAM_WEBHOOK_URL", "")
    if not webhook_url:
        return {
            "statusCode": 400,
            "headers": CORS,
            "body": json.dumps({"error": "TELEGRAM_WEBHOOK_URL не задан"}),
        }

    # Устанавливаем webhook
    webhook_result = tg("setWebhook", {
        "url": webhook_url,
        "allowed_updates": ["message", "callback_query"],
        "drop_pending_updates": True,
    })

    # Устанавливаем команды бота
    commands_result = tg("setMyCommands", {
        "commands": [
            {"command": "start", "description": "🚀 Запустить бота"},
            {"command": "help", "description": "💡 Помощь"},
            {"command": "premium", "description": "⭐ Premium подписка"},
        ]
    })

    # Имя бота
    me_result = tg("getMe", {})

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "webhook": webhook_result,
            "commands": commands_result,
            "bot": me_result.get("result", {}),
            "webhook_url": webhook_url,
        }, ensure_ascii=False),
    }
