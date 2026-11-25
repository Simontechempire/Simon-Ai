
import os
from flask import Flask, send_from_directory, jsonify
from backend.chat import chat_bp
from backend.uploaded import uploaded_bp
from backend.download import download_bp
from backend.ai import ai_bp
from backend.memory_routes import memory_bp

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

@app.route("/")
def home():
    return send_from_directory("frontend", "index.html")

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
    return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 3000))
)
  
