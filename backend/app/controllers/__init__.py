import fastapi as fa
from app.controllers.authentication_controller import AUTH_CONTROLLER
from app.controllers.restaurant_controller import RESTAURANT_CONTROLLER
from app.controllers.reservation_controller import RESERVATION_CONTROLLER, AVAILABILITY_CONTROLLER

ROOT_ROUTER = fa.APIRouter()


@ROOT_ROUTER.get("/")
def test():
    return {"hello": "world"}


ALL_CONTROLLERS = [
    ROOT_ROUTER,
    AUTH_CONTROLLER,
    RESTAURANT_CONTROLLER,
    AVAILABILITY_CONTROLLER,
    RESERVATION_CONTROLLER,
]