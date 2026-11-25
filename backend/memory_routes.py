
from flask import Blueprint, request, jsonify
from backend.auth import require_user
from backend.memory import (
    save_memory,
    get_memories,
    delete_memory
)

memory_bp = Blueprint("memory", __name__)

@memory_bp.route("/memory", methods=["GET"])
@require_user
def list_memory():
    return jsonify({
        "memories": get_memories(request.user_id)
    })

@memory_bp.route("/memory", methods=["POST"])
@require_user
def add_memory():
    data = request.get_json(silent=True) or {}
    memory = str(data.get("memory", ""))

    if not memory.strip():
        return jsonify({"error": "Memory is empty"}), 400

    save_memory(request.user_id, memory)

    return jsonify({"success": True})

@memory_bp.route("/memory/<int:index>", methods=["DELETE"])
@require_user
def remove_memory(index):
    if delete_memory(request.user_id, index):
        return jsonify({"success": True})

    return jsonify({"error": "Memory not found"}), 404
