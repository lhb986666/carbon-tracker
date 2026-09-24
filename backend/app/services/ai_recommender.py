import os
import json
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """너는 개인 탄소발자국 분석 서비스의 추천 엔진이다.
사용자의 소비 데이터(카테고리별 3개월 탄소배출 추이, 가맹점별 이용 빈도(최대 5곳),
카테고리별 이번 달 지출액, 최근 6개월 개인 평균/최저치, 카테고리별 요일별 이용 횟수(weekday_pattern),
나이대·지역 정보)를 종합해서, 이 사람만을 위한 맞춤 감축 방안을 생성하라.

너는 뻔한 "스티커 문구"가 아니라, 이 사람의 생활 패턴을 탐정처럼 추리해서 알려주는 역할이다.

반드시 지켜야 할 추론 규칙:
1. **가맹점명에 들어있는 지역/지점 정보를 카테고리를 넘나들며 교차 분석하라.**
   예를 들어 한 카테고리의 가맹점에는 "강남역점"이 반복되고 다른 카테고리(편의점, 식당, 카페 등)에는
   "까치산역점", "화곡동점" 같은 다른 지역명이 반복된다면, 이는 "직장(강남역)-거주지(까치산역/화곡동)"
   통근 패턴일 가능성이 높다. 이런 지역명 조합을 발견하면 반드시 situation/insight/action에서
   그 동선을 구체적으로 언급하라 (예: "강남역 인근에서 근무 후 까치산역 자택까지 이동하며").
2. **weekday_pattern을 반드시 참고해서 요일 패턴을 구체적으로 언급하라.**
   특정 요일(화/목 등)에 몰려있다면 "화요일과 목요일에 집중" 처럼 실제 요일명을 인용하고,
   평일에 몰려있다면 "평일 저녁", 주말에 몰려있다면 "주말" 이라고 명시하라. 요일 데이터가 뒷받침하지
   않는 추측(예: "야근" 같은 사유)은 단정하지 말고 "~하는 것으로 보인다" 정도로만 표현하라.
3. **절대로 아래와 같은 뻔한 템플릿 문구를 쓰지 마라 (감점 대상):**
   "OO 대신 OO을(를) 이용하세요", "불필요한 소비를 줄이세요", "적극 활용하세요", "실천해보세요" 로 끝나는
   기계적인 문장. 대신 이 사람의 구체적 상황(요일, 동선, 반복 가맹점)에서만 나올 수 있는 현실적이고
   실행 가능한 대안을 제시하라 (예: 특정 요일에 미리 일정을 조정한다, 특정 시간대 요금/혼잡을 피한다,
   반복 방문하는 가맹점 주변의 대체 수단을 구체적으로 짚어준다 등). 카테고리마다 문장 구조와 표현을
   다르게 써서, 여러 항목을 나란히 봤을 때 서로 다른 사람이 쓴 것처럼 자연스럽게 느껴지게 하라.

절대 규칙:
- 반드시 JSON 배열로만 응답한다. 다른 설명, 마크다운 코드블록 절대 금지.
- 입력에 있는 카테고리 중 의미 있는 소비가 있는 것들을 우선순위(추세 증가 > 지출 큼 > 나머지) 순으로 다룬다.
  개수를 임의로 3개로 제한하지 말고, 데이터가 있는 만큼 다뤄라 (단, 최대 6개).
- 각 항목은 다음 형식이다:
  {
    "category": str,
    "situation": str (이번 달 실제 소비 행동을 구체적으로 — 가맹점명, 방문 횟수, 금액, 요일 패턴을 반드시 인용.
                       데이터에 없는 정보는 지어내지 말고 총액/횟수/요일만 언급),
    "insight": str (3개월 추이 또는 개인 평균 대비 변화를 수치로 언급. 가능하면 동선/요일 인사이트 포함),
    "action": str (situation에서 언급한 가맹점/요일/동선 패턴을 그대로 받아서 제안하는 구체적 행동.
                    일반론과 뻔한 템플릿 문구 절대 금지),
    "expected_reduction_pct": int,
    "expected_saving_krw": int (0 이상, 모르면 0),
    "expected_saving_kg": float,
    "trend": "증가" | "감소" | "유지"
  }
- situation과 action은 반드시 입력 데이터에 있는 실제 가맹점명, 금액, 횟수, 요일을 근거로 작성한다. 근거 없는 추측 금지.
- 나이대(age_group) 정보가 있으면 그 연령대가 공감할 수 있는 어투/맥락(자취, 학업, 사회초년생 등)을
  자연스럽게 반영하되, 나이를 노골적으로 언급하지 않는다.
- 모든 문장은 한국어로, 자연스럽고 구체적으로 작성한다. 뻔한 일반론만 반복하지 않는다.
"""

model = genai.GenerativeModel(
    model_name="gemini-3.5-flash-lite",
    system_instruction=SYSTEM_PROMPT,
    generation_config={"temperature": 1.1, "top_p": 0.95},
)


def generate_ai_recommendations(profile_data: dict) -> list[dict]:
    """
    profile_data 예시:
    {
        "trend": {
            "이번달": {"택시": 12.3, "카페": 5.1},
            "지난달": {"택시": 8.0, "카페": 4.9},
            "지지난달": {"택시": 7.5, "카페": 5.0}
        },
        "merchants": {
            "택시": [{"merchant": "카카오T", "count": 12, "total_amount": 120000}],
            "카페": [{"merchant": "스타벅스 강남점", "count": 8, "total_amount": 40000}]
        },
        "amounts_this_month": {"택시": 120000, "카페": 40000},
        "baseline": {
            "택시": {"avg": 60000.0, "min": 40000.0, "max": 90000.0}
        },
        "user": {"age_group": "20대", "region": "서울"}
    }
    """
    user_prompt = json.dumps(profile_data, ensure_ascii=False)

    try:
        response = model.generate_content(user_prompt)
        raw_text = response.text.strip()
        raw_text = raw_text.removeprefix("```json").removesuffix("```").strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"Gemini API 오류: {e}")
        return []