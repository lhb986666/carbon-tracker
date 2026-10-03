import random
import string

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from pydantic import BaseModel
from datetime import date

from app.database import get_db
from app.models.social import Group, GroupMembership
from app.models.models import Transaction
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/groups", tags=["social"])


def generate_invite_code(db: Session, length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(20):
        code = "".join(random.choices(alphabet, k=length))
        if not db.query(Group).filter(Group.invite_code == code).first():
            return code
    raise HTTPException(status_code=500, detail="초대 코드 생성에 실패했습니다. 다시 시도해주세요.")


def display_name(user: User) -> str:
    return user.nickname or user.email.split("@")[0]


def require_membership(db: Session, group_id: str, user_id) -> Group:
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다.")
    is_member = (
        db.query(GroupMembership)
        .filter(GroupMembership.group_id == group_id, GroupMembership.user_id == user_id)
        .first()
    )
    if not is_member:
        raise HTTPException(status_code=403, detail="이 그룹의 멤버가 아닙니다.")
    return group


class CreateGroupRequest(BaseModel):
    name: str


class JoinGroupRequest(BaseModel):
    invite_code: str


@router.post("")
def create_group(
    req: CreateGroupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = Group(
        name=req.name,
        invite_code=generate_invite_code(db),
        owner_id=current_user.id,
    )
    db.add(group)
    db.flush()

    membership = GroupMembership(group_id=group.id, user_id=current_user.id)
    db.add(membership)
    db.commit()
    db.refresh(group)

    return {
        "id": str(group.id),
        "name": group.name,
        "invite_code": group.invite_code,
        "member_count": 1,
        "is_owner": True,
    }


@router.post("/join")
def join_group(
    req: JoinGroupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(Group).filter(Group.invite_code == req.invite_code.strip().upper()).first()
    if not group:
        raise HTTPException(status_code=404, detail="유효하지 않은 초대 코드입니다.")

    existing = (
        db.query(GroupMembership)
        .filter(GroupMembership.group_id == group.id, GroupMembership.user_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="이미 참여 중인 그룹입니다.")

    db.add(GroupMembership(group_id=group.id, user_id=current_user.id))
    db.commit()

    return {"message": f"'{group.name}' 그룹에 참여했어요.", "group_id": str(group.id)}


@router.get("")
def list_my_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Group, GroupMembership)
        .join(GroupMembership, GroupMembership.group_id == Group.id)
        .filter(GroupMembership.user_id == current_user.id)
        .all()
    )
    result = []
    for group, _ in rows:
        member_count = (
            db.query(func.count(GroupMembership.id))
            .filter(GroupMembership.group_id == group.id)
            .scalar()
        )
        result.append({
            "id": str(group.id),
            "name": group.name,
            "invite_code": group.invite_code,
            "member_count": member_count,
            "is_owner": group.owner_id == current_user.id,
        })
    return result


@router.get("/{group_id}")
def get_group_detail(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = require_membership(db, group_id, current_user.id)

    members = (
        db.query(User)
        .join(GroupMembership, GroupMembership.user_id == User.id)
        .filter(GroupMembership.group_id == group_id)
        .all()
    )

    return {
        "id": str(group.id),
        "name": group.name,
        "invite_code": group.invite_code,
        "is_owner": group.owner_id == current_user.id,
        "members": [
            {"id": str(m.id), "nickname": display_name(m), "is_me": m.id == current_user.id}
            for m in members
        ],
    }


@router.delete("/{group_id}/leave")
def leave_group(
    group_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = (
        db.query(GroupMembership)
        .filter(GroupMembership.group_id == group_id, GroupMembership.user_id == current_user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="이 그룹의 멤버가 아닙니다.")

    db.delete(membership)
    db.commit()
    return {"message": "그룹에서 나갔어요."}


@router.get("/{group_id}/leaderboard")
def get_leaderboard(
    group_id: str,
    year: int = Query(default=date.today().year),
    month: int = Query(default=date.today().month),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_membership(db, group_id, current_user.id)

    members = (
        db.query(User)
        .join(GroupMembership, GroupMembership.user_id == User.id)
        .filter(GroupMembership.group_id == group_id)
        .all()
    )
    member_ids = [m.id for m in members]
    member_map = {m.id: m for m in members}

    monthly_rows = (
        db.query(Transaction.user_id, func.sum(Transaction.carbon_kg).label("total"))
        .filter(
            Transaction.user_id.in_(member_ids),
            extract("year", Transaction.transaction_date) == year,
            extract("month", Transaction.transaction_date) == month,
        )
        .group_by(Transaction.user_id)
        .all()
    )
    monthly_map = {r.user_id: round(float(r.total), 2) for r in monthly_rows}

    alltime_rows = (
        db.query(Transaction.user_id, func.sum(Transaction.carbon_kg).label("total"))
        .filter(Transaction.user_id.in_(member_ids))
        .group_by(Transaction.user_id)
        .all()
    )
    alltime_map = {r.user_id: round(float(r.total), 2) for r in alltime_rows}

    entries = []
    for uid, user in member_map.items():
        entries.append({
            "user_id": str(uid),
            "nickname": display_name(user),
            "is_me": uid == current_user.id,
            "monthly_carbon_kg": monthly_map.get(uid, 0.0),
            "total_carbon_kg": alltime_map.get(uid, 0.0),
        })

    # 적게 배출할수록 좋은 순위 (오름차순), 데이터 없는(0) 사람은 맨 뒤로
    entries.sort(key=lambda e: (e["monthly_carbon_kg"] == 0, e["monthly_carbon_kg"]))
    for i, e in enumerate(entries, start=1):
        e["rank"] = i

    return {"year": year, "month": month, "entries": entries}
