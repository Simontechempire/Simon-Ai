import json
import os
import threading

DB_PATH = os.environ.get(
    "DATABASE_FILE", "database/chats.json"
)

lock = threading.Lock()

def read_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    if not os.path.exists(DB_PATH):
        return {
            "users": {},
            "chats": {},
            "memories": {}
        }

    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {
            "users": {},
            "chats": {},
            "memories": {}
        }

def write_db(data):
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    temp = DB_PATH + ".tmp"

    with open(temp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    os.replace(temp, DB_PATH)

def save_message(user_id, chat_id, role, content):
    with lock:
        db = read_db()

        db["chats"].setdefault(user_id, {})
        db["chats"][user_id].setdefault(chat_id, [])

        db["chats"][user_id][chat_id].append({
            "role": role,
            "content": content
        })

        db["chats"][user_id][chat_id] = (
            db["chats"][user_id][chat_id][-100:]
        )

        write_db(db)

def get_history(user_id, chat_id):
    db = read_db()
    return db["chats"].get(user_id, {}).get(chat_id, [])

def get_all_chats(user_id):
    db = read_db()
    return db["chats"].get(user_id, {})

def save_memory(user_id, memory):
    memory = memory.strip()[:2000]

    if not memory:
        return False

    with lock:
        db = read_db()
        db["memories"].setdefault(user_id, [])
        db["memories"][user_id].append(memory)
        db["memories"][user_id] = (
            db["memories"][user_id][-30:]
        )
        write_db(db)

    return True

def get_memories(user_id):
    db = read_db()
    return db["memories"].get(user_id, [])

def delete_memory(user_id, index):
    with lock:
        db = read_db()
        items = db["memories"].get(user_id, [])

        if 0 <= index < len(items):
            items.pop(index)
            write_db(db)
            return True

    return False
