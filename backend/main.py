import fastapi as fa
from fastapi.middleware.cors import CORSMiddleware
from app.controllers import ALL_CONTROLLERS
from app.db.database import Base, engine
import app.models.restaurant  # noqa: F401
import app.models.seating     # noqa: F401
import app.models.reservation  # noqa: F401

Base.metadata.create_all(bind=engine)

API = fa.FastAPI(title="API", version="0.1.0", root_path="/api")

origins = [
    "http://localhost:3000",
]

API.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # TODO: z env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in ALL_CONTROLLERS:
    API.include_router(router)

@API.get("/")
async def root():
    return {"message": "API is working"}
