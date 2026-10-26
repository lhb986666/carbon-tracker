"""하루 탄소 수지(+/-) 계산.

- (+) 배출: 그날 결제 한 건당 carbon_kg
- (-) 절감:
    · 실제 절감(realized): 저탄소 수단을 이용한 경우, 같은 금액을 기준 수단으로 썼을 때 대비 줄인 양
    · 절감 가능(potential): 추천 대안을 실천했을 때 줄일 수 있는 양 (recommender.py의 saving_ratio 사용)
- 시각: 거래에 transaction_time(실제 결제 시각)이 있으면 그대로 쓰고,
  없는 거래(날짜만 있는 예전 데이터)만 업종별 시간 범위 안에서 거래 ID 기반으로 추정해 배치한다.
"""
from sqlalchemy.orm import Session

from app.models.models import Transaction
from app.services.carbon import get_coefficient_info
from app.services.recommender import RECOMMENDATIONS

# 업종 -> 하루 중 나타나기 쉬운 시간 범위들 (같은 업종이 여러 건이면 범위를 번갈아 사용)
TIME_WINDOWS: dict[str, list[tuple[str, str]]] = {
    "항공":       [("06:30", "09:00")],
    "대중교통":   [("07:30", "09:30"), ("18:00", "20:00")],
    "택시":       [("08:00", "10:00"), ("21:00", "23:30"), ("13:00", "16:00")],
    "카페":       [("08:30", "10:30"), ("13:00", "15:00"), ("15:30", "17:30")],
    "패스트푸드": [("11:30", "13:30"), ("18:00", "20:00")],
    "식당":       [("11:30", "13:30"), ("18:00", "20:00")],
    "편의점":     [("07:30", "09:00"), ("14:30", "17:00"), ("21:00", "23:00")],
    "의류":       [("14:00", "19:00")],
    "주유":       [("17:00", "19:00")],
    "전기차충전": [("20:00", "23:00")],
    "마트":       [("17:30", "20:30"), ("11:00", "14:00")],
    "치킨":       [("18:30", "21:00")],
    "피자":       [("18:30", "21:00")],
    "온라인쇼핑": [("20:30", "23:30"), ("12:00", "14:00")],
    "기타":       [("10:00", "20:00")],
}


def _to_min(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _slot_label(minutes: int) -> str:
    h = minutes // 60
    if h < 6:
        return "새벽"
    if h < 9:
        return "아침"
    if h < 11:
        return "오전"
    if h < 14:
        return "점심"
    if h < 17:
        return "오후"
    if h < 20:
        return "저녁"
    return "밤"


def _assign_time(category: str, rank: int, txn_id) -> tuple[str, str]:
    """같은 업종 안에서 rank번째 거래의 시각을 정한다.
    범위는 rank 순으로 번갈아 쓰고, 범위 안 위치는 거래 ID로 고정(새로고침해도 동일)."""
    windows = TIME_WINDOWS.get(category, TIME_WINDOWS["기타"])
    start_s, end_s = windows[rank % len(windows)]
    start, end = _to_min(start_s), _to_min(end_s)
    seed = int(str(txn_id).replace("-", "")[:8], 16)
    minutes = start + seed % max(1, end - start)
    minutes = (minutes // 5) * 5  # 5분 단위
    return f"{minutes // 60:02d}:{minutes % 60:02d}", _slot_label(minutes)


# 저탄소 수단 -> 비교 기준 수단 (같은 금액을 기준 수단에 썼다고 가정)
BASELINE: dict[str, str] = {
    "대중교통": "택시",
    "전기차충전": "주유",
}


def build_daily_balance(db: Session, user_id, target_date) -> dict:
    txns = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.transaction_date == target_date)
        .all()
    )

    txns.sort(key=lambda t: str(t.id))
    rank_by_cat: dict[str, int] = {}

    items = []
    for t in txns:
        cat = t.category.name if t.category else "기타"
        if t.transaction_time is not None:
            # 실제 결제 시각
            minutes = t.transaction_time.hour * 60 + t.transaction_time.minute
            time_str = f"{minutes // 60:02d}:{minutes % 60:02d}"
            slot_label = _slot_label(minutes)
            estimated = False
        else:
            # 시각이 없는 예전 데이터: 업종별 범위 안에서 추정
            rank = rank_by_cat.get(cat, 0)
            rank_by_cat[cat] = rank + 1
            time_str, slot_label = _assign_time(cat, rank, t.id)
            estimated = True
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
            "time_estimated": estimated,
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
        "time_is_estimated": any(i["time_estimated"] for i in items),
    }
