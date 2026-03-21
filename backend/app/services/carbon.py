CARBON_COEFFICIENTS: dict[str, dict] = {
    "주유":       {"coefficient": 0.231, "unit": "kg CO2/천원", "source": "환경부"},
    "항공":       {"coefficient": 0.185, "unit": "kg CO2/천원", "source": "ICAO"},
    "마트":       {"coefficient": 0.082, "unit": "kg CO2/천원", "source": "FAO"},
    "카페":       {"coefficient": 0.045, "unit": "kg CO2/천원", "source": "Carbon Trust"},
    "편의점":     {"coefficient": 0.055, "unit": "kg CO2/천원", "source": "환경부"},
    "패스트푸드": {"coefficient": 0.072, "unit": "kg CO2/천원", "source": "Carbon Trust"},
    "치킨":       {"coefficient": 0.065, "unit": "kg CO2/천원", "source": "Carbon Trust"},
    "대중교통":   {"coefficient": 0.012, "unit": "kg CO2/천원", "source": "환경부"},
    "택시":       {"coefficient": 0.058, "unit": "kg CO2/천원", "source": "환경부"},
    "전기차충전": {"coefficient": 0.021, "unit": "kg CO2/천원", "source": "한국전력"},
    "온라인쇼핑": {"coefficient": 0.038, "unit": "kg CO2/천원", "source": "Carbon Trust"},
    "의류":       {"coefficient": 0.044, "unit": "kg CO2/천원", "source": "Carbon Trust"},
    "기타":       {"coefficient": 0.030, "unit": "kg CO2/천원", "source": "추정값"},
}

TREE_ABSORPTION_KG = 20.0
SEOUL_BUSAN_FLIGHT_KG = 62.0


def calculate_carbon(category: str, amount_krw: int) -> float:
    info = CARBON_COEFFICIENTS.get(category, CARBON_COEFFICIENTS["기타"])
    carbon_kg = (amount_krw / 1000) * info["coefficient"]
    return round(carbon_kg, 4)


def calculate_bulk(rows: list[dict]) -> list[float]:
    return [calculate_carbon(r["category"], r["amount"]) for r in rows]


def to_equivalents(total_carbon_kg: float) -> dict:
    return {
        "trees": round(total_carbon_kg / TREE_ABSORPTION_KG, 1),
        "flights_seoul_busan": round(total_carbon_kg / SEOUL_BUSAN_FLIGHT_KG, 1),
        "days_breathing": round(total_carbon_kg / 1.0, 0),
    }


def get_coefficient_info(category: str) -> dict:
    return CARBON_COEFFICIENTS.get(category, CARBON_COEFFICIENTS["기타"])