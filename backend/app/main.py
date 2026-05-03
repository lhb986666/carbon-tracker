from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.seed import run_seed
from app.routers import auth, uploads, analysis, recommendations, simulation

Base.metadata.create_all(bind=engine)
run_seed()

app = FastAPI(
    title="탄소발자국 추적기 API",
    description="카드 소비 기반 탄소 배출량 분석 및 친환경 추천 서비스",
    version="1.0.0",
)

origins = [
    "http://localhost:3000",
    "http://54.116.69.43:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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