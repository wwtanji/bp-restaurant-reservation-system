from app.controllers.authentication_controller import AUTH_CONTROLLER
from app.controllers.restaurant_controller import RESTAURANT_CONTROLLER
from app.controllers.reservation_controller import RESERVATION_CONTROLLER
from app.controllers.owner_controller import OWNER_CONTROLLER
from app.controllers.review_controller import REVIEW_CONTROLLER
from app.controllers.favorite_controller import FAVORITE_CONTROLLER
from app.controllers.admin_controller import ADMIN_CONTROLLER
from app.controllers.table_controller import TABLE_CONTROLLER
from app.controllers.payment_controller import PAYMENT_CONTROLLER

ALL_CONTROLLERS = [
    AUTH_CONTROLLER,
    RESTAURANT_CONTROLLER,
    RESERVATION_CONTROLLER,
    OWNER_CONTROLLER,
    TABLE_CONTROLLER,
    REVIEW_CONTROLLER,
    FAVORITE_CONTROLLER,
    ADMIN_CONTROLLER,
    PAYMENT_CONTROLLER,
]
