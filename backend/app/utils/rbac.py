from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.utils.jwt_utils import verify_token
from app.models.user import User, UserRole
from app.db.database import get_db


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = verify_token(token, "access")
    email = payload.get("sub")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    user = db.query(User).filter(User.user_email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def require_roles(*allowed_roles: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Insufficient permissions.",
            )
        return current_user

    return role_checker


require_admin = require_roles(UserRole.ADMIN)
require_restaurant_owner = require_roles(UserRole.RESTAURANT_OWNER)
require_customer = require_roles(UserRole.CUSTOMER)
require_restaurant_owner_or_admin = require_roles(
    UserRole.RESTAURANT_OWNER, UserRole.ADMIN
)
