from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date
from dateutil.relativedelta import relativedelta

from app.database import get_db
from app.models.models import Transaction, Category
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.recommender import get_recommendations, simulate_saving
from app.services.ai_recommender import generate_ai_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


def get_category_carbon_for_month(db: Session, user_id, year: int, month: int) -> dict:
    rows = (
        db.query(Category.name, func.sum(Transaction.carbon_kg).label("total_carbon"))
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == user_id,
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
        .group_by(Category.name)
        .all()
    )
    return {r.name: round(float(r.total_carbon), 2) for r in rows}


@router.get("")
def list_recommendations(
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
    top_n: int = Query(default=5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category_carbon = get_category_carbon_for_month(db, current_user.id, year, month)
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


@router.get("/ai")
def get_ai_recommendation(
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_date = date(year, month, 1)

    this_month = get_category_carbon_for_month(db, current_user.id, base_date.year, base_date.month)

    last_month_date = base_date - relativedelta(months=1)
    last_month = get_category_carbon_for_month(db, current_user.id, last_month_date.year, last_month_date.month)

    two_months_ago_date = base_date - relativedelta(months=2)
    two_months_ago = get_category_carbon_for_month(db, current_user.id, two_months_ago_date.year, two_months_ago_date.month)

    if not this_month:
        return {"source": "none", "recommendations": []}

    trend_data = {
        "이번달": this_month,
        "지난달": last_month,
        "지지난달": two_months_ago,
    }

    ai_result = generate_ai_recommendations(trend_data)

    if ai_result:
        return {"source": "gemini", "recommendations": ai_result}
    else:
        fallback = get_recommendations(this_month, top_n=5)
        return {"source": "rule-based (fallback)", "recommendations": fallback}