from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date

from app.database import get_db
from app.models.models import Transaction, Category
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.recommender import get_recommendations, simulate_saving

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("")
def list_recommendations(
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
    top_n: int = Query(default=5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Category.name, func.sum(Transaction.carbon_kg).label("total_carbon"))
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
        .group_by(Category.name)
        .all()
    )

    category_carbon = {r.name: r.total_carbon for r in rows}
    recommendations = get_recommendations(category_carbon, top_n=top_n)
    return recommendations


@router.get("/simulate")
def simulate(
    category: str = Query(...),
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(func.sum(Transaction.carbon_kg).label("total_carbon"))
        .join(Category, Category.id == Transaction.category_id)
        .filter(
            Transaction.user_id == current_user.id,
            Category.name == category,
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
        .scalar()
    )

    if not row:
        return {"error": f"해당 월에 '{category}' 업종 소비 내역이 없습니다."}

    return simulate_saving(category, float(row))