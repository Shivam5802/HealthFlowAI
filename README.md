# HEALTHFLOW AI — Healthcare Resource Intelligence Platform

> **"Predict. Prevent. Protect."**

*Disclaimer: All current data within this platform is synthetic/demo data designed for realistic simulation and verification unless connected to a live hospital/district healthcare information system.*

---

## 1. Project Overview

**HealthFlow AI** is an enterprise-grade healthcare resource intelligence and decision-support platform engineered to solve critical supply imbalances across healthcare networks (such as district health systems comprising tertiary hospitals, community health centres, and primary health centres).

HealthFlow AI continuously monitors:
- **Facilities**: Capacities, operational statuses, and geographic locations.
- **Inventory**: Stock levels, burn rates, safety stock thresholds, and days of supply remaining.
- **Patient Demand**: Historical outpatient/inpatient footfalls, acute demand surges, and bed occupancy.
- **Resource Movement**: Inter-facility transfer requests, approvals, dispatch, and delivery tracking.
- **Predictive Risk**: Proactive stockout timelines and anomaly-driven risk classifications.

---

## 2. Architecture & Operational Cycle

HealthFlow AI operates on a **closed-loop proactive governance model**:

```
    MONITOR (Real-time facility inventory & patient footfalls)
       ↓
    UNDERSTAND (Burn rate calculations, safety stock variance)
       ↓
    PREDICT (Time-series demand forecasting & stockout timelines)
       ↓
    ALERT (Automated severity-ranked notifications)
       ↓
    RECOMMEND (Heuristic & ML surplus-to-deficit redistribution)
       ↓
    APPROVE (Role-enforced authorization by Supply Managers)
       ↓
    REDISTRIBUTE (Multi-stage transfer logistics tracking)
       ↓
    RECONCILE (Automated stock balance adjustments & audit logging)
```

### System Architecture Diagram

```
                        ┌───────────────────────────────┐
                        │      NEXT.JS 15 FRONTEND      │
                        │   (App Router, Tailwind CSS,  │
                        │     Lucide Icons, Recharts)   │
                        └───────────────┬───────────────┘
                                        │
                               HTTPS / REST JSON
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │   NODE.JS / EXPRESS BACKEND   │
                        │   (TypeScript, Prisma ORM,    │
                        │    Zod Validation, JWT Auth)  │
                        └───────┬───────────────┬───────┘
                                │               │
                Prisma SQL      │               │  Internal HTTP
                                ▼               ▼
                    ┌──────────────────┐    ┌──────────────────┐
                    │    POSTGRESQL    │    │    ML SERVICE    │
                    │ Relational Data  │    │  Python/FastAPI  │
                    │   & Audit Logs   │    │  (Demand/Risk)   │
                    └──────────────────┘    └──────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  GOOGLE GEMINI API   │
                    │  (Backend-Orchestrated│
                    │   Panda Assistant)   │
                    └──────────────────────┘
```

---

## 3. Frontend Architecture

- **Framework**: Next.js 15 (React 19) with App Router.
- **Styling & Components**: Tailwind CSS with custom design system tokens, responsive cards, data tables, accessible dialogs, and badges.
- **Navigation & RBAC Shell**: Context-aware sidebar and top navigation that dynamically render views based on the authenticated role:
  - `/admin/*`: Central control tower, facilities directory, inventory tracking, predictions, alerts, transfer oversight, recommendations, reports, employee management.
  - `/manager/*`: Facility-isolated view for assigned facility, localized inventory, alert triaging, transfer requests, status tracking.
  - `/supply/*`: Supply chain cockpit, network resource catalog, inbound/outbound transfer approvals and logistics management.
- **State & Feedback**: Skeletons, error boundaries, empty state cards, and reactive notification toasts.
- **HealthFlow Panda**: Floating, grounded AI assistant widget with live markdown rendering and quick prompt pills.

---

## 4. Backend Architecture

- **Runtime**: Node.js with TypeScript and Express.
- **Data Access**: Prisma ORM with strict referential integrity, indexes, and cascade protections.
- **Validation**: Strict Zod schemas validating request payloads on all mutation endpoints.
- **Security Middleware**: 
  - `authenticateToken`: Validates JWT bearer tokens.
  - `requireRole`: Enforces granular RBAC (`ADMIN`, `HOSPITAL_MANAGER`, `SUPPLY_MANAGER`).
  - `requireFacilityAccess`: Enforces server-side facility-level data isolation.
- **Error Handling**: Centralized error middleware emitting standard error responses without leaking internal stack traces or database connection details.

---

## 5. Machine Learning (ML) Service

- **Runtime**: Python 3.12 with FastAPI and Uvicorn.
- **Core Algorithms**:
  - **Demand Forecasting**: Rolling 7/14/30-day weighted moving average with surge coefficient multipliers.
  - **Stockout Prediction**: Dynamic burn rate evaluation factoring in accelerated demand trends to project exact stockout dates.
  - **Risk Classification Engine**: Multi-tier classification (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) balancing days of supply remaining against historical standard deviations.
- **Resilience**: The backend incorporates graceful fallback logic; if the ML service is unreachable, heuristic fallbacks compute risk from current inventory and average burn rates.

---

## 6. Database Schema & Relational Integrity

The PostgreSQL database (managed via Prisma) incorporates the following core models:
1. `User`: User accounts, hashed credentials, employee IDs (`HF-EMP-xxxx`), roles, and assigned facilities.
2. `Facility`: Healthcare institutions (District Hospitals, CHCs, PHCs) with type, location, and bed capacity.
3. `Resource`: Medical catalog (medicines, vaccines, blood products, consumables) with unit metrics and storage categories.
4. `Inventory`: Current stock, daily consumption, safety stock thresholds, and computed risk tiers.
5. `PatientDemand`: Daily outpatient/inpatient footfall records and specific resource utilization data.
6. `Prediction`: Forecasted daily demand, stockout timelines, confidence scores, and explanation summaries.
7. `Alert`: Multi-severity operational notifications (`STOCKOUT_RISK`, `DEMAND_SURGE`, `LOW_STOCK`, etc.).
8. `Transfer`: Inter-facility shipments governed by a strict finite state machine.
9. `AuditLog`: Immutable audit entries capturing user actions, IP addresses, and state changes.

---

## 7. Authentication & Session Management

- **Protocol**: Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 (`JWT_SECRET`).
- **Password Security**: Passwords hashed using Bcrypt (salt rounds = 10). Plaintext passwords are never persisted.
- **Temporary Passwords & Onboarding**: Admin-created employees receive secure, one-time temporary passwords and have `mustChangePassword = true` until their first login credential reset.
- **Session Verification**: The `/api/auth/me` endpoint verifies token validity and user active status on every frontend route transition.

---

## 8. Role-Based Access Control (RBAC) & Facility Isolation

| Role | Scope | Permitted Actions |
|---|---|---|
| **ADMIN** | System-Wide (All Facilities) | Full control: facilities, inventory, global transfers, recommendations, employee onboarding, reports, Panda AI. |
| **HOSPITAL_MANAGER** | Assigned Facility Only | Localized monitoring: stock adjustments, local alerts, prediction review, transfer requests. **Peer facility access blocked.** |
| **SUPPLY_MANAGER** | Supply Chain Logistics | Network supply inspection: approving and advancing transfers through all logistical phases. |

### Server-Side Facility Isolation:
Hospital Managers cannot view or modify data of another facility by manipulating URL parameters (e.g., changing `/api/facilities/:id` or querying `/api/inventory?facilityId=...`). The backend verifies `req.user.facilityId === targetFacilityId` and rejects unauthorized requests with `403 FACILITY_ACCESS_DENIED`.

---

## 9. API Overview

All endpoints are prefixed with `/api`:

| Namespace | Key Endpoints | Methods | Description |
|---|---|---|---|
| `/auth` | `/login`, `/me`, `/change-password`, `/logout` | `POST`, `GET` | Authentication and credential lifecycle |
| `/users` | `/`, `/:id`, `/:id/status` | `GET`, `POST`, `PATCH` | Employee provisioning and deactivation |
| `/facilities` | `/`, `/:id`, `/:id/stats` | `GET`, `POST`, `PUT` | Healthcare facility master registry |
| `/resources` | `/`, `/:id` | `GET`, `POST`, `PUT` | Medical resource catalog |
| `/inventory` | `/`, `/:id`, `/facility/:facilityId` | `GET`, `POST`, `PUT`, `PATCH` | Live stock levels and daily burn rates |
| `/patients` | `/demand`, `/demand/record` | `GET`, `POST` | Patient demand and footfall logging |
| `/predictions`| `/`, `/run`, `/facility/:facilityId` | `GET`, `POST` | Demand forecasts and stockout predictions |
| `/risks` | `/overview`, `/facility/:facilityId` | `GET` | Risk engine metrics across the network |
| `/alerts` | `/`, `/:id/acknowledge`, `/:id/resolve`| `GET`, `POST`, `PATCH` | Operational notification triaging |
| `/transfers` | `/`, `/:id/status` | `GET`, `POST`, `PATCH` | Multi-phase transfer logistics FSM |
| `/recommendations` | `/redistribution` | `GET` | Algorithmic surplus-to-deficit matching |
| `/reports` | `/daily`, `/weekly` | `GET` | Executive analytics reports |
| `/chat` | `/` | `POST` | HealthFlow Panda grounded AI chat |

---

## 10. Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthflow_db?schema=public
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
ML_SERVICE_URL=http://localhost:8000
GEMINI_API_KEY=your_google_gemini_api_key
```

### ML Service (`ml-service/.env`)
```env
PORT=8000
HOST=127.0.0.1
ENVIRONMENT=development
MODEL_PATH=./app/models/saved/
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
*(Notice: The frontend strictly exposes zero private secrets, API keys, or database URLs).*

---

## 11. Complete Setup Instructions

### Prerequisites
- Node.js (v20+ recommended)
- Python (v3.10+ recommended)
- PostgreSQL (v14+ running on port 5432)

---

## 12. Database Migration

```bash
cd backend
# Validate schema
npx prisma validate

# Run migrations (or push schema directly in development)
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

---

## 13. Seed Instructions

Seed realistic synthetic healthcare data (25 facilities, 12 resources, 300 inventory items, 490+ patient records, active alerts, transfers, and demo scenarios):

```bash
cd backend
npm run prisma:seed
```

### Deliberate Hackathon Demo Scenario:
The database contains the following verified records:
- **Surplus Donor (Hospital A)**: *District General Hospital Lucknow*
  - Resource: `Medicine X (Paracetamol 500mg)`
  - Current Stock: **850 units**
  - Daily Consumption: **50 units/day**
  - Safety Stock: **100 units**
  - Days Remaining: **~17.0 days** (Healthy surplus)
- **Deficit Recipient (PHC B)**: *PHC Bakshi Ka Talab*
  - Resource: `Medicine X (Paracetamol 500mg)`
  - Current Stock: **150 units**
  - Daily Consumption: **75 units/day**
  - Safety Stock: **200 units**
  - Days Remaining: **~2.0 days** (Critical stockout risk)

The redistribution recommendation endpoint dynamically pairs these two facilities with zero hardcoding.

---

## 14. Running the Frontend

```bash
cd frontend
npm install
npm run dev
# Accessible at http://localhost:3000
```

---

## 15. Running the Backend

```bash
cd backend
npm install
npm run dev
# Accessible at http://localhost:5000
```

---

## 16. Running the ML Service

```bash
cd ml-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Accessible at http://localhost:8000
```

---

## 17. Demo Credentials

The platform provides pre-configured role-based credentials (with 1-click autofill on `/login`):

| Role | Email | Password | Assigned Scope |
|---|---|---|---|
| **System Administrator** | `admin@healthflow.demo` | `Admin@123` | Global Network Overview |
| **Hospital Manager** | `manager@healthflow.demo` | `Manager@123` | PHC Bakshi Ka Talab (Facility B) |
| **Supply Manager** | `supply@healthflow.demo` | `Supply@123` | District Logistics & Supply Chain |

---

## 18. HealthFlow Panda Grounded AI Architecture

HealthFlow Panda is an operational assistant that **never invents data**:
1. **User Query**: User submits a natural language question via the UI widget.
2. **Context Retrieval**: The backend extracts live database facts (top critical facilities, high-risk resources, active transfers, open alerts) using Prisma queries.
3. **Structured Prompting**: The live context and question are formatted into a system prompt instructing Gemini to act strictly as a healthcare supply intelligence assistant.
4. **Grounded Response**: Gemini processes the real metrics and responds with clinical summaries and actionable transfer advice.
5. **Graceful Fallback**: If `GEMINI_API_KEY` is unavailable or throttled, a robust heuristic assistant provides instant answers based directly on database aggregations.

---

## 19. Production Considerations

1. **Security**:
   - Store secrets in cloud key vaults (AWS Secrets Manager, GCP Secret Manager).
   - Enforce HTTPS and secure cookie flags in production.
   - Restrict CORS origins strictly to authorized production domains.
2. **Scalability**:
   - Utilize PostgreSQL connection pooling (PgBouncer) for high-concurrency environments.
   - Containerize services with Docker and deploy on Kubernetes or managed container platforms.
3. **Observability**:
   - Implement OpenTelemetry tracing and structured JSON logging (Winston / Pino).
   - Configure Sentry for automated frontend and backend exception monitoring.

---

## 20. Known Limitations

1. **Synthetic Data**: All facilities, patient volumes, and stock figures are synthetic simulations for hackathon demonstration. Connecting to real hospital HIS/EMR systems requires HL7/FHIR integration bridges.
2. **Transfer Transit Simulation**: In this release, status progression (`PACKED` $\to$ `IN_TRANSIT` $\to$ `DELIVERED`) is triggered manually by logistics coordinators rather than real-time GPS telemetry hardware.
3. **Single District Scope**: The default seed models a district cluster (~25 facilities) in Uttar Pradesh; multi-state federation requires tenant isolation partitioning.

---

*HealthFlow AI — Designed and engineered for resilient, proactive community healthcare delivery.*
