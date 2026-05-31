"""
Основной Telegram webhook-обработчик.
Принимает сообщения от Telegram, генерирует изображения через Gemini API,
поддерживает кнопки меню, режимы, стили, загрузку фото пользователя.
"""
import os
import json
import base64
import urllib.request
import urllib.error

TELEGRAM_API = "https://api.telegram.org/bot"
GEMINI_API = "https://generativelanguage.googleapis.com/v1beta"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

# Состояния пользователей (in-memory, сбрасываются при рестарте)
user_states: dict = {}

# Доступные стили
STYLES = {
    "🎨 Акварель": "watercolor painting style, soft edges, flowing colors",
    "🖼️ Масло": "oil painting style, rich textures, classical art",
    "✨ Аниме": "anime style, vibrant colors, detailed linework",
    "🎬 Кино": "cinematic photography, dramatic lighting, film grain",
    "📸 Портрет": "professional portrait photography, bokeh, soft light",
    "💎 3D Рендер": "3D render, octane render, photorealistic, studio lighting",
    "👾 Пиксель-арт": "pixel art style, 8-bit, retro game aesthetic",
    "🔮 Фэнтези": "fantasy magic art, glowing runes, mystical atmosphere",
}

# Модели Gemini
MODELS = {
    "⚡ Flash-Lite": "gemini-2.0-flash-lite",
    "🚀 Flash": "gemini-2.0-flash",
    "🔮 Pro": "gemini-2.0-pro-exp",
}

LIMITS = {"free": 10, "premium": 9999}


def tg_request(method: str, payload: dict) -> dict:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    url = f"{TELEGRAM_API}{token}/{method}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def send_message(chat_id: int, text: str, reply_markup=None, parse_mode="HTML") -> None:
    payload = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
    if reply_markup:
        payload["reply_markup"] = reply_markup
    tg_request("sendMessage", payload)


def send_photo(chat_id: int, photo_bytes: bytes, caption: str = "", reply_markup=None) -> None:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    url = f"{TELEGRAM_API}{token}/sendPhoto"

    boundary = "----FormBoundary7MA4YWxkTrZu0gW"
    body = []
    body.append(f"--{boundary}".encode())
    body.append(b'Content-Disposition: form-data; name="chat_id"')
    body.append(b"")
    body.append(str(chat_id).encode())
    body.append(f"--{boundary}".encode())
    body.append(b'Content-Disposition: form-data; name="photo"; filename="image.png"')
    body.append(b"Content-Type: image/png")
    body.append(b"")
    body.append(photo_bytes)
    if caption:
        body.append(f"--{boundary}".encode())
        body.append(b'Content-Disposition: form-data; name="caption"')
        body.append(b"")
        body.append(caption.encode("utf-8"))
    if reply_markup:
        body.append(f"--{boundary}".encode())
        body.append(b'Content-Disposition: form-data; name="reply_markup"')
        body.append(b"")
        body.append(json.dumps(reply_markup).encode("utf-8"))
    body.append(f"--{boundary}--".encode())
    body_bytes = b"\r\n".join(body)

    req = urllib.request.Request(url, data=body_bytes,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def send_chat_action(chat_id: int, action: str = "upload_photo") -> None:
    tg_request("sendChatAction", {"chat_id": chat_id, "action": action})


def get_file_url(file_id: str) -> str:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    result = tg_request("getFile", {"file_id": file_id})
    file_path = result["result"]["file_path"]
    return f"https://api.telegram.org/file/bot{token}/{file_path}"


def download_file(url: str) -> bytes:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def get_user_state(user_id: int) -> dict:
    if user_id not in user_states:
        user_states[user_id] = {
            "mode": "generate",       # generate | chat
            "model": "🚀 Flash",
            "style": None,
            "waiting_photo": False,
            "pending_prompt": None,
            "plan": "free",
            "used": 0,
            "is_admin": False,
        }
    return user_states[user_id]


def main_keyboard() -> dict:
    return {
        "keyboard": [
            [{"text": "🎨 Генерировать"}, {"text": "🖼️ Стили"}],
            [{"text": "⚡ Модель"}, {"text": "🕐 История"}],
            [{"text": "💬 Чат с AI"}, {"text": "⚙️ Настройки"}],
            [{"text": "👤 Профиль"}, {"text": "💡 Помощь"}],
        ],
        "resize_keyboard": True,
        "persistent": True,
    }


def styles_keyboard() -> dict:
    keys = [[{"text": name}] for name in STYLES.keys()]
    keys.append([{"text": "❌ Без стиля"}, {"text": "🔙 Назад"}])
    return {"keyboard": keys, "resize_keyboard": True}


def models_keyboard() -> dict:
    keys = [[{"text": name}] for name in MODELS.keys()]
    keys.append([{"text": "🔙 Назад"}])
    return {"keyboard": keys, "resize_keyboard": True}


def generate_image_gemini(prompt: str, style_prompt: str, image_bytes: bytes | None, model_key: str) -> bytes | None:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    gen_model = "gemini-2.0-flash-preview-image-generation"
    url = f"{GEMINI_API}/models/{gen_model}:generateContent?key={api_key}"

    full_prompt = f"{prompt}, {style_prompt}" if style_prompt else prompt

    parts = []
    if image_bytes:
        parts.append({
            "inlineData": {
                "mimeType": "image/jpeg",
                "data": base64.b64encode(image_bytes).decode("utf-8"),
            }
        })
    parts.append({"text": full_prompt})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=55) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    for part in result.get("candidates", [{}])[0].get("content", {}).get("parts", []):
        if "inlineData" in part:
            return base64.b64decode(part["inlineData"]["data"])
    return None


def chat_with_gemini(prompt: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY", "")
    url = f"{GEMINI_API}/models/gemini-2.0-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 1024},
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return result["candidates"][0]["content"]["parts"][0]["text"]


def handle_generate(chat_id: int, user_id: int, prompt: str, image_bytes: bytes | None = None) -> None:
    state = get_user_state(user_id)
    limit = LIMITS.get(state["plan"], 10)

    if state["used"] >= limit:
        send_message(chat_id,
            "🔒 <b>Лимит исчерпан!</b>\n\nУ тебя закончились бесплатные генерации.\n"
            "Напиши /premium чтобы получить безлимит ⭐",
            reply_markup=main_keyboard()
        )
        return

    style_key = state.get("style")
    style_prompt = STYLES.get(style_key, "") if style_key else ""
    model_label = state.get("model", "🚀 Flash")

    send_chat_action(chat_id, "upload_photo")

    caption_parts = [f"⏳ Генерирую через Gemini {model_label}..."]
    if style_key:
        caption_parts.append(f"Стиль: {style_key}")
    send_message(chat_id, "\n".join(caption_parts))

    image_data = generate_image_gemini(prompt, style_prompt, image_bytes, model_label)

    if image_data:
        state["used"] += 1
        remaining = limit - state["used"]
        cap = f"✨ <b>Готово!</b>\n\n📝 <i>{prompt}</i>"
        if style_key:
            cap += f"\n🎨 Стиль: {style_key}"
        cap += f"\n⚡ Модель: {model_label}"
        cap += f"\n🔢 Осталось генераций: {remaining}/{limit}"
        send_photo(chat_id, image_data, caption=cap, reply_markup=main_keyboard())
    else:
        send_message(chat_id,
            "😔 Не удалось сгенерировать изображение.\n"
            "Попробуй изменить промт или выбрать другой стиль.",
            reply_markup=main_keyboard()
        )


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        update = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    # Обрабатываем сообщение
    message = update.get("message") or update.get("edited_message")
    if not message:
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    chat_id = message["chat"]["id"]
    user_id = message["from"]["id"]
    username = message["from"].get("username", "")
    first_name = message["from"].get("first_name", "пользователь")
    text = message.get("text", "").strip()
    photo = message.get("photo")
    document = message.get("document")
    state = get_user_state(user_id)

    # === ФОТО от пользователя ===
    if photo or document:
        file_id = photo[-1]["file_id"] if photo else document["file_id"]
        caption = message.get("caption", "").strip()

        file_url = get_file_url(file_id)
        image_bytes = download_file(file_url)

        if caption:
            handle_generate(chat_id, user_id, caption, image_bytes)
        else:
            state["waiting_photo"] = True
            state["_photo_bytes"] = base64.b64encode(image_bytes).decode()
            send_message(chat_id,
                "📸 Фото получено!\n\n✍️ Теперь напиши промт — что сделать с этим фото?\n"
                "<i>Например: «Превратить в аниме», «Нарисовать маслом», «Добавить неоновый свет»</i>",
                reply_markup=main_keyboard()
            )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    # === Если ждём промт после фото ===
    if state.get("waiting_photo") and text and not text.startswith("/"):
        encoded = state.pop("_photo_bytes", None)
        state["waiting_photo"] = False
        image_bytes = base64.b64decode(encoded) if encoded else None
        handle_generate(chat_id, user_id, text, image_bytes)
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    # === КОМАНДЫ ===
    if text == "/start":
        limit = LIMITS.get(state["plan"], 10)
        send_message(chat_id,
            f"👋 Привет, <b>{first_name}</b>!\n\n"
            "🤖 Я <b>GeminiBot</b> — генерирую изображения по твоему описанию через Google Gemini AI.\n\n"
            "🎨 <b>Что умею:</b>\n"
            "• Создавать изображения по промту\n"
            "• Применять стили (акварель, аниме, 3D...)\n"
            "• Обрабатывать твои фото\n"
            "• Отвечать на вопросы как AI-ассистент\n\n"
            f"⚡ У тебя <b>{limit}</b> бесплатных генераций.\n\n"
            "Нажми <b>🎨 Генерировать</b> чтобы начать!",
            reply_markup=main_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "/help":
        text = "💡"  # перенаправим на помощь

    # === МЕНЮ ===
    if text == "🎨 Генерировать":
        state["mode"] = "generate"
        style_info = f"Стиль: {state['style']}" if state.get("style") else "Стиль: не выбран"
        send_message(chat_id,
            f"🎨 <b>Режим генерации</b>\n\n"
            f"⚡ Модель: <b>{state['model']}</b>\n"
            f"🖼️ {style_info}\n\n"
            "✍️ Просто напиши описание изображения или отправь фото с подписью.\n\n"
            "<i>Пример: «Кот-астронавт на луне, аниме стиль, неоновые огни»</i>",
            reply_markup=main_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "🖼️ Стили":
        current = state.get("style") or "не выбран"
        send_message(chat_id,
            f"🖼️ <b>Выбери стиль генерации</b>\n\nТекущий: <b>{current}</b>",
            reply_markup=styles_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text in STYLES:
        state["style"] = text
        send_message(chat_id,
            f"✅ Стиль <b>{text}</b> выбран!\n\nТеперь напиши промт — и я создам изображение.",
            reply_markup=main_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "❌ Без стиля":
        state["style"] = None
        send_message(chat_id, "✅ Стиль сброшен. Буду генерировать без стиля.", reply_markup=main_keyboard())
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "🔙 Назад":
        send_message(chat_id, "🏠 Главное меню", reply_markup=main_keyboard())
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "⚡ Модель":
        current = state.get("model", "🚀 Flash")
        models_info = "\n".join([
            "⚡ <b>Flash-Lite</b> — молниеносно, экономно",
            "🚀 <b>Flash</b> — баланс скорости и качества",
            "🔮 <b>Pro</b> — максимальное качество",
        ])
        send_message(chat_id,
            f"⚡ <b>Выбери модель Gemini</b>\n\nТекущая: <b>{current}</b>\n\n{models_info}",
            reply_markup=models_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text in MODELS:
        state["model"] = text
        send_message(chat_id,
            f"✅ Модель <b>{text}</b> выбрана!",
            reply_markup=main_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "🕐 История":
        used = state.get("used", 0)
        limit = LIMITS.get(state["plan"], 10)
        send_message(chat_id,
            f"🕐 <b>История генераций</b>\n\n"
            f"📊 Использовано: <b>{used}</b> из <b>{limit}</b>\n"
            f"⭐ План: <b>{state['plan'].upper()}</b>\n\n"
            "<i>История изображений хранится прямо в чате Telegram ↑</i>",
            reply_markup=main_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "💬 Чат с AI":
        state["mode"] = "chat"
        send_message(chat_id,
            "💬 <b>Режим чата с Gemini AI</b>\n\n"
            "Задавай любые вопросы — отвечу как умный ассистент!\n\n"
            "Для возврата к генерации нажми <b>🎨 Генерировать</b>",
            reply_markup=main_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "⚙️ Настройки":
        used = state.get("used", 0)
        limit = LIMITS.get(state["plan"], 10)
        style = state.get("style") or "не выбран"
        model = state.get("model", "🚀 Flash")
        send_message(chat_id,
            f"⚙️ <b>Настройки</b>\n\n"
            f"🤖 Модель: <b>{model}</b>\n"
            f"🎨 Стиль: <b>{style}</b>\n"
            f"📊 Генераций использовано: <b>{used}/{limit}</b>\n"
            f"⭐ План: <b>{state['plan'].upper()}</b>\n\n"
            "Управление через кнопки меню 👇",
            reply_markup=main_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "👤 Профиль":
        used = state.get("used", 0)
        limit = LIMITS.get(state["plan"], 10)
        remaining = limit - used
        plan_emoji = "⭐" if state["plan"] == "premium" else "🆓"
        send_message(chat_id,
            f"👤 <b>Профиль</b>\n\n"
            f"🧑 Имя: <b>{first_name}</b>\n"
            f"🆔 ID: <code>{user_id}</code>\n"
            f"{plan_emoji} Подписка: <b>{state['plan'].upper()}</b>\n\n"
            f"📈 <b>Статистика:</b>\n"
            f"• Сгенерировано: <b>{used}</b> изображений\n"
            f"• Осталось: <b>{remaining}</b> из <b>{limit}</b>\n\n"
            "Напиши /premium для безлимитного доступа ⭐",
            reply_markup=main_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "💡 Помощь":
        send_message(chat_id,
            "💡 <b>Как пользоваться GeminiBot</b>\n\n"
            "🎨 <b>Генерация изображений:</b>\n"
            "1. Нажми «🎨 Генерировать»\n"
            "2. Напиши описание на русском или английском\n"
            "3. Получи изображение!\n\n"
            "📸 <b>Обработка своего фото:</b>\n"
            "• Отправь фото с подписью (промтом)\n"
            "• Или отправь фото → потом напиши промт\n\n"
            "🖼️ <b>Стили:</b>\n"
            "• Акварель, аниме, 3D, кино и другие\n"
            "• Выбери через «🖼️ Стили»\n\n"
            "⚡ <b>Модели:</b>\n"
            "• Flash-Lite — быстро\n"
            "• Flash — баланс\n"
            "• Pro — максимальное качество\n\n"
            "💬 <b>Чат с AI:</b>\n"
            "• Нажми «💬 Чат с AI» и задавай вопросы\n\n"
            "📝 <b>Советы по промтам:</b>\n"
            "• Описывай детально: стиль, цвет, настроение\n"
            "• <i>«Закат над горами, акварель, тёплые тона»</i>\n"
            "• <i>«Кот-самурай, аниме, неоновый город»</i>",
            reply_markup=main_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    if text == "/premium":
        send_message(chat_id,
            "⭐ <b>Premium подписка</b>\n\n"
            "• ♾️ Безлимитные генерации\n"
            "• 🚀 Приоритет в очереди\n"
            "• 🔮 Доступ к модели Pro\n\n"
            "<i>Функция оплаты в разработке. Скоро!</i>",
            reply_markup=main_keyboard()
        )
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    # === Текстовое сообщение — чат или генерация ===
    if text and not text.startswith("/"):
        if state.get("mode") == "chat":
            send_chat_action(chat_id, "typing")
            try:
                reply = chat_with_gemini(text)
                send_message(chat_id, f"🤖 {reply}", reply_markup=main_keyboard())
            except Exception as e:
                send_message(chat_id, f"⚠️ Ошибка Gemini: {e}", reply_markup=main_keyboard())
        else:
            handle_generate(chat_id, user_id, text)
        return {"statusCode": 200, "headers": CORS, "body": "ok"}

    return {"statusCode": 200, "headers": CORS, "body": "ok"}
