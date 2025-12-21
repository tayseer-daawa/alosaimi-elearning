from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import SessionDep
from app.core.security import get_password_hash
from app.models import (
    User,
    UserPublic,
)

router = APIRouter(tags=["private"], prefix="/private")


class PrivateUserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    father_name: str
    family_name: str
    is_male: bool
    is_verified: bool = False


@router.post("/users/", response_model=UserPublic)
def create_user(user_in: PrivateUserCreate, session: SessionDep):
    """
    Create a new user.
    """

    user = User(
        email=user_in.email,
        first_name=user_in.first_name,
        father_name=user_in.father_name,
        family_name=user_in.family_name,
        is_male=user_in.is_male,
        hashed_password=get_password_hash(user_in.password),
    )

    session.add(user)
    session.commit()

    return user
