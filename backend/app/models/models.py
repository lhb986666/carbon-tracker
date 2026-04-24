from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid, datetime
from app.models.user import User


class Upload(Base):
    __tablename__ = "uploads"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename    = Column(String, nullable=False)
    status      = Column(String, default="pending")
    total_rows  = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user         = relationship("User", back_populates="uploads")
    transactions = relationship("Transaction", back_populates="upload")


class Category(Base):
    __tablename__ = "categories"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name            = Column(String, unique=True, nullable=False)
    parent_category = Column(String, nullable=True)
    unit            = Column(String, nullable=True)

    coefficient  = relationship("CarbonCoefficient", back_populates="category", uselist=False)
    transactions = relationship("Transaction", back_populates="category")


class CarbonCoefficient(Base):
    __tablename__ = "carbon_coefficients"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id    = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    coefficient    = Column(Float, nullable=False)
    unit           = Column(String, nullable=False)
    source         = Column(String, nullable=True)
    effective_from = Column(Date, default=datetime.date.today)

    category = relationship("Category", back_populates="coefficient")


class Transaction(Base):
    __tablename__ = "transactions"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id          = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    upload_id        = Column(UUID(as_uuid=True), ForeignKey("uploads.id"), nullable=True)
    category_id      = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    merchant_name    = Column(String, nullable=False)
    amount           = Column(Integer, nullable=False)
    carbon_kg        = Column(Float, default=0.0)
    transaction_date = Column(Date, nullable=False)

    user            = relationship("User", back_populates="transactions")
    upload          = relationship("Upload", back_populates="transactions")
    category        = relationship("Category", back_populates="transactions")
    recommendations = relationship("Recommendation", back_populates="transaction")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False)
    action         = Column(String, nullable=False)
    saving_kg      = Column(Float, default=0.0)
    alternative    = Column(String, nullable=True)

    transaction = relationship("Transaction", back_populates="recommendations")