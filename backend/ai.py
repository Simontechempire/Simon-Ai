from flask import Blueprint, jsonify

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/ai/status")
def ai_status():
    return jsonify({
        "name": "SIMON AI",
        "engine": "Transformers.js",
        "mode": "browser",
        "api_key_required": False,
        "model": "onnx-community/SmolLM2-360M-Instruct",
        "status": "ready"
    })
