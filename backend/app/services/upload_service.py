from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile

UPLOAD_DIR = Path("static/uploads/restaurants")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024


def validate_image(file: UploadFile) -> None:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 5 MB")


def save_image(file: UploadFile, restaurant_id: int, prefix: str) -> str:
    validate_image(file)
    ext = Path(file.filename or "").suffix.lower()
    directory = UPLOAD_DIR / str(restaurant_id)
    directory.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}_{uuid4().hex}{ext}"
    filepath = directory / filename
    filepath.write_bytes(file.file.read())
    return f"/static/uploads/restaurants/{restaurant_id}/{filename}"


def delete_image(file_url: str) -> None:
    if not file_url.startswith("/static/"):
        return
    filepath = Path(file_url.lstrip("/"))
    if filepath.exists():
        filepath.unlink()
