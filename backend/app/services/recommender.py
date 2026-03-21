RECOMMENDATIONS: dict[str, dict] = {
    "주유": {
        "action": "대중교통 또는 카풀로 전환",
        "alternative": "버스·지하철 이용 또는 카카오T 카풀",
        "saving_ratio": 0.85,
        "tip": "주 3회 대중교통 전환 시 월 약 22 kg CO₂ 절감",
    },
    "항공": {
        "action": "KTX 또는 고속버스 이용",
        "alternative": "국내선 대신 KTX·고속버스 선택",
        "saving_ratio": 0.87,
        "tip": "서울-부산 KTX 이용 시 항공 대비 CO₂ 87% 절감",
    },
    "마트": {
        "action": "채식 위주 식단으로 전환",
        "alternative": "소고기 → 닭고기·두부·콩류 대체",
        "saving_ratio": 0.40,
        "tip": "소고기를 닭고기로 대체 시 탄소 발생량 약 11배 차이",
    },
    "카페": {
        "action": "텀블러 지참으로 일회용 컵 절감",
        "alternative": "텀블러 사용 시 할인 혜택도 있어요",
        "saving_ratio": 0.25,
        "tip": "텀블러 사용 시 월 약 5 kg CO₂ + 플라스틱 절감",
    },
    "편의점": {
        "action": "장보기로 대체해 포장재 줄이기",
        "alternative": "마트 또는 새벽배송 친환경 포장 서비스 이용",
        "saving_ratio": 0.20,
        "tip": "편의점 식품 대신 직접 요리 시 포장재·탄소 모두 절감",
    },
    "패스트푸드": {
        "action": "식물성 메뉴 선택",
        "alternative": "채식 버거, 비건 옵션 선택",
        "saving_ratio": 0.35,
        "tip": "비프버거 → 식물성 버거 전환 시 탄소 약 70% 절감",
    },
    "온라인쇼핑": {
        "action": "묶음 배송 활용",
        "alternative": "여러 건을 한 번에 주문해 배송 횟수 줄이기",
        "saving_ratio": 0.30,
        "tip": "하루 1회 배송으로 줄이면 월 약 3 kg CO₂ 절감",
    },
    "택시": {
        "action": "대중교통 또는 자전거 이용",
        "alternative": "가까운 거리는 따릉이·전동킥보드 활용",
        "saving_ratio": 0.75,
        "tip": "3km 이내 이동은 자전거로 전환 시 탄소 0 배출",
    },
}


def get_recommendations(
    category_carbon: dict[str, float],
    top_n: int = 5
) -> list[dict]:
    results = []

    for category, carbon_kg in category_carbon.items():
        if category not in RECOMMENDATIONS:
            continue
        rec = RECOMMENDATIONS[category]
        saving_kg = round(carbon_kg * rec["saving_ratio"], 2)
        results.append({
            "category": category,
            "current_carbon_kg": round(carbon_kg, 2),
            "action": rec["action"],
            "alternative": rec["alternative"],
            "saving_kg": saving_kg,
            "tip": rec["tip"],
            "priority": "high" if carbon_kg > 30 else "medium" if carbon_kg > 10 else "low",
        })

    results.sort(key=lambda x: x["saving_kg"], reverse=True)
    return results[:top_n]


def simulate_saving(category: str, current_carbon_kg: float) -> dict:
    if category not in RECOMMENDATIONS:
        return {"error": f"{category} 업종에 대한 추천 정보가 없습니다."}

    rec = RECOMMENDATIONS[category]
    saving_kg = round(current_carbon_kg * rec["saving_ratio"], 2)
    remaining_kg = round(current_carbon_kg - saving_kg, 2)

    return {
        "category": category,
        "current_carbon_kg": round(current_carbon_kg, 2),
        "saving_kg": saving_kg,
        "remaining_kg": remaining_kg,
        "saving_percent": round(rec["saving_ratio"] * 100, 0),
        "action": rec["action"],
        "tip": rec["tip"],
    }