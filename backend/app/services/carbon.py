from sqlalchemy.orm import Session
from app.models.models import Category, CarbonCoefficient

TREE_ABSORPTION_KG = 20.0
SEOUL_BUSAN_FLIGHT_KG = 62.0


def get_coefficient_info(db: Session, category: str) -> dict:
    cat = db.query(Category).filter(Category.name == category).first()
    if not cat or not cat.coefficient:
        cat = db.query(Category).filter(Category.name == "기타").first()

    return {
        "coefficient": cat.coefficient.coefficient,
        "unit": cat.coefficient.unit,
        "source": cat.coefficient.source,
    }


def calculate_carbon(db: Session, category: str, amount_krw: int) -> float:
    info = get_coefficient_info(db, category)
    carbon_kg = (amount_krw / 1000) * info["coefficient"]
    return round(carbon_kg, 4)


def calculate_bulk(db: Session, rows: list[dict]) -> list[float]:
    return [calculate_carbon(db, r["category"], r["amount"]) for r in rows]


def to_equivalents(total_carbon_kg: float) -> dict:
    return {
        "trees": round(total_carbon_kg / TREE_ABSORPTION_KG, 1),
        "flights_seoul_busan": round(total_carbon_kg / SEOUL_BUSAN_FLIGHT_KG, 1),
        "days_breathing": round(total_carbon_kg / 1.0, 0),
    }