from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.models import Transaction, Category
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.classifier import classify_merchant
from app.services.carbon import calculate_carbon

KST = timezone(timedelta(hours=9))  # 서버(UTC)와 무관하게 한국 시각으로 저장

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

    now = datetime.now(KST)

    # 같은 알림이 여러 번 들어와도 한 건만 저장 (2분 이내 동일 가맹점·금액)
    DUP_WINDOW_SEC = 120
    recent = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.source == 'notification',
            Transaction.merchant_name == req.merchant,
            Transaction.amount == req.amount,
            Transaction.transaction_date == now.date(),
        )
        .all()
    )
    for t in recent:
        t_dt = datetime.combine(t.transaction_date, t.transaction_time, tzinfo=KST)
        if abs((now - t_dt).total_seconds()) <= DUP_WINDOW_SEC:
            return {
                "id": str(t.id),
                "merchant": t.merchant_name,
                "amount": t.amount,
                "carbon_kg": t.carbon_kg,
                "category": cat_name,
                "transaction_time": t.transaction_time.strftime("%H:%M"),
                "duplicate": True,
            }

    carbon_kg = calculate_carbon(db, cat_name, req.amount)

    txn = Transaction(
        user_id=current_user.id,
        upload_id=None,
        category_id=cat.id,
        merchant_name=req.merchant,
        amount=req.amount,
        carbon_kg=carbon_kg,
        transaction_date=now.date(),
        transaction_time=now.time().replace(microsecond=0),
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
        "transaction_time": txn.transaction_time.strftime("%H:%M"),
    }