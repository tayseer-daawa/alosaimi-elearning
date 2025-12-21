from fastapi import APIRouter

from app.api.routes import (
    books,
    exams,
    lessons,
    login,
    phases,
    private,
    programs,
    questions,
    sessions,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(programs.router)
api_router.include_router(phases.router)
api_router.include_router(books.router)
api_router.include_router(lessons.router)
api_router.include_router(questions.router)
api_router.include_router(sessions.router)
api_router.include_router(exams.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
