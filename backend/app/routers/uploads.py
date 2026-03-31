from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import io, uuid

from app.database import get_db
from app.models.models import Upload, Transaction, Category, CarbonCoefficient
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.classifier import classify_merchant
from app.services.carbon import calculate_carbon

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


def parse_csv(content: bytes) -> pd.DataFrame:
    df = pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")

    rename_map = {}
    for col in df.columns:
        if any(k in col for k in ["일자", "날짜", "date"]):
            rename_map[col] = "transaction_date"
        elif any(k in col for k in ["가맹점", "상호", "merchant"]):
            rename_map[col] = "merchant_name"
        elif any(k in col for k in ["금액", "이용액", "amount"]):
            rename_map[col] = "amount"

    df = df.rename(columns=rename_map)

    required = {"transaction_date", "merchant_name", "amount"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV에서 필수 컬럼을 찾을 수 없습니다: {missing}")

    df["transaction_date"] = pd.to_datetime(df["transaction_date"]).dt.date
    df["amount"] = df["amount"].astype(str).str.replace(",", "").astype(int).abs()
    df = df.dropna(subset=["merchant_name", "amount"])

    return df[["transaction_date", "merchant_name", "amount"]]


@router.post("")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSV 파일만 업로드 가능합니다.")

    content = await file.read()

    upload = Upload(user_id=current_user.id, filename=file.filename, status="processing")
    db.add(upload)
    db.commit()
    db.refresh(upload)

    try:
        df = parse_csv(content)
        upload.total_rows = len(df)

        category_cache: dict[str, Category] = {}

        for _, row in df.iterrows():
            merchant = str(row["merchant_name"])
            amount = int(row["amount"])
            cat_name = classify_merchant(merchant)

            if cat_name not in category_cache:
                cat = db.query(Category).filter(Category.name == cat_name).first()
                if not cat:
                    cat = Category(name=cat_name)
                    db.add(cat)
                    db.flush()
                category_cache[cat_name] = cat
            category = category_cache[cat_name]

            carbon_kg = calculate_carbon(db,cat_name, amount)

            txn = Transaction(
                user_id=current_user.id,
                upload_id=upload.id,
                category_id=category.id,
                merchant_name=merchant,
                amount=amount,
                carbon_kg=carbon_kg,
                transaction_date=row["transaction_date"],
            )
            db.add(txn)

        upload.status = "done"
        db.commit()

    except Exception as e:
        upload.status = "failed"
        db.commit()
        raise HTTPException(status_code=422, detail=f"CSV 처리 중 오류: {str(e)}")

    return {
        "upload_id": str(upload.id),
        "status": "done",
        "total_rows": upload.total_rows,
        "message": f"{upload.total_rows}건 분석 완료",
    }


@router.get("")
def list_uploads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uploads = (
        db.query(Upload)
        .filter(Upload.user_id == current_user.id)
        .order_by(Upload.uploaded_at.desc())
        .all()
    )
    return [
        {
            "id": str(u.id),
            "filename": u.filename,
            "status": u.status,
            "total_rows": u.total_rows,
            "uploaded_at": u.uploaded_at.isoformat(),
        }
        for u in uploads
    ]


@router.get("/{upload_id}/status")
def get_upload_status(
    upload_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload = db.query(Upload).filter(
        Upload.id == upload_id,
        Upload.user_id == current_user.id
    ).first()
    if not upload:
        raise HTTPException(status_code=404, detail="업로드 내역을 찾을 수 없습니다.")
    return {"upload_id": upload_id, "status": upload.status, "total_rows": upload.total_rows}