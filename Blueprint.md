# Inventory Management System

A modern web-based management system for managing **inventory, asset borrowing, subscriptions, and reminders** in a single centralized application.

The system is designed to provide a simple dashboard for monitoring assets, tracking borrowing activities, managing recurring subscriptions, and receiving reminders for important dates.

---

## ✨ Features

### 📊 Dashboard

A centralized overview of the entire system.

* Total inventory
* Available items
* Borrowed items
* Overdue borrowings
* Upcoming subscription renewals
* Upcoming reminders
* Recent activities
* Quick actions

---

### 📦 Inventory Management

Manage and track organizational assets.

Features:

* Add, edit, and delete inventory
* Inventory code / asset ID
* Categories
* Quantity
* Condition tracking
* Location tracking
* Purchase information
* Supplier information
* Warranty information
* Item photos
* Inventory status
* Inventory history

Example statuses:

```text
Available
Borrowed
Maintenance
Lost
Retired
```

---

### 🤝 Borrowing Management

Manage the complete borrowing lifecycle of inventory items.

Flow:

```text
Request
   ↓
Pending Approval
   ↓
Approved
   ↓
Borrowed
   ↓
Returned
   ↓
Available
```

Features:

* Borrowing requests
* Approval system
* Borrower information
* Borrowing date
* Due date
* Return date
* Overdue detection
* Borrowing history
* Borrowing status
* Notes

---

### 💳 Subscription Management

Manage recurring subscriptions and services.

Examples:

* Domain
* Hosting
* VPS
* SaaS
* Cloud storage
* Software licenses
* Google Workspace
* Microsoft 365
* Other recurring services

Information tracked:

* Service name
* Provider
* Category
* Cost
* Billing cycle
* Start date
* Next billing date
* Payment method
* Status
* Notes

Supported billing cycles:

```text
Monthly
Quarterly
Semi-Annually
Yearly
Custom
```

---

### 🔔 Reminder System

A centralized reminder system for important events.

Reminders can originate from multiple modules.

Examples:

```text
Inventory
   └── Warranty expiration

Borrowing
   └── Return due date

Subscription
   └── Renewal date

Maintenance
   └── Scheduled maintenance
```

Reminder statuses:

```text
Upcoming
Due Today
Overdue
Completed
Dismissed
```

---

## 👥 User & Role Management

The system uses **two roles only**:

```text
Admin
Staff
```

### Admin

Admin has full access to the system.

Permissions:

* View dashboard
* Manage inventory
* Manage borrowing
* Approve/reject borrowing requests
* Manage subscriptions
* Manage reminders
* View audit logs
* Manage users
* Manage system settings

### Staff

Staff can operate the day-to-day management features.

Permissions:

* View dashboard
* Manage inventory
* Create borrowing requests
* Manage borrowing records
* Manage subscriptions
* Manage reminders

Staff cannot:

* Approve/reject borrowing requests
* Manage users
* View audit logs
* Manage system settings

### Permission Matrix

| Feature                  | Admin | Staff |
| ------------------------ | :---: | :---: |
| Dashboard                |   ✅   |   ✅   |
| View Inventory           |   ✅   |   ✅   |
| Manage Inventory         |   ✅   |   ✅   |
| Create Borrowing Request |   ✅   |   ✅   |
| Manage Borrowing         |   ✅   |   ✅   |
| Approve Borrowing        |   ✅   |   ❌   |
| Manage Subscription      |   ✅   |   ✅   |
| Manage Reminder          |   ✅   |   ✅   |
| View Audit Log           |   ✅   |   ❌   |
| Manage Users             |   ✅   |   ❌   |
| System Settings          |   ✅   |   ❌   |

---

## 🧠 System Architecture

The system consists of several interconnected modules.

```text
                         ┌──────────────┐
                         │  DASHBOARD   │
                         └──────┬───────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
      ┌─────────────┐    ┌─────────────┐   ┌──────────────┐
      │  INVENTORY  │    │  BORROWING  │   │ SUBSCRIPTION │
      └──────┬──────┘    └──────┬──────┘   └──────┬───────┘
             │                  │                  │
             └──────────────────┼──────────────────┘
                                ▼
                         ┌──────────────┐
                         │   REMINDER   │
                         └──────────────┘
```

The Reminder module is designed to be reusable across different modules instead of being limited to subscriptions.

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Router

### Data & State Management

* TanStack Query
* Zustand *(when client-side global state is required)*

### Forms & Validation

* React Hook Form
* Zod

### UI & Visualization

* TanStack Table
* Recharts
* Lucide React

### Backend

* Supabase

Supabase provides:

* PostgreSQL
* Authentication
* Row Level Security
* Storage
* Edge Functions

### Deployment

* Vercel

---

## 🗄️ Database Overview

The initial database structure is designed around the application's main modules.

```text
profiles
    │
    └── role
         ├── admin
         └── staff

categories
    │
    └── inventories
            │
            ├── borrowings
            └── reminders

subscriptions
    │
    └── reminders

audit_logs
```

Expected core tables:

```text
profiles
categories
inventories
borrowings
subscriptions
reminders
audit_logs
```

Additional tables may be introduced as requirements evolve.

---

## 👤 User Profile

The `profiles` table extends the Supabase Auth user.

Example structure:

```text
profiles
├── id
├── full_name
├── email
├── role
├── avatar_url
├── created_at
└── updated_at
```

The `role` field supports only:

```text
admin
staff
```

For the initial version, a PostgreSQL enum can be used:

```sql
CREATE TYPE user_role AS ENUM (
  'admin',
  'staff'
);
```

A separate `roles` table is intentionally avoided because the application only requires two fixed roles.

---

## 🔐 Authentication & Security

Authentication is handled using Supabase Auth.

Authorization is enforced using:

* Role-Based Access Control
* PostgreSQL Row Level Security
* Protected frontend routes
* Database-level policies
* Server-side validation where required

Authentication flow:

```text
User
  ↓
Supabase Auth
  ↓
Authenticated User
  ↓
profiles
  ↓
role
  ↓
Admin / Staff
  ↓
Permission Check
  ↓
Application Access
```

Frontend route protection should not be considered sufficient security.

Critical permissions must also be enforced through Supabase Row Level Security policies.

---

## 🔔 Reminder Automation

The system supports automated reminder generation.

Example:

```text
Subscription
Next Billing:
2026-09-01

        ↓

Scheduled Function

        ↓

Check Upcoming Dates

        ↓

Create Reminder

        ↓

Dashboard Notification
```

Potential reminder sources:

```text
Inventory
Borrowing
Subscription
Maintenance
```

Future notification channels may include:

* In-app notification
* Email
* Telegram
* WhatsApp

---

## 📝 Audit Log

The system records important administrative actions.

Example:

```text
Admin added inventory INV-023

Staff created borrowing request INV-023

Admin approved borrowing INV-023

Staff recorded the return of INV-023

System changed:
Borrowed → Available
```

Audit logs are accessible only to Admin users.

---

## 📁 Project Structure

Initial frontend structure:

```text
src/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── inventory/
│   ├── borrowing/
│   ├── subscription/
│   └── reminder/
│
├── features/
│   ├── inventory/
│   ├── borrowing/
│   ├── subscription/
│   └── reminder/
│
├── pages/
│   ├── Dashboard.tsx
│   ├── Inventory.tsx
│   ├── Borrowing.tsx
│   ├── Subscriptions.tsx
│   └── Reminders.tsx
│
├── hooks/
│
├── lib/
│   ├── supabase.ts
│   └── utils.ts
│
├── types/
│
├── routes/
│
└── App.tsx
```

The structure may evolve toward a more feature-based architecture as the application grows.

---

## 🚀 Development

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git
* Supabase project

### Installation

```bash
git clone <repository-url>

cd inventory-management-system

npm install
```

### Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Never commit environment variables containing secrets to the repository.

---

## ▶️ Run Development Server

```bash
npm run dev
```

The application will be available through the local Vite development server.

---

## 🏗️ Production Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## 🧭 Development Roadmap

### Phase 1 — Foundation

* [ ] Initialize React + Vite + TypeScript
* [ ] Configure Tailwind CSS
* [ ] Configure shadcn/ui
* [ ] Configure Supabase
* [ ] Setup routing
* [ ] Setup authentication
* [ ] Setup base layout
* [ ] Setup Admin / Staff RBAC

### Phase 2 — Inventory

* [ ] Inventory database
* [ ] Inventory CRUD
* [ ] Categories
* [ ] Inventory detail page
* [ ] Image upload
* [ ] Search and filtering
* [ ] Inventory status
* [ ] Inventory history

### Phase 3 — Borrowing

* [ ] Borrowing database
* [ ] Borrowing request
* [ ] Approval flow
* [ ] Return process
* [ ] Overdue detection
* [ ] Borrowing history
* [ ] Borrowing reminders

### Phase 4 — Subscription

* [ ] Subscription database
* [ ] Subscription CRUD
* [ ] Billing cycle
* [ ] Renewal tracking
* [ ] Subscription status
* [ ] Renewal reminders

### Phase 5 — Reminder

* [ ] Reminder database
* [ ] Manual reminders
* [ ] Automatic reminders
* [ ] Due date detection
* [ ] Dashboard notifications
* [ ] Reminder status management

### Phase 6 — Dashboard

* [ ] Inventory statistics
* [ ] Borrowing statistics
* [ ] Subscription overview
* [ ] Upcoming reminders
* [ ] Recent activities
* [ ] Charts and analytics

### Phase 7 — Audit & Automation

* [ ] Audit logs
* [ ] Scheduled functions
* [ ] Notification system
* [ ] Telegram integration
* [ ] Email notifications
* [ ] Advanced reporting

---

## 🎯 Project Goal

The primary goal of this application is to provide a **centralized, simple, and scalable management system** for organizational assets and recurring services.

Instead of managing information across spreadsheets, chat messages, and separate reminder applications, the system brings everything together:

```text
Assets
   +
Borrowing
   +
Subscriptions
   +
Reminders
   +
Users
   +
Audit Logs
        ↓
Centralized Management System
```

The application should remain simple for daily use while providing enough structure to scale into a larger asset management platform.

---

## 📌 Current Role Model

The application intentionally uses only two roles:

```text
ADMIN
  │
  ├── Full system access
  ├── User management
  ├── Borrowing approval
  ├── Audit logs
  └── System settings

STAFF
  │
  ├── Inventory management
  ├── Borrowing management
  ├── Subscription management
  └── Reminder management
```

This role model should remain simple unless future requirements introduce a need for more granular permissions.
