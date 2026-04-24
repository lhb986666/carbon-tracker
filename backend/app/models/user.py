from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid, datetime

class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email         = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    age_group     = Column(String, nullable=True)
    region        = Column(String, nullable=True)
    expo_push_token = Column(String, nullable=True)
    created_at    = Column(DateTime, default=datetime.datetime.utcnow)

    uploads      = relationship("Upload", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")