import os
from flask import Flask, send_from_directory, jsonify

from backend.chat import chat_bp
from backend.uploaded import uploaded_bp
from backend.download import download_bp
from backend.ai import ai_bp
from backend.memory_routes import memory_bp
from backend.account import account_bp

app = Flask(__name__, static_folder="frontend")

app.config["MAX_CONTENT_LENGTH"] = 15 * 1024 * 1024

os.makedirs("database", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
os.makedirs("downloads", exist_ok=True)

app.register_blueprint(chat_bp, url_prefix="/api")
app.register_blueprint(uploaded_bp, url_prefix="/api")
app.register_blueprint(download_bp, url_prefix="/api")
app.register_blueprint(ai_bp, url_prefix="/api")
app.register_blueprint(memory_bp, url_prefix="/api")
app.register_blueprint(account_bp, url_prefix="/api")

@app.route("/")
def home():
    return send_from_directory("frontend", "index.html")

@app.route("/<path:filename>")
def frontend_files(filename):
    # Don't catch /api routes
    if filename.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    return send_from_directory("frontend", filename)

@app.route("/login_and_sign_up/<path:filename>")
def login_files(filename):
    return send_from_directory("login_and_sign_up", filename)

@app.route("/apk/<path:filename>")
def apk_files(filename):
    # Fix case: folder na "Apk" for repo, but URL na "/apk"
    # Try both so e no 404 for Render (Linux na case-sensitive)
    for folder in ["Apk", "apk", "APK"]:
        path = os.path.join(folder, filename)
        if os.path.exists(path):
            return send_from_directory(folder, filename)
    return jsonify({"error": "APK not found"}), 404

@app.route("/site")
def landing_page():
    return send_from_directory("simon.site/site", "index.html")

@app.route("/api/health")
def health():
    return jsonify({
        "name": "SIMON AI",
        "version": "1.0.0",
        "status": "online"
    })

@app.errorhandler(413)
def too_large(error):
    return jsonify({"error": "File too large"}), 413

@app.errorhandler(404)
def not_found(error):
    # If na API, return JSON. If na frontend, return index.html
    from flask import request
    if request.path.startswith("/api/"):
        return jsonify({"error": "Not found"}), 404
    try:
        return send_from_directory("frontend", "index.html")
    except:
        return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
