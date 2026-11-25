
import os
import re
from flask import Blueprint, request, jsonify, send_from_directory
from backend.auth import require_user

download_bp = Blueprint("download", __name__)

DOWNLOAD_DIR = "downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

@download_bp.route("/download", methods=["POST"])
@require_user
def create_download():
    data = request.get_json(silent=True) or {}

    filename = str(data.get("filename", "simon-ai.txt"))
    content = str(data.get("content", ""))

    filename = os.path.basename(filename)
    filename = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)

    if not filename or len(filename) > 100:
        return jsonify({"error": "Invalid filename"}), 400

    if len(content) > 1000000:
        return jsonify({"error": "Content too large"}), 413

    with open(
        os.path.join(DOWNLOAD_DIR, filename),
        "w",
        encoding="utf-8"
    ) as f:
        f.write(content)

    return send_from_directory(
        DOWNLOAD_DIR,
        filename,
        as_attachment=True
  )
  
