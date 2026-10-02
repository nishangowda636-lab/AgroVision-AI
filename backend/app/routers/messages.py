from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.session import get_db
from app.models.models import Message, User, Notification
from app.schemas.schemas import MessageCreate, MessageOut, ConversationSummary
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/messages", tags=["Farmer-Officer Messaging"])

@router.get("/conversations", response_model=List[ConversationSummary])
def get_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns list of all active conversation threads for the current user with the latest message and unread count.
    """
    messages = db.query(Message).filter(
        (Message.sender_id == current_user.id) | (Message.receiver_id == current_user.id)
    ).order_by(Message.created_at.desc()).all()

    threads = {}
    for msg in messages:
        other_user_id = msg.receiver_id if msg.sender_id == current_user.id else msg.sender_id
        if other_user_id not in threads:
            other_user = db.query(User).filter(User.id == other_user_id).first()
            if not other_user:
                continue

            unread = db.query(Message).filter(
                Message.sender_id == other_user_id,
                Message.receiver_id == current_user.id,
                Message.is_read == False
            ).count()

            threads[other_user_id] = {
                "user_id": other_user_id,
                "user_name": other_user.full_name,
                "user_role": other_user.role,
                "last_message": msg.content,
                "last_message_time": msg.created_at,
                "unread_count": unread,
            }

    # If user has no conversations yet, create initial welcome chat with AgroVision Support
    if not threads:
        officer = db.query(User).filter(User.id != current_user.id).first()
        
        if officer:
            welcome_msg = Message(
                sender_id=officer.id,
                receiver_id=current_user.id,
                content="Hello! Welcome to AgroVision AI Direct Messaging. You can communicate with agricultural extension officers and support specialists securely here.",
                is_read=False
            )
            db.add(welcome_msg)
            db.commit()
            db.refresh(welcome_msg)
            threads[officer.id] = {
                "user_id": officer.id,
                "user_name": officer.full_name,
                "user_role": officer.role,
                "last_message": welcome_msg.content,
                "last_message_time": welcome_msg.created_at,
                "unread_count": 1,
            }

    return list(threads.values())

@router.get("/{other_user_id}", response_model=List[MessageOut])
def get_thread_messages(other_user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns full message history between current_user and other_user_id.
    """
    messages = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == other_user_id)) |
        ((Message.sender_id == other_user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.created_at.asc()).all()

    # Mark unread incoming messages as read
    for msg in messages:
        if msg.receiver_id == current_user.id and not msg.is_read:
            msg.is_read = True
    db.commit()

    user_cache = {}
    res = []

    for msg in messages:
        m_dict = {c.name: getattr(msg, c.name) for c in msg.__table__.columns}
        
        if msg.sender_id not in user_cache:
            u = db.query(User).filter(User.id == msg.sender_id).first()
            user_cache[msg.sender_id] = u.full_name if u else "User"
        if msg.receiver_id not in user_cache:
            u = db.query(User).filter(User.id == msg.receiver_id).first()
            user_cache[msg.receiver_id] = u.full_name if u else "User"

        m_dict["sender_name"] = user_cache[msg.sender_id]
        m_dict["receiver_name"] = user_cache[msg.receiver_id]

        res.append(m_dict)

    return res

@router.post("", response_model=MessageOut)
def send_message(msg_in: MessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Sends a new message to a recipient referencing an optional farm.
    """
    recipient = db.query(User).filter(User.id == msg_in.receiver_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")

    new_msg = Message(
        sender_id=current_user.id,
        receiver_id=msg_in.receiver_id,
        farm_id=msg_in.farm_id,
        content=msg_in.content,
        is_read=False
    )
    db.add(new_msg)

    # Trigger notification to recipient
    notif = Notification(
        user_id=msg_in.receiver_id,
        title=f"New message from {current_user.full_name}",
        message=f"{msg_in.content[:80]}...",
        type="message",
        action_link="/messages"
    )
    db.add(notif)

    db.commit()
    db.refresh(new_msg)

    res = {c.name: getattr(new_msg, c.name) for c in new_msg.__table__.columns}
    res["sender_name"] = current_user.full_name
    res["receiver_name"] = recipient.full_name

    return res
