from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.models import Farm, User, Expense, CropCalendarEvent
from app.schemas.schemas import (
    LedgerTransactionCreate,
    LedgerTransactionOut,
    LedgerSummaryOut,
    CategoryFinancialBreakdown,
    StageFinancialBreakdown,
    LedgerSyncRequest
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/ledger", tags=["Farm Ledger & Profitability"])

@router.post("/transactions", response_model=LedgerTransactionOut)
def create_ledger_transaction(
    tx_in: LedgerTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new income or expense transaction in the Farm Ledger for the selected farm.
    Verifies authenticated farmer ownership and automatically links to CropCalendarEvent timeline.
    """
    farm = db.query(Farm).filter(Farm.id == tx_in.farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or unauthorized")

    # If client_sync_id is provided, verify deduplication
    if tx_in.client_sync_id:
        existing = db.query(Expense).filter(
            Expense.farm_id == farm.id,
            Expense.client_sync_id == tx_in.client_sync_id
        ).first()
        if existing:
            return existing

    crop_name = tx_in.crop or farm.crop or "Crop"
    stage_name = tx_in.stage or farm.current_stage_override or "Vegetative Growth"

    new_tx = Expense(
        farm_id=farm.id,
        type=tx_in.type.lower() if tx_in.type else "expense",
        category=tx_in.category,
        crop=crop_name,
        item_name=tx_in.item_name,
        cost=float(tx_in.cost),
        date=tx_in.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        quantity=tx_in.quantity,
        unit=tx_in.unit,
        stage=stage_name,
        provenance=tx_in.provenance or "ACTUAL",
        notes=tx_in.notes,
        client_sync_id=tx_in.client_sync_id,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)

    # Auto-log to Crop Calendar Activity Timeline
    try:
        event_title = f"{'Income' if new_tx.type == 'income' else 'Expense'}: ₹{new_tx.cost:,.2f} ({new_tx.category})"
        calendar_event = CropCalendarEvent(
            farm_id=farm.id,
            event_type=new_tx.category if new_tx.category in ["Fertilizer", "Labour", "Irrigation", "Sowing", "Harvest"] else "General Note",
            title=event_title,
            description=f"{new_tx.item_name} • Recorded in Farm Ledger",
            stage=stage_name,
            event_date=new_tx.date,
            cost=new_tx.cost if new_tx.type == "expense" else 0.0,
            created_at=datetime.now(timezone.utc)
        )
        db.add(calendar_event)
        db.commit()
    except Exception as e:
        print(f"Calendar timeline sync note: {e}")

    return new_tx


@router.get("/transactions/{farm_id}", response_model=List[LedgerTransactionOut])
def get_farm_transactions(
    farm_id: int,
    type: Optional[str] = None, # expense, income
    category: Optional[str] = None,
    crop: Optional[str] = None,
    stage: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all ledger transactions for the selected farm with multi-dimensional filtering.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or unauthorized")

    query = db.query(Expense).filter(Expense.farm_id == farm.id)

    if type:
        query = query.filter(Expense.type == type.lower())
    if category and category != "All":
        query = query.filter(Expense.category == category)
    if crop and crop != "All":
        query = query.filter(Expense.crop.ilike(f"%{crop}%"))
    if stage and stage != "All":
        query = query.filter(Expense.stage.ilike(f"%{stage}%"))
    if date_from:
        query = query.filter(Expense.date >= date_from)
    if date_to:
        query = query.filter(Expense.date <= date_to)

    return query.order_by(desc(Expense.date), desc(Expense.id)).all()


@router.delete("/transactions/{transaction_id}")
def delete_ledger_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a transaction from the Farm Ledger after verifying ownership.
    """
    tx = db.query(Expense).join(Farm).filter(
        Expense.id == transaction_id,
        Farm.user_id == current_user.id
    ).first()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found or unauthorized")

    db.delete(tx)
    db.commit()
    return {"status": "success", "message": "Transaction deleted successfully"}


@router.get("/summary/{farm_id}", response_model=LedgerSummaryOut)
def get_farm_ledger_summary(
    farm_id: int,
    crop: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes rigorous farm profitability and expense breakdown strictly from REAL recorded transactions.
    Separates ACTUAL from ESTIMATED numbers and calculates cost/acre, revenue/acre, and profit/acre.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or unauthorized")

    query = db.query(Expense).filter(Expense.farm_id == farm.id)
    if crop and crop != "All":
        query = query.filter(Expense.crop.ilike(f"%{crop}%"))

    transactions = query.order_by(desc(Expense.date), desc(Expense.id)).all()

    total_income = 0.0
    total_expenses = 0.0
    actual_count = 0
    estimated_count = 0
    projected_count = 0

    category_amounts: Dict[str, float] = {}
    category_types: Dict[str, str] = {}
    stage_sums: Dict[str, Dict[str, float]] = {}

    for tx in transactions:
        amt = float(tx.cost or 0.0)
        tx_type = (tx.type or "expense").lower()
        prov = (tx.provenance or "ACTUAL").upper()

        if prov == "ACTUAL":
            actual_count += 1
        elif prov == "ESTIMATED":
            estimated_count += 1
        else:
            projected_count += 1

        if tx_type == "income":
            total_income += amt
        else:
            total_expenses += amt

        # Category sums
        cat = tx.category or "Other"
        category_types[cat] = tx_type
        category_amounts[cat] = category_amounts.get(cat, 0.0) + amt

        # Stage sums
        stg = tx.stage or "General Care"
        if stg not in stage_sums:
            stage_sums[stg] = {"expenses": 0.0, "income": 0.0}
        if tx_type == "income":
            stage_sums[stg]["income"] += amt
        else:
            stage_sums[stg]["expenses"] += amt

    net_profit = round(total_income - total_expenses, 2)
    acres = max(0.1, float(farm.size_acres or 1.0))

    cost_per_acre = round(total_expenses / acres, 2)
    revenue_per_acre = round(total_income / acres, 2)
    profit_per_acre = round(net_profit / acres, 2)
    roi_percent = round((net_profit / total_expenses * 100.0), 1) if total_expenses > 0 else 0.0

    # Build Category Breakdown List
    category_breakdown = []
    base_total = total_expenses if total_expenses > 0 else 1.0
    for cat_name, c_amount in category_amounts.items():
        c_type = category_types.get(cat_name, "expense")
        pct = round((c_amount / base_total) * 100.0, 1) if c_type == "expense" else 0.0
        category_breakdown.append(
            CategoryFinancialBreakdown(
                category=cat_name,
                type=c_type,
                amount=round(c_amount, 2),
                percentage=pct
            )
        )

    # Build Stage Breakdown List
    stage_breakdown = []
    for stg_name, s_info in stage_sums.items():
        stage_breakdown.append(
            StageFinancialBreakdown(
                stage=stg_name,
                expenses=round(s_info["expenses"], 2),
                income=round(s_info["income"], 2),
                net=round(s_info["income"] - s_info["expenses"], 2)
            )
        )

    return LedgerSummaryOut(
        farm_id=farm.id,
        farm_name=farm.name,
        crop=farm.crop or "Crop",
        size_acres=acres,
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        net_profit=net_profit,
        cost_per_acre=cost_per_acre,
        revenue_per_acre=revenue_per_acre,
        profit_per_acre=profit_per_acre,
        roi_percent=roi_percent,
        transaction_count=len(transactions),
        actual_count=actual_count,
        estimated_count=estimated_count,
        projected_count=projected_count,
        category_breakdown=category_breakdown,
        stage_breakdown=stage_breakdown,
        recent_transactions=transactions[:8]
    )


@router.post("/sync")
def sync_offline_transactions(
    sync_req: LedgerSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Batch endpoint for synchronizing transactions captured while offline.
    Uses client_sync_id for complete deduplication and idempotency.
    """
    synced_count = 0
    duplicate_count = 0

    for item in sync_req.transactions:
        farm = db.query(Farm).filter(Farm.id == item.farm_id, Farm.user_id == current_user.id).first()
        if not farm:
            continue

        # Check deduplication
        existing = db.query(Expense).filter(
            Expense.farm_id == farm.id,
            Expense.client_sync_id == item.client_sync_id
        ).first()

        if existing:
            duplicate_count += 1
            continue

        new_tx = Expense(
            farm_id=farm.id,
            type=item.type.lower() if item.type else "expense",
            category=item.category,
            crop=item.crop or farm.crop,
            item_name=item.item_name,
            cost=float(item.cost),
            date=item.date,
            quantity=item.quantity,
            unit=item.unit,
            stage=item.stage or farm.current_stage_override or "Vegetative Growth",
            provenance="ACTUAL",
            notes=item.notes,
            client_sync_id=item.client_sync_id,
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_tx)
        synced_count += 1

    db.commit()
    return {
        "status": "success",
        "synced_count": synced_count,
        "duplicate_count": duplicate_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
