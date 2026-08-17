"""Admin panel backend tests for Habib Networks.
Covers admin auth (PIN login/change), stats, plans CRUD (incl active toggle),
offers CRUD, customers list/create/detail/assign-plan, complaints filter/status.
"""
import os
import random
import pytest
import requests

BASE_URL = os.environ.get("EXPO_BACKEND_URL") or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"')
                break
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL not configured"
BASE_URL = BASE_URL.rstrip("/")

ADMIN_PIN = "246810"
STATE = {}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_headers(client):
    r = client.post(f"{BASE_URL}/api/admin/login", json={"pin": ADMIN_PIN})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "access_token" in body and body["token_type"] == "bearer"
    STATE["token"] = body["access_token"]
    return {"Authorization": f"Bearer {body['access_token']}", "Content-Type": "application/json"}


# --- Admin auth ---
class TestAdminAuth:
    def test_login_wrong_pin(self, client):
        r = client.post(f"{BASE_URL}/api/admin/login", json={"pin": "000000"})
        assert r.status_code == 401

    def test_login_correct_pin(self, client):
        r = client.post(f"{BASE_URL}/api/admin/login", json={"pin": ADMIN_PIN})
        assert r.status_code == 200
        assert r.json()["access_token"]

    def test_admin_requires_bearer(self, client):
        for path in ["/api/admin/stats", "/api/admin/plans", "/api/admin/offers",
                     "/api/admin/customers", "/api/admin/complaints"]:
            r = client.get(f"{BASE_URL}{path}")
            assert r.status_code == 401, f"{path} did not 401 without token"

    def test_admin_rejects_bad_bearer(self, client):
        r = client.get(f"{BASE_URL}/api/admin/stats",
                       headers={"Authorization": "Bearer not-a-real-jwt"})
        assert r.status_code == 401


# --- Stats ---
class TestAdminStats:
    def test_stats_fields(self, client, admin_headers):
        r = client.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        body = r.json()
        for k in ["total_customers", "active_plans", "open_complaints",
                  "total_revenue", "total_plans", "total_offers"]:
            assert k in body, f"missing {k}"
            assert isinstance(body[k], (int, float))
        assert body["total_plans"] >= 6
        assert body["total_offers"] >= 4


# --- Plans CRUD ---
class TestAdminPlans:
    def test_list_includes_inactive_field(self, client, admin_headers):
        r = client.get(f"{BASE_URL}/api/admin/plans", headers=admin_headers)
        assert r.status_code == 200
        plans = r.json()
        assert len(plans) >= 6
        # all seeded plans should have active=True after backfill
        assert all("active" in p for p in plans)
        assert any(p["active"] is True for p in plans)

    def test_create_update_toggle_delete(self, client, admin_headers):
        payload = {
            "name": "TEST_Admin_Plan",
            "speed_mbps": 250,
            "price": 1234,
            "duration_label": "Monthly",
            "data_quota_gb": 3300,
            "features": ["TEST feat"],
            "tag": "TEST",
            "active": True,
        }
        r = client.post(f"{BASE_URL}/api/admin/plans", json=payload, headers=admin_headers)
        assert r.status_code == 200
        created = r.json()
        assert created["id"].startswith("p_")
        assert created["duration_days"] == 30
        pid = created["id"]
        STATE["created_plan"] = pid

        # verify in list
        r = client.get(f"{BASE_URL}/api/admin/plans", headers=admin_headers)
        assert any(p["id"] == pid for p in r.json())

        # verify visible on public /api/plans while active
        r = client.get(f"{BASE_URL}/api/plans")
        assert any(p["id"] == pid for p in r.json()), "active plan missing from public list"

        # update price + toggle inactive
        r = client.put(f"{BASE_URL}/api/admin/plans/{pid}",
                       json={"price": 1555, "active": False}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["price"] == 1555
        assert r.json()["active"] is False

        # inactive plan hidden from public /api/plans
        r = client.get(f"{BASE_URL}/api/plans")
        assert not any(p["id"] == pid for p in r.json()), "inactive plan leaked to public"

        # but still visible in admin list
        r = client.get(f"{BASE_URL}/api/admin/plans", headers=admin_headers)
        assert any(p["id"] == pid for p in r.json())

        # delete
        r = client.delete(f"{BASE_URL}/api/admin/plans/{pid}", headers=admin_headers)
        assert r.status_code == 200
        r = client.get(f"{BASE_URL}/api/admin/plans", headers=admin_headers)
        assert not any(p["id"] == pid for p in r.json())

    def test_update_missing_plan(self, client, admin_headers):
        r = client.put(f"{BASE_URL}/api/admin/plans/nope", json={"price": 1}, headers=admin_headers)
        assert r.status_code == 404


# --- Offers CRUD ---
class TestAdminOffers:
    def test_offers_crud(self, client, admin_headers):
        r = client.get(f"{BASE_URL}/api/admin/offers", headers=admin_headers)
        assert r.status_code == 200 and len(r.json()) >= 4

        payload = {
            "title": "TEST_Offer",
            "subtitle": "Test subtitle",
            "cta": "TEST CTA",
            "image": "https://example.com/x.jpg",
            "badge": "TEST",
            "accent": "#123456",
        }
        r = client.post(f"{BASE_URL}/api/admin/offers", json=payload, headers=admin_headers)
        assert r.status_code == 200
        oid = r.json()["id"]
        assert oid.startswith("o_")

        r = client.put(f"{BASE_URL}/api/admin/offers/{oid}",
                       json={"title": "TEST_Offer_Updated"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Offer_Updated"

        r = client.delete(f"{BASE_URL}/api/admin/offers/{oid}", headers=admin_headers)
        assert r.status_code == 200
        r = client.get(f"{BASE_URL}/api/admin/offers", headers=admin_headers)
        assert not any(o["id"] == oid for o in r.json())


# --- Customers ---
class TestAdminCustomers:
    def test_customers_list(self, client, admin_headers):
        r = client.get(f"{BASE_URL}/api/admin/customers", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_customer_and_duplicate_and_detail_and_assign(self, client, admin_headers):
        phone = f"9{random.randint(100000000, 999999999)}"
        payload = {"name": "TEST_Cust", "phone": phone,
                   "email": "test@example.com", "plan_id": None}
        r = client.post(f"{BASE_URL}/api/admin/customers", json=payload, headers=admin_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["phone"] == phone
        assert body["connection_id"].startswith("HN")
        assert body["is_active"] is False

        # duplicate -> 409
        r = client.post(f"{BASE_URL}/api/admin/customers", json=payload, headers=admin_headers)
        assert r.status_code == 409

        # detail with empty recharges/complaints
        r = client.get(f"{BASE_URL}/api/admin/customers/{phone}", headers=admin_headers)
        assert r.status_code == 200
        det = r.json()
        assert det["recharges"] == []
        assert det["complaints"] == []

        # assign plan (offline recharge)
        r = client.post(f"{BASE_URL}/api/admin/customers/{phone}/assign-plan",
                        json={"plan_id": "p_pop_m"}, headers=admin_headers)
        assert r.status_code == 200
        summary = r.json()
        assert summary["active_plan_id"] == "p_pop_m"
        assert summary["is_active"] is True

        # verify recharge history contains admin_offline entry
        r = client.get(f"{BASE_URL}/api/admin/customers/{phone}", headers=admin_headers)
        det = r.json()
        assert len(det["recharges"]) == 1
        assert det["recharges"][0]["method"] == "admin_offline"
        assert det["recharges"][0]["txn_id"].startswith("OFF")

    def test_customer_not_found(self, client, admin_headers):
        r = client.get(f"{BASE_URL}/api/admin/customers/0000000000", headers=admin_headers)
        assert r.status_code == 404

    def test_assign_plan_missing_plan(self, client, admin_headers):
        phone = f"9{random.randint(100000000, 999999999)}"
        client.post(f"{BASE_URL}/api/admin/customers",
                    json={"name": "TEST", "phone": phone}, headers=admin_headers)
        r = client.post(f"{BASE_URL}/api/admin/customers/{phone}/assign-plan",
                        json={"plan_id": "no_such"}, headers=admin_headers)
        assert r.status_code == 404


# --- Complaints admin ---
class TestAdminComplaints:
    def _seed_complaint(self, client):
        """Create a customer + complaint via public API so we have data."""
        phone = f"9{random.randint(100000000, 999999999)}"
        client.post(f"{BASE_URL}/api/auth/verify-otp",
                    json={"phone": phone, "otp": "1234"})
        headers = {"Authorization": f"Bearer {phone}", "Content-Type": "application/json"}
        r = client.post(f"{BASE_URL}/api/complaints",
                        json={"subject": "TEST_admin_complaint", "category": "Speed",
                              "description": "TEST"}, headers=headers)
        return r.json()["id"]

    def test_complaint_list_filters(self, client, admin_headers):
        cid = self._seed_complaint(client)
        for status in ["all", "active", "resolved"]:
            r = client.get(f"{BASE_URL}/api/admin/complaints",
                           params={"status": status}, headers=admin_headers)
            assert r.status_code == 200
            items = r.json()
            if status == "resolved":
                assert all(c["status"] == "resolved" for c in items)
            elif status == "active":
                assert all(c["status"] != "resolved" for c in items)
        STATE["complaint_id"] = cid

    def test_complaint_status_transitions(self, client, admin_headers):
        cid = STATE["complaint_id"]
        for st in ["in_progress", "resolved", "open"]:
            r = client.put(f"{BASE_URL}/api/admin/complaints/{cid}",
                           json={"status": st}, headers=admin_headers)
            assert r.status_code == 200
            assert r.json()["status"] == st

    def test_complaint_bad_status(self, client, admin_headers):
        cid = STATE["complaint_id"]
        r = client.put(f"{BASE_URL}/api/admin/complaints/{cid}",
                       json={"status": "bogus"}, headers=admin_headers)
        assert r.status_code == 400

    def test_complaint_not_found(self, client, admin_headers):
        r = client.put(f"{BASE_URL}/api/admin/complaints/no-such",
                       json={"status": "open"}, headers=admin_headers)
        assert r.status_code == 404


# --- Change PIN (last so we don't break other tests; revert at end) ---
class TestAdminChangePin:
    def test_change_pin_wrong_current(self, client, admin_headers):
        r = client.post(f"{BASE_URL}/api/admin/change-pin",
                        json={"current_pin": "999999", "new_pin": "111111"},
                        headers=admin_headers)
        assert r.status_code == 400

    def test_change_pin_success_then_revert(self, client, admin_headers):
        # change 246810 -> 135790
        r = client.post(f"{BASE_URL}/api/admin/change-pin",
                        json={"current_pin": ADMIN_PIN, "new_pin": "135790"},
                        headers=admin_headers)
        assert r.status_code == 200
        # old PIN no longer works
        r = client.post(f"{BASE_URL}/api/admin/login", json={"pin": ADMIN_PIN})
        assert r.status_code == 401
        # new PIN works
        r = client.post(f"{BASE_URL}/api/admin/login", json={"pin": "135790"})
        assert r.status_code == 200
        new_tok = r.json()["access_token"]
        # revert back to default
        r = client.post(f"{BASE_URL}/api/admin/change-pin",
                        json={"current_pin": "135790", "new_pin": ADMIN_PIN},
                        headers={"Authorization": f"Bearer {new_tok}",
                                 "Content-Type": "application/json"})
        assert r.status_code == 200
        # default PIN works again
        r = client.post(f"{BASE_URL}/api/admin/login", json={"pin": ADMIN_PIN})
        assert r.status_code == 200
