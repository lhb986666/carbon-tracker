from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
import asyncio

from app.database import get_db
from app.models.models import Transaction, Category
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.classifier import classify_merchant
from app.services.carbon import calculate_carbon
from app.services.push import send_push_notification

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


class PaymentRequest(BaseModel):
    merchant_name: str
    amount: int


@router.post("")
async def simulate_payment(
    req: PaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat_name = classify_merchant(req.merchant_name)
    carbon_kg = calculate_carbon(db, cat_name, req.amount)

    cat = db.query(Category).filter(Category.name == cat_name).first()
    if not cat:
        cat = Category(name=cat_name)
        db.add(cat)
        db.flush()

    txn = Transaction(
        user_id=current_user.id,
        category_id=cat.id,
        merchant_name=req.merchant_name,
        amount=req.amount,
        carbon_kg=carbon_kg,
        transaction_date=date.today(),
    )
    db.add(txn)
    db.commit()

    if current_user.expo_push_token:
        await send_push_notification(
            expo_token=current_user.expo_push_token,
            title="새 결제 탄소 발자국",
            body=f"{req.merchant_name} {req.amount:,}원 → {carbon_kg:.2f} kg CO₂ 발생",
            data={"screen": "Dashboard"}
        )

    return {
        "merchant_name": req.merchant_name,
        "amount": req.amount,
        "category": cat_name,
        "carbon_kg": round(carbon_kg, 2),
        "message": f"{req.merchant_name} 결제 → {carbon_kg:.2f} kg CO₂ 발생"
    }