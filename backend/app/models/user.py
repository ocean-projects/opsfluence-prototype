from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.db.base_class import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)

    # Cognito stable identity
    cognito_sub = Column(String, unique=True, index=True, nullable=True)

    email = Column(String, unique=True, index=True, nullable=False)

    # No longer required when using Cognito
    password_hash = Column(String, nullable=True)

    # admin | operator | auditor
    role = Column(String, nullable=False, default="auditor")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
