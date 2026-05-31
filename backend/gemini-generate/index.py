"""
Генерация изображений и текстовых ответов через Google Gemini API.
Принимает промт, модель, стиль и (опционально) base64-фото от пользователя.
"""
import os
import json
import base64
import urllib.request
import urllib.error


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    "Content-Type": "application/json",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "GEMINI_API_KEY не настроен"}),
        }

    body = json.loads(event.get("body") or "{}")
    prompt = body.get("prompt", "").strip()
    model_id = body.get("model", "gemini-2.0-flash-preview-image-generation")
    style_prompt = body.get("style_prompt", "")
    image_base64 = body.get("image_base64")  # опционально — фото пользователя
    mode = body.get("mode", "image")  # "image" или "chat"

    if not prompt:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Промт не может быть пустым"}),
        }

    # Текстовый чат режим
    if mode == "chat":
        return _handle_chat(api_key, prompt, model_id)

    # Режим генерации изображений
    return _handle_image_generation(api_key, prompt, style_prompt, image_base64, model_id)


def _handle_chat(api_key: str, prompt: str, model_id: str) -> dict:
    """Текстовый ответ от Gemini."""
    # Для чата используем flash модель
    chat_model = "gemini-2.0-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{chat_model}:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 1024},
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"type": "text", "text": text})}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        return {"statusCode": 502, "headers": CORS_HEADERS, "body": json.dumps({"error": f"Gemini ошибка: {err}"})}


def _handle_image_generation(api_key: str, prompt: str, style_prompt: str, image_base64: str | None, model_id: str) -> dict:
    """Генерация изображения через Gemini."""
    # Собираем итоговый промт
    full_prompt = prompt
    if style_prompt:
        full_prompt = f"{prompt}, {style_prompt}"

    # Модель для генерации изображений
    gen_model = "gemini-2.0-flash-preview-image-generation"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{gen_model}:generateContent?key={api_key}"

    parts = []

    # Если пользователь прислал своё фото — добавляем его
    if image_base64:
        # Убираем data:image/...;base64, префикс если есть
        if "," in image_base64:
            mime_type, raw_b64 = image_base64.split(",", 1)
            mime = mime_type.split(":")[1].split(";")[0] if ":" in mime_type else "image/jpeg"
        else:
            raw_b64 = image_base64
            mime = "image/jpeg"

        parts.append({
            "inlineData": {
                "mimeType": mime,
                "data": raw_b64,
            }
        })

    parts.append({"text": full_prompt})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=55) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        return {"statusCode": 502, "headers": CORS_HEADERS, "body": json.dumps({"error": f"Gemini ошибка: {err}"})}

    # Ищем изображение в ответе
    candidates = result.get("candidates", [])
    if not candidates:
        return {"statusCode": 502, "headers": CORS_HEADERS, "body": json.dumps({"error": "Gemini не вернул результат"})}

    image_data = None
    text_data = None

    for part in candidates[0].get("content", {}).get("parts", []):
        if "inlineData" in part:
            image_data = part["inlineData"]["data"]
            image_mime = part["inlineData"].get("mimeType", "image/png")
        elif "text" in part:
            text_data = part["text"]

    if image_data:
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "type": "image",
                "image_base64": image_data,
                "mime_type": image_mime,
                "text": text_data,
            }),
        }

    # Если изображение не вернулось — вернём текст
    if text_data:
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"type": "text", "text": text_data}),
        }

    return {"statusCode": 502, "headers": CORS_HEADERS, "body": json.dumps({"error": "Не удалось получить изображение от Gemini"})}
