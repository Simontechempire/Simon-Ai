
import os
from functools import wraps
from flask import request, jsonify, g
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

def require_user(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        token = request.headers.get(
            "Authorization", ""
        ).replace("Bearer ", "", 1)

        client_id = os.environ.get("GOOGLE_CLIENT_ID")

        if not token or not client_id:
            return jsonify({
                "error": "Google login required"
            }), 401

        try:
            claims = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id
            )

            request.user_id = claims["sub"]
            request.user_email = claims.get("email", "")

        except Exception:
            return jsonify({
                "error": "Invalid or expired login"
            }), 401

        return function(*args, **kwargs)

    return wrapper
                           
