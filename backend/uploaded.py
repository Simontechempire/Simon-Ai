
import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from backend.auth import require_user

uploaded_bp = Blueprint("uploaded", __name__)

UPLOAD_DIR = "uploads"
ALLOWED = {
    "txt", "md", "json", "csv",
    "py", "js", "html", "css"
}

os.makedirs(UPLOAD_DIR, exist_ok=True)

@uploaded_bp.route("/upload", methods=["POST"])
@require_user
def upload():
    file = request.files.get("file")

    if not file or not file.filename:
        return jsonify({"error": "No file selected"}), 400

    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ALLOWED:
        return jsonify({
            "error": "Unsupported file type"
        }), 400

    content = file.read(2 * 1024 * 1024 + 1)

    if len(content) > 2 * 1024 * 1024:
        return jsonify({"error": "File too large"}), 413

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        return jsonify({"error": "Invalid text file"}), 400

    safe_name = str(uuid.uuid4()) + "_" + filename
    path = os.path.join(UPLOAD_DIR, safe_name)

    with open(path, "wb") as f:
        f.write(content)

    return jsonify({
        "success": True,
        "filename": filename,
        "content": text[:30000]
    })
  
