from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date

from app.database import get_db
from app.models.models import Transaction, Category
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.carbon import to_equivalents
from app.services.recommender import get_recommendations

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/monthly")
def monthly_summary(
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
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

    category_carbon = {row.name: round(row.total_carbon, 2) for row in rows}
    total_kg = round(sum(category_carbon.values()), 2)

    return {
        "year": year,
        "month": month,
        "total_carbon_kg": total_kg,
        "by_category": category_carbon,
        "equivalents": to_equivalents(total_kg),
    }


@router.get("/by-category")
def by_category(
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
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
        .order_by(func.sum(Transaction.carbon_kg).desc())
        .all()
    )

    total = sum(r.total_carbon for r in rows) or 1
    return [
        {
            "category": r.name,
            "carbon_kg": round(r.total_carbon, 2),
            "percent": round(r.total_carbon / total * 100, 1),
        }
        for r in rows
    ]


@router.get("/trend")
def trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(
            extract("year", Transaction.transaction_date).label("year"),
            extract("month", Transaction.transaction_date).label("month"),
            func.sum(Transaction.carbon_kg).label("total_carbon"),
        )
        .filter(Transaction.user_id == current_user.id)
        .group_by("year", "month")
        .order_by("year", "month")
        .limit(6)
        .all()
    )

    return [
        {
            "label": f"{int(r.year)}.{int(r.month):02d}",
            "carbon_kg": round(r.total_carbon, 2),
        }
        for r in rows
    ]


@router.get("/compare")
def compare_with_average(
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    my_total = (
        db.query(func.sum(Transaction.carbon_kg))
        .filter(
            Transaction.user_id == current_user.id,
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
        .scalar() or 0
    )

    from app.models.user import User as UserModel
    subq = (
        db.query(func.sum(Transaction.carbon_kg).label("user_total"))
        .join(UserModel, UserModel.id == Transaction.user_id)
        .filter(
            UserModel.age_group == current_user.age_group,
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
        .group_by(Transaction.user_id)
        .subquery()
    )
    avg_total = db.query(func.avg(subq.c.user_total)).scalar() or 118.0

    diff_pct = round((my_total - avg_total) / avg_total * 100, 1) if avg_total else 0

    return {
        "my_carbon_kg": round(my_total, 2),
        "avg_carbon_kg": round(avg_total, 2),
        "diff_percent": diff_pct,
        "age_group": current_user.age_group,
    }