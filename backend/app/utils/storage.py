import os
import tempfile


BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UPLOAD_DIR = (
    os.path.join(tempfile.gettempdir(), "agrovision", "uploads")
    if os.getenv("VERCEL")
    else os.path.join(BACKEND_DIR, "uploads")
)
os.makedirs(UPLOAD_DIR, exist_ok=True)