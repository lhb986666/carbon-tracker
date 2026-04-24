from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.seed import run_seed
from app.routers import auth, uploads, analysis, recommendations, simulation

Base.metadata.create_all(bind=engine)
run_seed()

app = FastAPI(
    title="탄소발자국 추적기 API",
    description="소비 내역 기반 개인 탄소 배출량 분석 및 친환경 추천 서비스",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(uploads.router)
app.include_router(analysis.router)
app.include_router(recommendations.router)
app.include_router(simulation.router)

@app.get("/")
def root():
    return {"message": "탄소발자국 추적기 API가 실행 중입니다 🌿"}