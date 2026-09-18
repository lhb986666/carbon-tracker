import os
import json
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

SYSTEM_PROMPT = """너는 개인 탄소발자국 분석 서비스의 추천 엔진이다.
사용자의 최근 3개월치 업종별 탄소배출량 추이 데이터를 보고, 실행 가능한 감축 팁 3개를 생성하라.

규칙:
- 반드시 JSON 배열로만 응답한다. 다른 설명이나 마크다운 코드블록 금지.
- 각 항목은 {"category": str, "message": str, "expected_reduction_pct": int, "trend": str} 형식이다.
- trend는 "증가", "감소", "유지" 중 하나로, 해당 업종의 3개월간 추세를 반영한다.
- message는 한국어, 70자 이내. 단순히 이번달 수치만 언급하지 말고,
  "최근 3개월간 계속 늘고 있다"거나 "지난달보다 줄어서 잘하고 있다" 같이
  추세를 반영한 맥락 있는 문장으로 작성한다.
- 추세가 뚜렷하게 증가 중인 업종을 우선적으로 다룬다.
- 입력 데이터에 없는 업종은 언급하지 않는다.
"""

model = genai.GenerativeModel(
    model_name="gemini-3.5-flash-lite",
    system_instruction=SYSTEM_PROMPT,
)


def generate_ai_recommendations(trend_data: dict) -> list[dict]:
    """
    trend_data 예시:
    {
        "이번달": {"주유": 23.1, "항공": 111, "마트": 13.12},
        "지난달": {"주유": 18.0, "마트": 12.0},
        "지지난달": {"주유": 15.0, "마트": 14.5}
    }
    """
    user_prompt = f"최근 3개월 업종별 탄소배출량(kg) 추이: {json.dumps(trend_data, ensure_ascii=False)}"

    try:
        response = model.generate_content(user_prompt)
        raw_text = response.text.strip()
        raw_text = raw_text.removeprefix("```json").removesuffix("```").strip()
        return json.loads(raw_text)
    except Exception as e:
        print(f"Gemini API 오류: {e}")
        return []