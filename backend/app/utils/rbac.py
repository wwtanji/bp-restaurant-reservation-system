from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from app.utils.jwt_utils import verify_token
from app.models.user import User, UserRole
from app.db.database import get_db


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from access token

    Args:
        credentials: Bearer token from request header
        db: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials

    # Verify JWT token
    payload = verify_token(token, "access")
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    # Get user from database
    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


def require_roles(allowed_roles: List[int]):
    """
    Dependency factory for role-based access control

    Usage:
        @app.get("/admin-only", dependencies=[Depends(require_roles([UserRole.ADMIN]))])
        def admin_endpoint():
            return {"message": "Admin access granted"}

    Args:
        allowed_roles: List of allowed role values

    Returns:
        Dependency function that checks user role
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        """Check if current user has required role"""
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user

    return role_checker


# Convenience dependencies for common role checks
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require ADMIN role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_restaurant_owner(current_user: User = Depends(get_current_user)) -> User:
    """Require RESTAURANT_OWNER role"""
    if current_user.role != UserRole.RESTAURANT_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restaurant owner access required"
        )
    return current_user


def require_customer(current_user: User = Depends(get_current_user)) -> User:
    """Require CUSTOMER role"""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required"
        )
    return current_user


def require_restaurant_owner_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require RESTAURANT_OWNER or ADMIN role"""
    if current_user.role not in [UserRole.RESTAURANT_OWNER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restaurant owner or admin access required"
        )
    return current_user
