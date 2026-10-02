from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.models import Notification, User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

INITIAL_ALERTS = [
    {"title": "Weather Warning", "message": "Rain is expected tomorrow evening (20% to 40% probability). Delay scheduled irrigation to avoid waterlogging.", "type": "weather"},
    {"title": "Optimal Fertilizer Timing", "message": "Your crop has entered the Vegetative phase. Apply split dose of Bio-fertilizer.", "type": "fertilizer"},
    {"title": "Market Price Spike", "message": "APMC Mandi prices trending upward today (+8%). Excellent selling window.", "type": "market"},
    {"title": "IoT Sensor Alert", "message": "Soil moisture dropped below 45%. Morning drip irrigation recommended.", "type": "sensor"}
]

@router.get("")
def get_user_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

    if not user_notifs:
        # Generate initial notifications for the user
        for alert in INITIAL_ALERTS:
            n = Notification(
                user_id=current_user.id,
                title=alert["title"],
                message=alert["message"],
                type=alert["type"],
                is_read=False
            )
            db.add(n)
        db.commit()
        user_notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

    return user_notifs

@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}
