"""Backend tests for Habib Networks broadband API.
Covers auth, /me, plans, offers, plan change, recharge (mock UPI),
complaints, and customer-care endpoints.
"""
import os
import time
import random
import pytest
import requests

BASE_URL = os.environ.get("EXPO_BACKEND_URL") or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
# Fallback: read from frontend .env if not exported
if not BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().strip('"')
                    break
    except Exception:
        pass
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL not configured"
BASE_URL = BASE_URL.rstrip("/")

# Use a unique phone per test-run so we get a fresh user
TEST_PHONE = f"9{random.randint(100000000, 999999999)}"
STATE = {}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_headers(client):
    # Login flow to obtain bearer token = phone
    r = client.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
    assert r.status_code == 200, r.text
    r = client.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": TEST_PHONE, "otp": "1234"})
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    STATE["token"] = tok
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


# --- Health ---
def test_root(client):
    r = client.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert "Habib" in r.json().get("message", "")


# --- Auth ---
class TestAuth:
    def test_send_otp_valid(self, client):
        r = client.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": TEST_PHONE})
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert "1234" in body.get("hint", "")

    def test_send_otp_invalid_phone(self, client):
        r = client.post(f"{BASE_URL}/api/auth/send-otp", json={"phone": "123"})
        assert r.status_code == 400

    def test_verify_otp_invalid(self, client):
        r = client.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": TEST_PHONE, "otp": "0000"})
        assert r.status_code == 400

    def test_verify_otp_valid_returns_user(self, client):
        r = client.post(f"{BASE_URL}/api/auth/verify-otp", json={"phone": TEST_PHONE, "otp": "1234"})
        assert r.status_code == 200
        body = r.json()
        assert body["token"] == TEST_PHONE
        assert body["user"]["phone"] == TEST_PHONE
        assert body["user"]["connection_id"].startswith("HN")


# --- /me ---
class TestMe:
    def test_me_unauthenticated(self, client):
        r = client.get(f"{BASE_URL}/api/me")
        assert r.status_code == 401

    def test_me_authenticated(self, client, auth_headers):
        r = client.get(f"{BASE_URL}/api/me", headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert body["user"]["phone"] == TEST_PHONE
        assert body["active"] is not None
        assert body["active"]["plan"]["id"] == "p_pop_m"
        assert body["active"]["days_remaining"] >= 0
        assert body["active"]["data_used_gb"] == 148
        assert body["active"]["data_quota_gb"] == 3300


# --- Plans ---
class TestPlans:
    def test_all_plans(self, client):
        r = client.get(f"{BASE_URL}/api/plans")
        assert r.status_code == 200
        plans = r.json()
        assert len(plans) >= 6
        durations = {p["duration_label"] for p in plans}
        assert {"Monthly", "6 Months", "Yearly"}.issubset(durations)

    def test_plans_filter_monthly(self, client):
        r = client.get(f"{BASE_URL}/api/plans", params={"duration": "Monthly"})
        assert r.status_code == 200
        assert all(p["duration_label"] == "Monthly" for p in r.json())

    def test_plans_filter_6m(self, client):
        r = client.get(f"{BASE_URL}/api/plans", params={"duration": "6 Months"})
        assert r.status_code == 200
        assert all(p["duration_label"] == "6 Months" for p in r.json())

    def test_plans_filter_yearly(self, client):
        r = client.get(f"{BASE_URL}/api/plans", params={"duration": "Yearly"})
        assert r.status_code == 200
        assert all(p["duration_label"] == "Yearly" for p in r.json())


# --- Offers ---
def test_offers(client):
    r = client.get(f"{BASE_URL}/api/offers")
    assert r.status_code == 200
    offers = r.json()
    assert len(offers) == 4
    for o in offers:
        assert o["title"] and o["image"].startswith("https://")


# --- Change plan ---
class TestChangePlan:
    def test_change_plan_success(self, client, auth_headers):
        r = client.post(f"{BASE_URL}/api/plans/p_pro_m/change", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["active"]["plan"]["id"] == "p_pro_m"
        # verify via /me
        me = client.get(f"{BASE_URL}/api/me", headers=auth_headers).json()
        assert me["active"]["plan"]["id"] == "p_pro_m"

    def test_change_plan_not_found(self, client, auth_headers):
        r = client.post(f"{BASE_URL}/api/plans/does-not-exist/change", headers=auth_headers)
        assert r.status_code == 404


# --- Recharge ---
class TestRecharge:
    def test_recharge_success(self, client, auth_headers):
        payload = {"plan_id": "p_pro_y", "method": "gpay"}
        r = client.post(f"{BASE_URL}/api/recharge", json=payload, headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert body["txn_id"].startswith("UPI")
        assert body["amount"] == 9999
        assert body["active"]["plan"]["id"] == "p_pro_y"
        STATE["last_txn"] = body["txn_id"]

    def test_recharge_history(self, client, auth_headers):
        r = client.get(f"{BASE_URL}/api/recharges", headers=auth_headers)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        assert items[0]["txn_id"] == STATE["last_txn"]
        assert items[0]["status"] == "success"

    def test_recharge_invalid_plan(self, client, auth_headers):
        r = client.post(f"{BASE_URL}/api/recharge",
                        json={"plan_id": "bogus", "method": "gpay"},
                        headers=auth_headers)
        assert r.status_code == 404


# --- Complaints ---
class TestComplaints:
    def test_get_seeded(self, client, auth_headers):
        r = client.get(f"{BASE_URL}/api/complaints", headers=auth_headers)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 2
        statuses = {c["status"] for c in items}
        assert "resolved" in statuses

    def test_create_complaint(self, client, auth_headers):
        payload = {"subject": "TEST_ slow speed", "category": "Speed Issue",
                   "description": "TEST_ complaint from pytest"}
        r = client.post(f"{BASE_URL}/api/complaints", json=payload, headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert body["ticket_id"].startswith("TKT-")
        assert body["status"] == "open"
        # verify persistence
        r2 = client.get(f"{BASE_URL}/api/complaints", headers=auth_headers)
        ids = [c["id"] for c in r2.json()]
        assert body["id"] in ids


# --- Customer care ---
def test_customer_care(client):
    r = requests.get(f"{BASE_URL}/api/customer-care")
    assert r.status_code == 200
    body = r.json()
    assert body["phone"].startswith("+91")
    assert "@" in body["email"]
