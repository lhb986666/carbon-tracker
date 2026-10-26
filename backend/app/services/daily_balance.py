"""하루 탄소 수지(+/-) 계산.

- (+) 배출: 그날 결제 한 건당 carbon_kg
- (-) 절감:
    · 실제 절감(realized): 저탄소 수단을 이용한 경우, 같은 금액을 기준 수단으로 썼을 때 대비 줄인 양
    · 절감 가능(potential): 추천 대안을 실천했을 때 줄일 수 있는 양 (recommender.py의 saving_ratio 사용)
- 거래에는 날짜만 있으므로, 아침~저녁 순서는 업종별 대표 시간대로 배치한다.
"""
from sqlalchemy.orm import Session

from app.models.models import Transaction
from app.services.carbon import get_coefficient_info
from app.services.recommender import RECOMMENDATIONS

# 업종 -> (대표 시각, 시간대 라벨)
TIME_SLOTS: dict[str, tuple[str, str]] = {
    "항공":       ("07:00", "아침"),
    "대중교통":   ("08:30", "출근·이동"),
    "택시":       ("09:00", "출근·이동"),
    "카페":       ("10:30", "오전"),
    "패스트푸드": ("12:30", "점심"),
    "식당":       ("12:30", "점심"),
    "편의점":     ("15:00", "오후"),
    "의류":       ("16:00", "오후"),
    "주유":       ("17:30", "퇴근"),
    "전기차충전": ("18:00", "퇴근"),
    "마트":       ("18:30", "저녁"),
    "치킨":       ("19:30", "저녁"),
    "피자":       ("19:30", "저녁"),
    "온라인쇼핑": ("21:30", "밤"),
    "기타":       ("15:00", "오후"),
}

# 저탄소 수단 -> 비교 기준 수단 (같은 금액을 기준 수단에 썼다고 가정)
BASELINE: dict[str, str] = {
    "대중교통": "택시",
    "전기차충전": "주유",
}


def _slot(category: str) -> tuple[str, str]:
    return TIME_SLOTS.get(category, TIME_SLOTS["기타"])


def build_daily_balance(db: Session, user_id, target_date) -> dict:
    txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.transaction_date == target_date)
        .all()
    )

    items = []
    for t in txns:
        cat = t.category.name if t.category else "기타"
        time_str, slot_label = _slot(cat)
        emission = round(t.carbon_kg or 0.0, 3)

        saved = 0.0
        baseline = None
        if cat in BASELINE:
            baseline = BASELINE[cat]
            base_coef = get_coefficient_info(db, baseline)["coefficient"]
            my_coef = get_coefficient_info(db, cat)["coefficient"]
            saved = max(0.0, (t.amount / 1000) * (base_coef - my_coef))

        rec = RECOMMENDATIONS.get(cat)
        potential = round(emission * rec["saving_ratio"], 3) if rec and cat not in BASELINE else 0.0

        items.append({
            "id": str(t.id),
            "time": time_str,
            "slot": slot_label,
            "merchant": t.merchant_name,
            "category": cat,
            "amount": t.amount,
            "emission_kg": emission,
            "saved_kg": round(saved, 3),
            "baseline": baseline,
            "potential_saving_kg": potential,
            "tip": rec["action"] if rec and cat not in BASELINE else None,
        })

    items.sort(key=lambda x: (x["time"], -x["emission_kg"]))

    running = 0.0
    for it in items:
        running += it["emission_kg"] - it["saved_kg"]
        it["cumulative_kg"] = round(running, 3)

    total_emission = round(sum(i["emission_kg"] for i in items), 3)
    total_saved = round(sum(i["saved_kg"] for i in items), 3)
    total_potential = round(sum(i["potential_saving_kg"] for i in items), 3)

    return {
        "date": str(target_date),
        "items": items,
        "total_emission_kg": total_emission,
        "total_saved_kg": total_saved,
        "net_kg": round(total_emission - total_saved, 3),
        "potential_saving_kg": total_potential,
        "time_is_estimated": True,
    }
