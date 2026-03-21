BRAND_DICT: dict[str, str] = {
    "gs칼텍스": "주유", "sk에너지": "주유", "현대오일뱅크": "주유",
    "s-oil": "주유", "오일뱅크": "주유", "주유소": "주유",

    "스타벅스": "카페", "투썸플레이스": "카페", "이디야": "카페",
    "빽다방": "카페", "메가커피": "카페", "할리스": "카페",
    "폴바셋": "카페", "커피빈": "카페", "던킨": "카페",

    "gs25": "편의점", "cu": "편의점", "세븐일레븐": "편의점",
    "이마트24": "편의점", "미니스톱": "편의점",

    "이마트": "마트", "롯데마트": "마트", "홈플러스": "마트",
    "코스트코": "마트", "농협하나로": "마트",

    "맥도날드": "패스트푸드", "버거킹": "패스트푸드", "롯데리아": "패스트푸드",
    "kfc": "패스트푸드", "맘스터치": "패스트푸드",
    "bhc": "치킨", "교촌치킨": "치킨", "bbq": "치킨",

    "티머니": "대중교통", "t-money": "대중교통",
    "카카오택시": "택시", "우티": "택시", "타다": "택시",

    "대한항공": "항공", "아시아나": "항공", "제주항공": "항공",
    "진에어": "항공", "에어서울": "항공", "티웨이": "항공",

    "쿠팡": "온라인쇼핑", "네이버쇼핑": "온라인쇼핑", "11번가": "온라인쇼핑",
    "gmarket": "온라인쇼핑", "옥션": "온라인쇼핑",
    "유니클로": "의류", "자라": "의류", "h&m": "의류",

    "테슬라": "전기차충전", "환경부충전": "전기차충전",
    "한국전력충전": "전기차충전", "ev충전": "전기차충전",
}

PARENT_CATEGORY: dict[str, str] = {
    "주유": "교통", "대중교통": "교통", "택시": "교통",
    "항공": "교통", "전기차충전": "교통",
    "카페": "식음료", "편의점": "식음료", "마트": "식음료",
    "패스트푸드": "식음료", "치킨": "식음료",
    "온라인쇼핑": "쇼핑", "의류": "쇼핑",
}


def classify_merchant(merchant_name: str) -> str:
    name_lower = merchant_name.lower().strip()

    for keyword, category in BRAND_DICT.items():
        if keyword in name_lower:
            return category

    keyword_rules = [
        (["주유", "oil", "gas", "에너지"], "주유"),
        (["카페", "coffee", "커피", "로스터"], "카페"),
        (["편의점", "마트", "슈퍼"], "편의점"),
        (["치킨", "burger", "버거", "pizza", "피자"], "패스트푸드"),
        (["항공", "air", "airlines"], "항공"),
        (["택시", "cab", "ride"], "택시"),
        (["충전", "ev", "electric"], "전기차충전"),
        (["쇼핑", "shop", "mall", "store"], "온라인쇼핑"),
    ]
    for keywords, category in keyword_rules:
        if any(kw in name_lower for kw in keywords):
            return category

    return "기타"


def classify_merchants_bulk(merchant_names: list[str]) -> list[str]:
    return [classify_merchant(name) for name in merchant_names]