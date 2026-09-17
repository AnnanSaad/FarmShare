# 🌾 FarmShare

### Shared equipment management for cooperative farming

**FarmShare** is a lightweight equipment-management platform designed for farming cooperatives that share expensive machinery across multiple farms.

It helps cooperatives **reserve equipment, perform mandatory pre-use inspections, track active usage, report damage, pause unsafe machinery, approve repairs, and maintain a complete equipment history** — all from a mobile-friendly web interface.

> **Reserve → Inspect → Use → Report → Repair → Verify → Return to Service**

---

## 🚜 The Problem

In a cooperative of farms, expensive machinery such as tractors, harvesters, tillers, and pumps is shared between multiple farmers.

Without a centralized system, common problems include:

* Conflicting equipment reservations
* Machines being used without condition checks
* Damage being discovered only after the next farmer receives the machine
* Broken machinery continuing to appear available
* No clear accountability for who used a machine
* No reliable history of inspections, damage, or repairs

FarmShare turns these informal handoffs into a **traceable operational workflow**.

---

## 💡 What FarmShare Does

### 1. 📅 Equipment Reservations

Farmers can see equipment availability and reserve a machine for a specific time period.

The system prevents overlapping active or upcoming bookings for the same equipment.

### 2. 🔍 Mandatory Pre-Use Inspection

A farmer cannot check out equipment until completing the required condition checklist:

* Engine
* Tires
* Leakage
* Attachments
* Safety

A failed inspection prevents checkout.

### 3. 🚜 Checkout & Return

Once the inspection passes, the farmer can check out the equipment.

The system records:

* Who checked it out
* Which equipment was used
* When usage started
* When it was returned

### 4. 🚨 Damage Reporting

Farmers can report damage while equipment is checked out.

When damage is reported:

```text
IN USE
   ↓
DAMAGE REPORTED
   ↓
REPAIR
   ↓
NEW BOOKINGS PAUSED
```

Future bookings are automatically cancelled so another farmer cannot unknowingly receive damaged machinery.

### 5. 🛠️ Administrator Repair Approval

Equipment under repair cannot be booked.

After the repair is completed, an administrator can approve the equipment and return it to service.

```text
REPAIR
   ↓
ADMIN APPROVAL
   ↓
AVAILABLE
```

### 6. 📜 Equipment History

Every important equipment event is recorded in a timeline.

Examples include:

* Reservation created
* Condition inspection passed
* Checkout
* Return
* Damage reported
* Booking cancelled
* Repair approved

This creates a clear accountability trail for every machine.

---

# 🔄 Accountability Loop

FarmShare is built around a simple operational loop:

```text
┌───────────┐
│  RESERVE  │
└─────┬─────┘
      ↓
┌───────────┐
│  INSPECT  │
└─────┬─────┘
      ↓
┌───────────┐
│  CHECKOUT │
└─────┬─────┘
      ↓
┌───────────┐
│    USE    │
└─────┬─────┘
      ↓
   ┌──┴───┐
   ↓      ↓
RETURN  DAMAGE
   ↓      ↓
AVAILABLE REPAIR
          ↓
    ADMIN APPROVAL
          ↓
      AVAILABLE
```

---

# 🛡️ Safety & Consistency Rules

FarmShare intentionally keeps critical state transitions **deterministic**.

### Booking protection

A booking is rejected when another active/upcoming booking overlaps its requested time.

### Checkout protection

Checkout requires a successful pre-use inspection.

### Damage protection

A damage report immediately moves equipment into:

```text
REPAIR
```

and pauses new bookings.

### Repair approval protection

An administrator cannot return equipment to service while an active or upcoming booking still exists.

### History protection

Important state transitions create immutable history events, making equipment activity traceable.

---

# 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │   Mobile Friendly    │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ↓
                    ┌──────────────────────┐
                    │      FastAPI         │
                    │   Business Rules     │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                ↓              ↓              ↓
          Equipment        Bookings       Admin
                │              │              │
                └──────────────┼──────────────┘
                               ↓
                    ┌──────────────────────┐
                    │     SQLAlchemy       │
                    │      SQLite DB       │
                    └──────────────────────┘
                               │
                               ↓
                    ┌──────────────────────┐
                    │   History Events     │
                    │   Accountability     │
                    └──────────────────────┘
```

---

# 🧰 Technology Stack

| Layer      | Technology        |
| ---------- | ----------------- |
| Frontend   | React             |
| Build Tool | Vite              |
| UI Icons   | Lucide React      |
| Backend    | FastAPI           |
| Database   | SQLite            |
| ORM        | SQLAlchemy        |
| Validation | Pydantic          |
| API        | REST              |
| Deployment | Free-tier hosting |

---

# 📂 Project Structure

```text
FarmShare/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── admin.py
│   │   │   ├── bookings.py
│   │   │   └── equipment.py
│   │   │
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── seed.py
│   │
│   ├── requirements.txt
│   └── render.yaml
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
└── README.md
```

---

# ⚡ Quick Start

## Backend

```bash
cd backend

python -m venv venv
```

### Windows

```powershell
venv\Scripts\activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### Seed demo data

```bash
python -m app.seed
```

### Start API

```bash
python -m uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

API health check:

```text
GET /api/health
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will provide the local frontend URL.

---

# 🔌 API Overview

### Equipment

```text
GET    /api/equipment/
GET    /api/equipment/{equipment_id}
GET    /api/equipment/{equipment_id}/history
```

### Bookings

```text
GET    /api/bookings/
POST   /api/bookings/
POST   /api/bookings/{booking_id}/condition
POST   /api/bookings/{booking_id}/checkout
POST   /api/bookings/{booking_id}/return
POST   /api/bookings/{booking_id}/cancel
```

### Administration

```text
GET    /api/admin/repairs
POST   /api/admin/equipment/{equipment_id}/return-to-service
```

---

# 🧪 Pre-Populated Demo

The application starts with six shared machines representing different operational states:

| Equipment         | State     |
| ----------------- | --------- |
| Power Tiller      | Available |
| Mahindra Tractor  | Reserved  |
| Combine Harvester | In Use    |
| Seed Drill        | Repair    |
| Water Pump        | Available |
| Rotavator         | Reserved  |

This means the application can be demonstrated immediately without creating users or entering setup data.

---

# 🎬 Recommended Demo Flow

A complete demonstration can be performed using the following sequence:

### 01 — Reserve

Select an available machine and create a reservation.

### 02 — Inspect

Complete the mandatory condition checklist.

### 03 — Checkout

The machine becomes:

```text
IN USE
```

### 04 — Report Damage

Submit a damage report.

The machine becomes:

```text
REPAIR
```

and future bookings are paused/cancelled.

### 05 — Administrator Approval

Open Administrator mode and approve the repaired machine.

The machine returns to:

```text
AVAILABLE
```

### 06 — History

Open the machine's history and verify the complete operational trail.

---

# 📱 Designed for Real-World Constraints

FarmShare is intentionally designed as a lightweight web application rather than a feature-heavy enterprise platform.

Key considerations include:

* Mobile browser support
* Lightweight API interactions
* Minimal data entry
* Clear state indicators
* Immediate validation
* No mandatory user registration
* Seeded demo state
* Safe failure behavior when the network is unavailable

The goal is to keep the critical actions understandable even under constrained connectivity.

---

# 🧠 Design Decisions & Trade-offs

### SQLite instead of a managed production database

SQLite keeps the prototype inexpensive, portable, and easy to deploy.

For a production cooperative deployment, this could be replaced with PostgreSQL while retaining the same service architecture.

### Deterministic rules instead of AI for safety decisions

Equipment safety and booking conflicts affect real-world operations.

Therefore, FarmShare uses explicit backend rules for:

* Booking conflicts
* Checkout eligibility
* Damage state transitions
* Repair approval

This makes critical decisions predictable and auditable.

### No real authentication

The prototype intentionally does not implement real user registration because the challenge does not require it.

The interface uses demonstration farmer identities while the backend still associates actions with the relevant booking/farmer.

### Lightweight architecture

The system uses a simple React + FastAPI + SQLite architecture to minimize deployment complexity and maximize reliability within a short prototype-development window.

---

# 🔐 Core Principle

> **Every machine state should be explainable.**

If a machine is available, reserved, in use, or under repair, FarmShare keeps the corresponding operational events connected through bookings, condition reports, and history.

---

# 🌱 Future Production Extensions

Potential production improvements include:

* Cooperative member authentication
* Role-based permissions
* PostgreSQL
* Push/SMS/WhatsApp notifications
* Offline-first synchronization
* Photo attachments for damage reports
* GPS/location verification
* Maintenance schedules
* Equipment utilization analytics
* Repair-cost tracking
* Multi-cooperative support

These are intentionally outside the prototype scope.

---

# 📊 Prototype Outcome

FarmShare demonstrates a complete shared-equipment lifecycle:

```text
Reservation
     ↓
Pre-use inspection
     ↓
Checkout
     ↓
Equipment usage
     ↓
Return OR damage report
     ↓
Repair workflow
     ↓
Administrator verification
     ↓
Return to service
     ↓
Traceable history
```

The result is a simple operational system that makes **equipment availability, accountability, and safety visible in one place.**

---

## 🔗 Project

**Repository:**
https://github.com/AnnanSaad/FarmShare

**Live Demo:**
*Add deployed URL here*

---

## 👨‍💻 Built by Syed Saaduddin

FarmShare was built as a practical prototype focused on solving a real operational problem for cooperative farming communities.

**Built with:** React · FastAPI · SQLAlchemy · SQLite
