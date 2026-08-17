# Habib Networks (SITI Broadband) — Customer App

## Original Problem Statement
Build a mobile app for a broadband business named Habib Networks (SITI Broadband) with features to manage plan, see promotional offers, change plan, recharge, submit complaint, call customer care, and view the active plan.

## User Choices
- Auth: Mobile number + OTP (mocked, OTP is always `1234`)
- Recharge: UPI mock payment flow (GPay/PhonePe/Paytm/Other UPI)
- Customer care: device dialer + in-app VoIP mock screen
- Seed: full demo (1 active plan, 6 plans, 4 offers, 2 sample complaints)
- Branding: Bold red (#D90429) + dark navy (#0A1128), SITI-inspired

## Architecture
- **Frontend**: Expo Router (file-based), bottom tabs (Home, Plans, Support, Account), custom fonts (Space Grotesk for numbers, Plus Jakarta Sans for text), react-native-svg data ring, expo-image, expo-linear-gradient, Toast + Auth context.
- **Backend**: FastAPI + MongoDB (motor). Seeds plans/offers on startup; user + sample complaints auto-created on first OTP verify. Bearer token = phone number.
- **API base**: `EXPO_PUBLIC_BACKEND_URL` + `/api` prefix.

## Personas
- Broadband subscriber checking plan/data, recharging, raising complaints, contacting care.

## Core Requirements (static)
- OTP login, active plan dashboard, browse/change plans, UPI recharge, complaints CRUD, customer care call.

## Implemented (2026-08-17)
- Mocked OTP auth (send-otp / verify-otp with 1234), secure token storage
- Home dashboard: active plan hero (data ring, days remaining), quick actions, promotional offers carousel
- Plans: duration filter chips, plan cards, current-plan highlight, select → recharge
- Recharge: order summary, UPI method selection, processing overlay, success receipt (real UPI intent attempted on native)
- Complaints: Active/Resolved filters, seeded history, FAB → new complaint form
- Account: profile, connection ID copy, billing history, customer care, logout
- Customer Care: dialer call + in-app VoIP mock calling screen
- **Speed Test (2026-08-17)**: one-tap launcher on Home + quick action; animated 270° gauge with ping/download/upload phases, backend `/api/speedtest` computes plan-relative results + rating
- **Referral Rewards (2026-08-17)**: `/referral` screen with unique code, native Share link, reward hero, how-it-works steps, joined/earned stats; entry via Account row + "Refer & Earn" offer; backend `/api/referral`
- Full-stack tested: 20/20 backend, all frontend flows pass

## Backlog (prioritized)
- P1: Speed test tool, referral flow, in-app notifications inbox
- P2: Auto-pay/wallet, plan comparison, downloadable invoices, multi-connection support

## Next Tasks
- Optional cosmetic: migrate `shadow*` → `boxShadow`, move `pointerEvents` into style (RN Web warnings only)
