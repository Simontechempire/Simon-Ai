
from flask import Blueprint, jsonify, request
from backend.auth import require_user
from backend.memory import read_db, write_db

account_bp = Blueprint("account", __name__)

@account_bp.route("/account")
@require_user
def account():
    db = read_db()
    uid = request.user_id

    db["users"].setdefault(uid, {
        "email": request.user_email,
        "name": request.user_email.split("@")[0]
    })

    write_db(db)

    return jsonify({
        "success": True,
        "email": request.user_email,
        "name": db["users"][uid]["name"]
    })
