from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date

from app.database import get_db
from app.models.models import Transaction, Category
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.classifier import classify_merchant
from app.services.carbon import calculate_carbon

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

class TransactionRequest(BaseModel):
    merchant: str
    amount: int

@router.post("")
def create_transaction(
    req: TransactionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat_name = classify_merchant(req.merchant)

    cat = db.query(Category).filter(Category.name == cat_name).first()
    if not cat:
        cat = Category(name=cat_name)
        db.add(cat)
        db.flush()

    carbon_kg = calculate_carbon(db, cat_name, req.amount)

    txn = Transaction(
        user_id=current_user.id,
        upload_id=None,
        category_id=cat.id,
        merchant_name=req.merchant,
        amount=req.amount,
        carbon_kg=carbon_kg,
        transaction_date=date.today(),
        source='notification',
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return {
        "id": str(txn.id),
        "merchant": txn.merchant_name,
        "amount": txn.amount,
        "carbon_kg": txn.carbon_kg,
        "category": cat_name,
    }