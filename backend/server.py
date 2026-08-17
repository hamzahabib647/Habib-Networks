from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated
from bson import ObjectId
import uuid
import random
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if v is not None else v)]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


CUSTOMER_CARE_NUMBER = "+911800123456"
REFERRAL_REWARD_TEXT = "You & your friend each get 1 month FREE when they activate a plan."


def gen_referral_code(phone: str) -> str:
    return "HABIB" + phone[-4:] + str(random.randint(10, 99))


async def get_or_create_referral(user) -> str:
    code = user.get("referral_code")
    if not code:
        code = gen_referral_code(user["phone"])
        await db.users.update_one({"phone": user["phone"]}, {"$set": {"referral_code": code}})
    return code


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    otp: str


class Plan(BaseModel):
    id: str
    name: str
    speed_mbps: int
    price: int
    duration_label: str          # "Monthly" | "6 Months" | "Yearly"
    duration_days: int
    data_quota_gb: int           # 0 => unlimited
    features: List[str]
    tag: Optional[str] = None    # "Popular" | "Best Value" ...


class Offer(BaseModel):
    id: str
    title: str
    subtitle: str
    cta: str
    image: str
    badge: Optional[str] = None
    accent: Optional[str] = None


class ComplaintCreate(BaseModel):
    subject: str
    category: str
    description: str


class Complaint(BaseModel):
    id: str
    ticket_id: str
    subject: str
    category: str
    description: str
    status: str                  # "open" | "in_progress" | "resolved"
    created_at: str
    updated_at: str


class RechargeCreate(BaseModel):
    plan_id: str
    method: str                  # "gpay" | "phonepe" | "paytm" | "upi_id"
    upi_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
PLANS_SEED = [
    {"id": "p_basic_m", "name": "Starter Fiber", "speed_mbps": 50, "price": 499,
     "duration_label": "Monthly", "duration_days": 30, "data_quota_gb": 3300,
     "features": ["Unlimited Data", "Free Installation", "24x7 Support"], "tag": None},
    {"id": "p_pop_m", "name": "Turbo 100", "speed_mbps": 100, "price": 699,
     "duration_label": "Monthly", "duration_days": 30, "data_quota_gb": 3300,
     "features": ["Unlimited Data", "Free Wi-Fi Router", "OTT: 5 Apps", "24x7 Support"], "tag": "Popular"},
    {"id": "p_pro_m", "name": "Ultra 200", "speed_mbps": 200, "price": 999,
     "duration_label": "Monthly", "duration_days": 30, "data_quota_gb": 3300,
     "features": ["Unlimited Data", "Free Wi-Fi Router", "OTT: 12 Apps", "Priority Support"], "tag": None},
    {"id": "p_pop_6", "name": "Turbo 100 Half-Yearly", "speed_mbps": 100, "price": 3599,
     "duration_label": "6 Months", "duration_days": 180, "data_quota_gb": 3300,
     "features": ["Unlimited Data", "Free Wi-Fi Router", "OTT: 5 Apps", "1 Month Free"], "tag": "Best Value"},
    {"id": "p_pro_6", "name": "Ultra 300 Half-Yearly", "speed_mbps": 300, "price": 5399,
     "duration_label": "6 Months", "duration_days": 180, "data_quota_gb": 3300,
     "features": ["Unlimited Data", "Free Wi-Fi Router", "OTT: 15 Apps", "Priority Support"], "tag": None},
    {"id": "p_pro_y", "name": "Ultra 300 Annual", "speed_mbps": 300, "price": 9999,
     "duration_label": "Yearly", "duration_days": 365, "data_quota_gb": 3300,
     "features": ["Unlimited Data", "Free Wi-Fi Router", "OTT: 20 Apps", "2 Months Free", "Priority Support"], "tag": "Save 20%"},
]

OFFERS_SEED = [
    {"id": "o1", "title": "Gamer's Delight", "subtitle": "Get 300 Mbps + free gaming pass for 3 months",
     "cta": "Grab Offer", "badge": "LIMITED",
     "image": "https://images.unsplash.com/photo-1564049489314-60d154ff107d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
     "accent": "#D90429"},
    {"id": "o2", "title": "Refer & Earn", "subtitle": "Invite a friend and get 1 month absolutely free",
     "cta": "Refer Now", "badge": "REWARD",
     "image": "https://images.unsplash.com/photo-1648737966100-18f790c93a86?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
     "accent": "#0A1128"},
    {"id": "o3", "title": "Fiber Upgrade Week", "subtitle": "Upgrade to 300 Mbps at no extra cost this week",
     "cta": "Upgrade", "badge": "HOT",
     "image": "https://images.unsplash.com/photo-1597733336794-12d05021d510?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
     "accent": "#EF233C"},
    {"id": "o4", "title": "Annual Saver", "subtitle": "Pay yearly and get 2 months free + free router",
     "cta": "Switch to Yearly", "badge": "SAVE 20%",
     "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
     "accent": "#0A1128"},
]


async def ensure_seed():
    if await db.plans.count_documents({}) == 0:
        await db.plans.insert_many([dict(p) for p in PLANS_SEED])
        logger.info("Seeded plans")
    if await db.offers.count_documents({}) == 0:
        await db.offers.insert_many([dict(o) for o in OFFERS_SEED])
        logger.info("Seeded offers")


async def ensure_user(phone: str):
    user = await db.users.find_one({"phone": phone})
    if user:
        return user
    # New user -> assign the popular monthly active plan + sample data
    start = now_utc() - timedelta(days=12)
    end = start + timedelta(days=30)
    user_doc = {
        "id": str(uuid.uuid4()),
        "phone": phone,
        "name": "Habib Customer",
        "connection_id": "HN" + phone[-6:].rjust(6, "0"),
        "active_plan_id": "p_pop_m",
        "plan_start": iso(start),
        "plan_end": iso(end),
        "data_used_gb": 148,
        "data_quota_gb": 3300,
        "wallet_balance": 0,
        "referral_code": gen_referral_code(phone),
        "created_at": iso(now_utc()),
    }
    await db.users.insert_one(user_doc)
    # Sample complaint history
    samples = [
        {"id": str(uuid.uuid4()), "phone": phone, "ticket_id": "TKT-100234",
         "subject": "Slow speed in the evening", "category": "Speed Issue",
         "description": "Speed drops below 20 Mbps after 8 PM daily.",
         "status": "resolved",
         "created_at": iso(now_utc() - timedelta(days=20)),
         "updated_at": iso(now_utc() - timedelta(days=18))},
        {"id": str(uuid.uuid4()), "phone": phone, "ticket_id": "TKT-100489",
         "subject": "Router blinking red", "category": "Hardware",
         "description": "The Wi-Fi router LED keeps blinking red intermittently.",
         "status": "in_progress",
         "created_at": iso(now_utc() - timedelta(days=3)),
         "updated_at": iso(now_utc() - timedelta(days=1))},
    ]
    await db.complaints.insert_many([dict(s) for s in samples])
    return await db.users.find_one({"phone": phone})


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    phone = authorization.split(" ", 1)[1].strip()
    user = await db.users.find_one({"phone": phone})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    return user


def user_public(user) -> dict:
    return {
        "id": user["id"],
        "phone": user["phone"],
        "name": user["name"],
        "connection_id": user["connection_id"],
        "active_plan_id": user.get("active_plan_id"),
        "plan_start": user.get("plan_start"),
        "plan_end": user.get("plan_end"),
        "data_used_gb": user.get("data_used_gb", 0),
        "data_quota_gb": user.get("data_quota_gb", 0),
    }


async def build_active_plan(user) -> Optional[dict]:
    pid = user.get("active_plan_id")
    if not pid:
        return None
    plan = await db.plans.find_one({"id": pid}, {"_id": 0})
    if not plan:
        return None
    try:
        end = datetime.fromisoformat(user["plan_end"])
    except Exception:
        end = now_utc()
    days_remaining = max(0, (end - now_utc()).days)
    return {
        "plan": plan,
        "days_remaining": days_remaining,
        "plan_start": user.get("plan_start"),
        "plan_end": user.get("plan_end"),
        "data_used_gb": user.get("data_used_gb", 0),
        "data_quota_gb": user.get("data_quota_gb", 0),
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Habib Networks API"}


@api_router.post("/auth/send-otp")
async def send_otp(req: OTPRequest):
    if len(req.phone) < 10:
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit number")
    # Mocked OTP delivery
    return {"success": True, "message": "OTP sent successfully", "hint": "Use 1234 to continue"}


@api_router.post("/auth/verify-otp")
async def verify_otp(req: OTPVerify):
    if req.otp != "1234":
        raise HTTPException(status_code=400, detail="Invalid OTP. Try 1234")
    user = await ensure_user(req.phone)
    return {"success": True, "token": req.phone, "user": user_public(user)}


@api_router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"user": user_public(user), "active": await build_active_plan(user)}


@api_router.put("/me")
async def update_me(payload: dict, user=Depends(get_current_user)):
    updates = {}
    if "name" in payload and payload["name"]:
        updates["name"] = payload["name"]
    if updates:
        await db.users.update_one({"phone": user["phone"]}, {"$set": updates})
    user = await db.users.find_one({"phone": user["phone"]})
    return {"user": user_public(user)}


@api_router.get("/plans", response_model=List[Plan])
async def get_plans(duration: Optional[str] = None):
    q = {}
    if duration and duration != "All":
        q["duration_label"] = duration
    plans = await db.plans.find(q, {"_id": 0}).to_list(100)
    order = {"Monthly": 0, "6 Months": 1, "Yearly": 2}
    plans.sort(key=lambda p: (order.get(p["duration_label"], 9), p["price"]))
    return plans


@api_router.get("/offers", response_model=List[Offer])
async def get_offers():
    return await db.offers.find({}, {"_id": 0}).to_list(100)


@api_router.post("/plans/{plan_id}/change")
async def change_plan(plan_id: str, user=Depends(get_current_user)):
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    start = now_utc()
    end = start + timedelta(days=plan["duration_days"])
    await db.users.update_one({"phone": user["phone"]}, {"$set": {
        "active_plan_id": plan_id,
        "plan_start": iso(start),
        "plan_end": iso(end),
        "data_used_gb": 0,
        "data_quota_gb": plan["data_quota_gb"],
    }})
    user = await db.users.find_one({"phone": user["phone"]})
    return {"success": True, "active": await build_active_plan(user)}


@api_router.post("/recharge")
async def recharge(req: RechargeCreate, user=Depends(get_current_user)):
    plan = await db.plans.find_one({"id": req.plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    txn_id = "UPI" + datetime.now().strftime("%y%m%d") + uuid.uuid4().hex[:6].upper()
    start = now_utc()
    end = start + timedelta(days=plan["duration_days"])
    await db.users.update_one({"phone": user["phone"]}, {"$set": {
        "active_plan_id": req.plan_id,
        "plan_start": iso(start),
        "plan_end": iso(end),
        "data_used_gb": 0,
        "data_quota_gb": plan["data_quota_gb"],
    }})
    record = {
        "id": str(uuid.uuid4()),
        "phone": user["phone"],
        "plan_id": req.plan_id,
        "plan_name": plan["name"],
        "amount": plan["price"],
        "method": req.method,
        "txn_id": txn_id,
        "status": "success",
        "created_at": iso(now_utc()),
    }
    await db.recharges.insert_one(dict(record))
    user = await db.users.find_one({"phone": user["phone"]})
    return {"success": True, "txn_id": txn_id, "amount": plan["price"],
            "plan_name": plan["name"], "active": await build_active_plan(user)}


@api_router.get("/recharges")
async def get_recharges(user=Depends(get_current_user)):
    items = await db.recharges.find({"phone": user["phone"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items


@api_router.get("/complaints", response_model=List[Complaint])
async def get_complaints(user=Depends(get_current_user)):
    items = await db.complaints.find({"phone": user["phone"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api_router.post("/complaints", response_model=Complaint)
async def create_complaint(req: ComplaintCreate, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "phone": user["phone"],
        "ticket_id": "TKT-" + str(100000 + int(uuid.uuid4().int % 900000)),
        "subject": req.subject,
        "category": req.category,
        "description": req.description,
        "status": "open",
        "created_at": iso(now_utc()),
        "updated_at": iso(now_utc()),
    }
    await db.complaints.insert_one(dict(doc))
    return doc


@api_router.post("/speedtest")
async def speedtest(user=Depends(get_current_user)):
    active = await build_active_plan(user)
    plan_speed = active["plan"]["speed_mbps"] if active else 100
    # Realistic result: download close to plan speed, upload ~40-60% of download.
    download = round(plan_speed * random.uniform(0.82, 0.99), 1)
    upload = round(download * random.uniform(0.4, 0.6), 1)
    ping = random.randint(4, 22)
    jitter = random.randint(1, 6)
    ratio = download / plan_speed if plan_speed else 1
    if ratio >= 0.9:
        rating = "Excellent"
    elif ratio >= 0.75:
        rating = "Good"
    else:
        rating = "Fair"
    result = {
        "id": str(uuid.uuid4()),
        "phone": user["phone"],
        "download_mbps": download,
        "upload_mbps": upload,
        "ping_ms": ping,
        "jitter_ms": jitter,
        "plan_speed_mbps": plan_speed,
        "rating": rating,
        "server": "Habib Networks · Mumbai",
        "created_at": iso(now_utc()),
    }
    await db.speedtests.insert_one(dict(result))
    result.pop("phone", None)
    return result


@api_router.get("/speedtest/last")
async def speedtest_last(user=Depends(get_current_user)):
    doc = await db.speedtests.find_one({"phone": user["phone"]}, {"_id": 0, "phone": 0}, sort=[("created_at", -1)])
    return doc or {}


@api_router.get("/referral")
async def referral(user=Depends(get_current_user)):
    code = await get_or_create_referral(user)
    invited = await db.recharges.count_documents({"referred_by": code})  # placeholder tracking
    joined = await db.users.count_documents({"referred_by": code})
    rewards_earned = joined  # 1 free month per joined friend
    return {
        "code": code,
        "share_url": f"https://habibnetworks.in/join?ref={code}",
        "reward_text": REFERRAL_REWARD_TEXT,
        "reward_value": "1 Month Free",
        "invited_count": invited,
        "joined_count": joined,
        "rewards_earned": rewards_earned,
        "steps": [
            {"icon": "share-2", "title": "Share your link", "desc": "Send your invite to friends & family"},
            {"icon": "user-plus", "title": "Friend joins", "desc": "They sign up and activate any plan"},
            {"icon": "gift", "title": "Both get rewarded", "desc": "You & your friend each get 1 month free"},
        ],
    }


@api_router.get("/customer-care")
async def customer_care():
    return {
        "phone": CUSTOMER_CARE_NUMBER,
        "display": "1800-123-456",
        "hours": "24x7 Available",
        "email": "care@habibnetworks.in",
        "whatsapp": CUSTOMER_CARE_NUMBER,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await ensure_seed()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
