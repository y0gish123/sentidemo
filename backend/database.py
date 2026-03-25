"""
Database layer — MongoDB with graceful fallback to in-memory list.
"""
import os
from datetime import datetime

_incidents_memory = []  # In-memory fallback if MongoDB is unavailable
_db = None


def _get_collection():
    global _db
    if _db is not None:
        return _db
    try:
        from pymongo import MongoClient
        uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")
        client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')  # Will raise if not connected
        _db = client["sentinel"]["incidents"]
        print("[SENTINEL] MongoDB connected.")
        return _db
    except Exception as e:
        print(f"[SENTINEL] MongoDB unavailable ({e}). Using in-memory store.")
        return None


def save_incident(data: dict):
    try:
        col = _get_collection()
        doc = {**data, 'saved_at': datetime.now().isoformat()}
        if col is not None:
            col.insert_one(doc)
        else:
            _incidents_memory.append(doc)
    except Exception as e:
        print(f"[DB] Save failed (non-critical): {e}")
        _incidents_memory.append({**data, 'saved_at': datetime.now().isoformat()})


def get_incidents():
    try:
        col = _get_collection()
        if col is not None:
            docs = list(col.find({}, {'_id': 0}).sort('saved_at', -1).limit(50))
            return docs
        return list(reversed(_incidents_memory[-50:]))
    except Exception as e:
        print(f"[DB] Fetch failed: {e}")
        return []
