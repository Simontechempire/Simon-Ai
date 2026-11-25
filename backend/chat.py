
from flask import Blueprint, request, jsonify
from backend.memory import (
    save_message,
    get_history,
    get_all_chats
)
from backend.auth import require_user

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/chat/save", methods=["POST"])
@require_user
def save_chat():
    data = request.get_json(silent=True) or {}

    chat_id = str(data.get("chat_id", ""))[:100]
    message = str(data.get("message", ""))[:12000]
    role = data.get("role", "user")

    if not chat_id or not message:
        return jsonify({"error": "Missing chat data"}), 400

    if role not in ("user", "assistant"):
        return jsonify({"error": "Invalid role"}), 400

    save_message(
        request.user_id,
        chat_id,
        role,
        message
    )

    return jsonify({"success": True})

@chat_bp.route("/chat/history/<chat_id>")
@require_user
def history(chat_id):
    return jsonify({
        "messages": get_history(
            request.user_id,
            chat_id
        )
    })

@chat_bp.route("/chats")
@require_user
def chats():
    return jsonify({
        "chats": get_all_chats(request.user_id)
    })
  
