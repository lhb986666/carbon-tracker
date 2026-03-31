from app.database import SessionLocal
from app.models.models import Category, CarbonCoefficient

SEED_DATA = [
    {"name": "주유",       "coefficient": 0.231, "unit": "kg CO2/천원", "source": "환경부"},
    {"name": "항공",       "coefficient": 0.185, "unit": "kg CO2/천원", "source": "ICAO"},
    {"name": "마트",       "coefficient": 0.082, "unit": "kg CO2/천원", "source": "FAO"},
    {"name": "카페",       "coefficient": 0.045, "unit": "kg CO2/천원", "source": "Carbon Trust"},
    {"name": "편의점",     "coefficient": 0.055, "unit": "kg CO2/천원", "source": "환경부"},
    {"name": "패스트푸드", "coefficient": 0.072, "unit": "kg CO2/천원", "source": "Carbon Trust"},
    {"name": "치킨",       "coefficient": 0.065, "unit": "kg CO2/천원", "source": "Carbon Trust"},
    {"name": "대중교통",   "coefficient": 0.012, "unit": "kg CO2/천원", "source": "환경부"},
    {"name": "택시",       "coefficient": 0.058, "unit": "kg CO2/천원", "source": "환경부"},
    {"name": "전기차충전", "coefficient": 0.021, "unit": "kg CO2/천원", "source": "한국전력"},
    {"name": "온라인쇼핑", "coefficient": 0.038, "unit": "kg CO2/천원", "source": "Carbon Trust"},
    {"name": "의류",       "coefficient": 0.044, "unit": "kg CO2/천원", "source": "Carbon Trust"},
    {"name": "기타",       "coefficient": 0.030, "unit": "kg CO2/천원", "source": "추정값"},
]

def run_seed():
    db = SessionLocal()
    try:
        if db.query(Category).count() > 0:
            print("이미 seed 데이터가 존재합니다. 건너뜁니다.")
            return

        for item in SEED_DATA:
            category = Category(name=item["name"], unit="천원")
            db.add(category)
            db.flush()

            coefficient = CarbonCoefficient(
                category_id=category.id,
                coefficient=item["coefficient"],
                unit=item["unit"],
                source=item["source"],
            )
            db.add(coefficient)

        db.commit()
        print(f"✅ {len(SEED_DATA)}개 업종 seed 완료!")
    except Exception as e:
        db.rollback()
        print(f"❌ seed 실패: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()