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


def get_category_amount_for_month(db: Session, user_id, year: int, month: int) -> dict:
    rows = (
        db.query(Category.name, func.sum(Transaction.amount).label("total_amount"))
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == user_id,
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
        .group_by(Category.name)
        .all()
    )
    return {r.name: int(r.total_amount) for r in rows}


def get_weekday_pattern_for_month(db: Session, user_id, year: int, month: int) -> dict:
    """카테고리별 요일별 이용 횟수 (postgres dow: 0=일 ~ 6=토)"""
    DOW_NAMES = ["일", "월", "화", "수", "목", "금", "토"]
    rows = (
        db.query(
            Category.name.label("category"),
            extract("dow", Transaction.transaction_date).label("dow"),
            func.count(Transaction.id).label("cnt"),
        )
        .join(Category, Category.id == Transaction.category_id)
        .filter(
            Transaction.user_id == user_id,
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
        .group_by(Category.name, extract("dow", Transaction.transaction_date))
        .all()
    )
    result: dict[str, dict] = {}
    for r in rows:
        result.setdefault(r.category, {})
        result[r.category][DOW_NAMES[int(r.dow)]] = r.cnt
    return result


def get_merchant_frequency_for_month(db: Session, user_id, year: int, month: int, top_n: int = 5) -> dict:
    rows = (
        db.query(
            Category.name.label("category"),
            Transaction.merchant_name.label("merchant"),
            func.count(Transaction.id).label("cnt"),
            func.sum(Transaction.amount).label("total_amount"),
        )
        .join(Category, Category.id == Transaction.category_id)
        .filter(
            Transaction.user_id == user_id,
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
        .group_by(Category.name, Transaction.merchant_name)
        .order_by(func.count(Transaction.id).desc())
        .all()
    )
    result: dict[str, list] = {}
    for r in rows:
        result.setdefault(r.category, [])
        if len(result[r.category]) < top_n:
            result[r.category].append({
                "merchant": r.merchant,
                "count": r.cnt,
                "total_amount": int(r.total_amount),
            })
    return result


def get_personal_baseline(db: Session, user_id, base_date: date, months_back: int = 6) -> dict:
    """현재 달을 제외한 과거 N개월간 카테고리별 평균/최저/최고 탄소량"""
    monthly: dict[str, list] = {}
    for i in range(1, months_back + 1):
        d = base_date - relativedelta(months=i)
        data = get_category_carbon_for_month(db, user_id, d.year, d.month)
        for cat, val in data.items():
            monthly.setdefault(cat, []).append(val)

    baseline = {}
    for cat, values in monthly.items():
        if values:
            baseline[cat] = {
                "avg": round(sum(values) / len(values), 2),
                "min": round(min(values), 2),
                "max": round(max(values), 2),
            }
    return baseline


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

    if not this_month:
        return {"source": "none", "recommendations": []}

    last_month_date = base_date - relativedelta(months=1)
    last_month = get_category_carbon_for_month(db, current_user.id, last_month_date.year, last_month_date.month)
    two_months_ago_date = base_date - relativedelta(months=2)
    two_months_ago = get_category_carbon_for_month(db, current_user.id, two_months_ago_date.year, two_months_ago_date.month)

    merchants = get_merchant_frequency_for_month(db, current_user.id, base_date.year, base_date.month)
    amounts_this_month = get_category_amount_for_month(db, current_user.id, base_date.year, base_date.month)
    baseline = get_personal_baseline(db, current_user.id, base_date, months_back=6)
    weekday_pattern = get_weekday_pattern_for_month(db, current_user.id, base_date.year, base_date.month)

    profile_data = {
        "trend": {"이번달": this_month, "지난달": last_month, "지지난달": two_months_ago},
        "merchants": merchants,
        "amounts_this_month": amounts_this_month,
        "baseline": baseline,
        "weekday_pattern": weekday_pattern,
        "user": {"age_group": current_user.age_group, "region": current_user.region},
    }

    ai_result = generate_ai_recommendations(profile_data)

    if ai_result:
        return {"source": "gemini", "recommendations": ai_result}
    else:
        fallback = get_recommendations(this_month, top_n=5)
        return {"source": "rule-based (fallback)", "recommendations": fallback}