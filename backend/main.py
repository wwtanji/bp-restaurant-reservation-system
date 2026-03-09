import fastapi as fa
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.controllers import ALL_CONTROLLERS
import app.models

API = fa.FastAPI(title="API", version="0.1.0", root_path="/api")

origins = [
    "http://localhost:3000",
]

API.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path("static/uploads").mkdir(parents=True, exist_ok=True)
API.mount("/static", StaticFiles(directory="static"), name="static")

for router in ALL_CONTROLLERS:
    API.include_router(router)


@API.get("/")
async def root():
    return {"message": "API is working"}
