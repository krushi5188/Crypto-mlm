# Comprehensive System Audit Report

## 1. Executive Summary
**System Type:** Crypto-based Multi-Level Marketing (MLM) Web Application.
**Tech Stack:** React (Frontend), Node.js/Express (Backend), PostgreSQL (Database).
**Status:** Functional codebase with advanced "simulation" features. The "AI" features are algorithm-based, not machine-learning based. The "Blockchain" integration is for tracking deposits/withdrawals (TRC20 USDT) but does not run smart contracts for the MLM logic itself—that lives centrally in the PostgreSQL database.

---

## 2. Core MLM Capabilities (The "Engine")

### A. Commission Distribution
*   **What it does:** Automatically calculates and pays commissions when a new user joins or purchases.
*   **How it works:**
    *   **Logic:** `CommissionService.js` implements a "Dynamic Distribution" model.
    *   **Structure:** It's not a rigid pyramid. It pays a fixed "Direct Bonus" to the recruiter, then splits a "Pool" among the upline using a weighted arithmetic sequence.
    *   **Profit Capture:** If the upline chain is short (e.g., only 2 levels deep), the remaining allocated commission funds are sent to a `developer_pool_balance`, ensuring the system administrator maximizes revenue.

### B. Network Management
*   **What it does:** Tracks who recruited whom (Genealogy).
*   **How it works:**
    *   **Data:** Uses a standard "Adjacency List" (`referred_by_id` in `users` table) + a "Closure Table" (`referrals` table) for fast querying of deep downlines (Levels 1-5).
    *   **Visualization:** The Frontend (`NetworkPage.jsx`) renders this as a simple list/tree view, showing user details and earnings.

### C. Money Flow (Deposits & Withdrawals)
*   **What it does:** Handles incoming Crypto (USDT) and outgoing payments.
*   **How it works:**
    *   **Deposits:** Users send crypto to a wallet. The Admin manually approves these or a script (not fully automated in this codebase) tracks the hash. `Deposit.confirm()` credits the internal SQL ledger `balance`.
    *   **Withdrawals:** Users request a cashout. The system checks `balance`, deducts it immediately, and creates a `pending` withdrawal request for Admin approval.
    *   **Internal Ledger:** All money is virtual numbers in a PostgreSQL database until withdrawn.

---

## 3. Advanced "Brain" Features

### A. Fraud Detection ("Security")
*   **What it does:** Auto-bans or flags suspicious users.
*   **How it works:** `FraudDetection.js` calculates a **Risk Score (0-100)** based on:
    *   **Multi-Accounting:** >3 accounts from same IP (Score +30).
    *   **Device Fingerprinting:** Hashing the User-Agent string to find users spoofing IPs (Score +25).
    *   **Behavior:** Rapid signups or failed logins.
    *   **Action:** If Score > 75, the user is auto-flagged.

### B. Predictive Analytics ("AI")
*   **What it does:** Forecasts future earnings and churn risk for users.
*   **How it works:** *Marketing Exaggeration Alert.* It is not "AI".
    *   **Churn Prediction:** Simple `if/else` logic (e.g., "If inactive > 30 days, Risk = High").
    *   **Earnings Forecast:** Linear math (`Average Daily Earnings * 30 Days`).
    *   **Recruitment Optimization:** analyzing timestamps to tell users "You recruit best on Tuesdays".

### C. A/B Testing System
*   **What it does:** Allows Admins to run experiments (e.g., "Does a Red Join Button work better than Blue?").
*   **How it works:** `ABTestingService.js` assigns users to Variant A/B/C based on traffic % settings, tracks their "Events" (clicks/signups), and uses a **Chi-Square Statistical Test** to declare a winner mathematically.

---

## 4. User Features (Frontend)

*   **Dashboard:** Shows Balance, Total Earned, Network Size.
*   **Resources:** A file library for training materials (`TeamResource` model).
*   **Events:** RSVP system for zoom calls/meetings (`Event` model).
*   **Campaigns:** Email marketing tool that tracks Opens/Clicks via tracking pixels (`campaignService.js`).
*   **Gamification:** Goals, Ranks, and Achievements (e.g., "Earn badges for recruiting 10 people").

---

## 5. Technical Integrity Audit

| Area | Status | Notes |
| :--- | :--- | :--- |
| **Database** | ⚠️ Partial | `schema.sql` is outdated. Code relies on tables (`deposits`, `fraud_alerts`) not in the schema file. Migration scripts are likely missing. |
| **Security** | ✅ Good | Uses JWT (`jsonwebtoken`), Password Hashing (`bcrypt`), and Role-Based Access Control (`requireMember`). |
| **Performance** | ✅ Good | Uses Database Transactions (`BEGIN/COMMIT`) for money safety. No heavy N+1 query issues spotted in critical paths. |
| **Web3** | ⚠️ Basic | "Web3" is mostly UI (`Web3Modal`). Backend does not verify on-chain data automatically without an external indexer (which is not present in this repo). |
