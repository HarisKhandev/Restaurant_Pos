# Orbit POS — Restaurant Owner Application Flow Guide

> **Purpose:** This document describes the complete Orbit POS application from a **Restaurant Owner** perspective. It covers every sidebar menu, user role, order lifecycle, and how modules connect. Use this as context for understanding or extending the application.

---

## 1. Application Overview

**Orbit POS** is a multi-tenant business operating system (demo mode) for:

- Restaurants
- Bakeries
- Pharmacies
- Marts / Grocery
- Retail stores

Each business (tenant) has its own branding, branches, menu/products, staff, orders, inventory, and optional feature modules. Data is stored locally in the browser (mock storage / localStorage demo).

**Product name in UI:** Orbit POS — Business OS

**Demo restaurant (primary example):** Salt & Ember (`r1`, slug: `salt-and-ember`, Lahore)

---

## 2. Application Layers

The app has **three main surfaces**:

| Layer | URL Pattern | Who Uses It |
|-------|-------------|-------------|
| **Marketing / Demo Landing** | `/` | Public visitors |
| **Login** | `/login` | All staff |
| **Super Admin (Platform)** | `/super-admin/*` | Platform owner |
| **Restaurant Back Office** | `/restaurant/:restaurantId/*` | Owner, manager, staff |
| **POS Terminal** | `/restaurant/:restaurantId/pos` | Cashier, owner, manager |
| **Waiter Terminal** | `/restaurant/:restaurantId/waiter` | Waiter, owner, manager |
| **Rider Portal** | `/restaurant/:restaurantId/rider-dashboard` | Delivery rider |
| **Customer Online Store** | `/online-order/:slug` | Public customers (no login required) |

---

## 3. Entry & Authentication Flow

```
Landing Page (/)
    └── "Sign in" → Login Page (/login)
            └── Valid credentials → Role-based home redirect
                    ├── Super Admin → /super-admin
                    ├── Restaurant Owner → /restaurant/{id}/dashboard
                    ├── Branch Manager → /restaurant/{id}/dashboard
                    ├── Cashier → /restaurant/{id}/pos
                    ├── Kitchen Staff → /restaurant/{id}/kitchen
                    ├── Waiter → /restaurant/{id}/waiter
                    └── Delivery Rider → /restaurant/{id}/rider-dashboard
```

### Demo Credentials (password: `orbit123` for all)

| Role | Email |
|------|-------|
| Super Admin | owner@orbitpos.pk |
| Restaurant Owner | owner@saltandember.pk |
| Bakery Owner | owner@goldencrust.pk |
| Pharmacy Owner | owner@medicare.pk |
| Mart Owner | owner@freshmart.pk |
| Cashier | cashier@saltandember.pk |

Additional demo users exist for Branch Manager, Kitchen Staff, Waiter, and Delivery Rider (see `src/data/roleAccess.js`).

---

## 4. User Roles & Sidebar Access

### Restaurant Owner — Full Access

The **Restaurant Owner** sees **all sidebar items** enabled for their business type and subscription features. Only the Owner can access:

- **Offers**
- **Loyalty**
- **Settings**

### Role-Based Sidebar Visibility

| Sidebar Item | Owner | Branch Manager | Cashier | Kitchen Staff | Waiter | Delivery Rider |
|--------------|:-----:|:--------------:|:-------:|:-------------:|:------:|:--------------:|
| Dashboard | ✓ | ✓ | — | — | — | — |
| POS | ✓ | ✓ | ✓ | — | — | — |
| Orders | ✓ | ✓ | ✓ | — | ✓ | — |
| Tables | ✓* | ✓* | — | — | — | — |
| Kitchen | ✓* | ✓* | — | ✓* | — | — |
| Kitchen Progress | ✓* | ✓* | — | — | — | — |
| Menu | ✓ | ✓ | — | — | — | — |
| Addons | ✓ | ✓ | — | — | — | — |
| Offers | ✓ | — | — | — | — | — |
| Recipes | ✓* | ✓* | — | — | — | — |
| Inventory | ✓* | ✓* | — | — | — | — |
| Stock Lists | ✓* | ✓* | — | — | — | — |
| Purchasing | ✓* | ✓* | — | — | — | — |
| Customers | ✓* | ✓* | — | — | — | — |
| Delivery | ✓* | ✓* | — | — | — | — |
| Loyalty | ✓* | — | — | — | — | — |
| Employees | ✓ | ✓ | — | — | — | — |
| Roles | ✓ | ✓ | — | — | — | — |
| Shifts | ✓ | ✓ | — | — | — | — |
| Expenses | ✓* | ✓* | — | — | — | — |
| Ledger | ✓* | ✓* | — | — | — | — |
| Reports | ✓* | ✓* | — | — | — | — |
| Settings | ✓ | — | — | — | — | — |

\* Requires the corresponding **feature flag** to be enabled on the restaurant (e.g. `kds`, `inventory`, `delivery`).

### Special Full-Screen Routes (Not in Sidebar)

| Route | Access |
|-------|--------|
| `/restaurant/:id/pos` | Owner, Branch Manager, Cashier |
| `/restaurant/:id/waiter` | Owner, Branch Manager, Waiter |
| `/restaurant/:id/rider-dashboard` | Owner, Branch Manager, Delivery Rider |
| `/restaurant/:id/store` | Redirects to public online store |
| `/restaurant/:id/notifications` | All staff (via bell icon in topbar) |

---

## 5. Complete Restaurant Owner Sidebar Menu

Below is the **full sidebar** for a **Restaurant** business type with all features enabled. Items are shown in sidebar order.

```
┌─────────────────────────────────────┐
│  Orbit POS · Business OS            │
│  [Restaurant Name Chip]             │
├─────────────────────────────────────┤
│  Dashboard                          │
│  POS                                │
│  Orders                             │
│  Tables                             │
│  Kitchen                            │
│  Kitchen Progress                   │
│  Menu                               │
│  Addons                             │
│  Offers                             │
│  Recipes                            │
│  Inventory                          │
│  Stock Lists                        │
│  Purchasing                         │
│  Customers                          │
│  Delivery                           │
│  Loyalty                            │
│  Employees                          │
│  Roles                              │
│  Shifts                             │
│  Expenses                           │
│  Ledger                             │
│  Reports                            │
│  Settings                           │
├─────────────────────────────────────┤
│  Collapse sidebar · Sign out        │
└─────────────────────────────────────┘
```

### Top Bar (Global, All Restaurant Pages)

- **Branch picker** — Switch active branch (filters branch-scoped data)
- **Online/Offline toggle** — Simulates connectivity; shows pending sync count when offline
- **Theme toggle** — Light / dark mode
- **Notifications bell** — Opens `/notifications`
- **Global search (Ctrl+K)** — Search orders, products, customers
- **User avatar** — Shows logged-in name and role

---

## 6. End-to-End Order Lifecycle (Master Flow)

This is the **core business flow** connecting POS, Kitchen, Delivery, and Online Store.

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ ORDER SOURCE │ → │   CREATED    │ → │   KITCHEN    │ → │  FULFILLMENT │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
     │                    │                  │                  │
     ├─ POS (counter)     Pending Confirm*   New/Confirmed      Ready
     ├─ Waiter (table)    New                  Preparing          Out for Delivery*
     ├─ Online Store      │                    Ready              Completed
     └─ Aggregator        └──────────────────► Cancelled/Refunded (terminal)
```

### Order Status Pipeline

| Status | Meaning | Next Action |
|--------|---------|-------------|
| **Pending Confirmation** | Online order awaiting staff approval | Confirm → New |
| **New** | Accepted, waiting for kitchen | Accept / Start preparing → Preparing |
| **Confirmed** | Acknowledged (grouped with New in queues) | Start preparing → Preparing |
| **Preparing** | Being cooked/prepared | Mark ready → Ready |
| **Ready** | Food ready | Dispatch (delivery) / Serve (dine-in) / Mark picked up (takeaway) |
| **Out for Delivery** | With rider | Complete → Completed |
| **Completed** | Done | Terminal |
| **Cancelled** | Cancelled | Terminal |
| **Refunded** | Refunded | Terminal |

### Order Types

| Type | Fulfillment Path |
|------|------------------|
| **Dine-in** | Table → Kitchen → Serve at table → Completed |
| **Takeaway** | POS/Online → Kitchen → Customer pickup → Completed |
| **Delivery** | POS/Online → Kitchen → Assign rider → Out for Delivery → Completed |
| **Online** | Customer storefront → Pending Confirmation → same as Delivery or Pickup |

### Where Orders Appear

| Screen | Purpose |
|--------|---------|
| **Orders (Queue view)** | Kanban: Pending Confirmation → New → Preparing → Ready → Out for Delivery |
| **Orders (List view)** | Historical table with date filter |
| **Kitchen (KDS)** | Kanban: New → Preparing → Ready |
| **Kitchen Progress** | Manager pipeline: Received → Preparing → Ready → Out for Delivery |
| **Delivery** | Kanban: Pending Pickup → In Transit → Delivered |
| **Dashboard** | Pipeline counts and live stats |
| **Rider Dashboard** | Rider's assigned deliveries |

---

## 7. Sidebar Menu — Detailed Page Flows

---

### 7.1 Dashboard
**Route:** `/restaurant/:id/dashboard`  
**Access:** Owner, Branch Manager  
**Purpose:** Real-time business overview and decision-making hub.

**Flow:**
1. Owner lands here after login
2. Sees today's sales, orders, recurring customers, average order value
3. Applies date/category/branch filters
4. Views sales chart, order type breakdown, payment mix
5. Monitors order pipeline counts (Pending → Completed)
6. Reviews low stock alerts, active kitchen orders, rider availability
7. Can drill into customer order history from dashboard widgets

**Key widgets:** Quick stats, sales performance chart, order pipeline, top products, recurring customers, low stock alerts, rider status.

---

### 7.2 POS (Point of Sale)
**Route:** `/restaurant/:id/pos` (full-screen, outside sidebar shell layout)  
**Access:** Owner, Branch Manager, Cashier  
**Purpose:** Counter billing — the primary sales terminal.

**Flow:**
```
1. Select order type: Dine-in | Takeaway | Delivery | Pickup
2. Fill order details (context-dependent):
   - Dine-in: Table, Waiter, Guest count
   - Takeaway: Customer name/phone, Pickup time, Vehicle info
   - Delivery: Customer, Address, Area, Rider, Delivery notes
   - All: Order source (Website, FoodPanda, WhatsApp, etc.)
3. Browse menu by category or search/scan barcode
4. Tap product → Modifier modal (if add-ons exist) → Add to cart
5. Adjust quantities in cart panel
6. Review subtotal, service charge (5% dine-in), delivery charge
7. Pay → Select method (Cash, Card, Raast, JazzCash, EasyPaisa)
   → Apply discount/tax → Complete payment
8. Receipt shown → Order created with status "New"
9. Inventory/recipe stock deducted automatically
10. Order appears in Orders queue and Kitchen KDS
```

**Additional POS features:**
- Hold orders (retrieve later)
- Barcode scanning
- Stock validation against recipes
- Print receipt

---

### 7.3 Orders
**Route:** `/restaurant/:id/orders`  
**Access:** Owner, Branch Manager, Cashier, Waiter  
**Purpose:** Central command for all order channels.

**Two views:**

#### Queue View (Handle all orders)
- Kanban board with columns: **Pending Confirmation → New → Preparing → Ready → Out for Delivery**
- Filter by order type (Dine-in, Takeaway, Delivery, Online store)
- Search by order number or customer
- Drag cards between columns to update status
- Click card → Order detail modal with line items, status dropdown, action button

#### List View (Order history)
- Table of all orders with date picker (Today / specific date / All history)
- Filter by status and type
- Active orders listed first; completed last
- Export CSV

**Actions per status:** Confirm → Accept → Start preparing → Mark ready → Dispatch/Serve/Pick up → Complete

---

### 7.4 Tables
**Route:** `/restaurant/:id/tables`  
**Feature flag:** `tables`  
**Access:** Owner, Branch Manager  
**Purpose:** Live floor plan and table status management.

**Flow:**
1. View floor plan grid filtered by section (All, Main Hall, Terrace, VIP)
2. Each table shows: name, seats, status badge
3. Statuses: Available, Occupied, Reserved, Cleaning, Payment Pending
4. Click table → Cycle through statuses
5. Add new table (button)

**Connected to:** POS (table picker), Waiter terminal (table selection)

---

### 7.5 Kitchen (KDS — Kitchen Display System)
**Route:** `/restaurant/:id/kitchen`  
**Feature flag:** `kds`  
**Access:** Owner, Branch Manager, Kitchen Staff  
**Purpose:** Back-of-house ticket board for cooks.

**Flow:**
1. Kitchen staff sees live tickets in Kanban: **New → Preparing → Ready**
2. Filter by station (Grill, Pizza, Drinks, Dessert, BBQ)
3. Each ticket shows: order number, type, items with modifiers, prep timer, table/customer
4. Drag ticket or click action button to advance status
5. Status syncs instantly with Orders queue and Kitchen Progress

---

### 7.6 Kitchen Progress
**Route:** `/restaurant/:id/kitchen-progress`  
**Feature flag:** `kds`  
**Access:** Owner, Branch Manager  
**Purpose:** Manager view of kitchen performance and pipeline.

**Flow:**
1. View stats: avg prep time, completed today, longest wait, efficiency score
2. **Pipeline view:** Kanban — Received → Preparing → Ready → Out for Delivery
3. **Station view:** Orders grouped by kitchen station (Grill, Pizza, Drinks, etc.)
4. Click order → Detail drawer with item-level prep tracking
5. Mark individual items as prepared
6. Advance orders through pipeline

---

### 7.7 Menu
**Route:** `/restaurant/:id/menu`  
**Access:** Owner, Branch Manager  
**Purpose:** Product catalog — the source of truth for POS and online store.

**Flow:**
```
Add/Edit Product:
1. Basic info: name, SKU, category, price, image, prep time
2. Stock mode:
   a) Direct stock — manual stock count
   b) Recipe-linked — ingredients deduct from inventory on sale
3. Link add-ons (from Addons page) by category
4. Toggle "On menu" availability
5. Save → Product appears in POS and online store (if available)
```

**Table columns:** Product, Category, Stock source (Recipe/Direct), Add-ons count, Prep time, Price, Food cost, Available units, On-menu toggle.

**Quick action:** Add inventory item inline while building recipe.

---

### 7.8 Addons
**Route:** `/restaurant/:id/addons`  
**Access:** Owner, Branch Manager  
**Purpose:** Modifiers/extras grouped by menu category (e.g. burger extras, pizza toppings).

**Flow:**
1. View add-ons filtered by category (Burgers, Pizza, BBQ, etc.)
2. Add/Edit add-on: name, price, category, active toggle
3. Linked from Menu page when configuring products
4. Shown in POS Modifier modal and online store customize flow

---

### 7.9 Offers
**Route:** `/restaurant/:id/offers`  
**Access:** Restaurant Owner only  
**Purpose:** Promotions and deals for online store and marketing.

**Flow:**
1. Create offer: type (deal/discount), title, description, image
2. Set discount type (percentage/fixed), value, category, validity dates
3. Active toggle
4. Deals appear on customer online store under "Deals & Offers" section

---

### 7.10 Recipes
**Route:** `/restaurant/:id/recipes`  
**Feature flag:** `inventory`  
**Access:** Owner, Branch Manager  
**Purpose:** Link menu products to inventory ingredients for costing and auto-deduction.

**Flow:**
1. View all recipes with linked product, ingredient count, cost, margin
2. Add recipe: select menu product → add ingredients (inventory items + quantities)
3. System calculates recipe cost and max servings from current stock
4. When product sells (POS/online), inventory deducts per recipe

---

### 7.11 Inventory
**Route:** `/restaurant/:id/inventory`  
**Feature flag:** `inventory`  
**Access:** Owner, Branch Manager  
**Purpose:** Raw ingredient and supply stock management.

**Flow:**
1. View all inventory items: name, SKU, category, unit, stock, minimum, cost
2. Low-stock items highlighted when stock ≤ minimum
3. Add new inventory item
4. Adjust stock (+/-) via modal
5. Used by: Recipes, Menu (direct stock mode), Stock Lists, Purchasing

**Categories:** Meat, Dry Goods, Dairy, Produce, Spices, Packaging, etc.

---

### 7.12 Stock Lists
**Route:** `/restaurant/:id/stock-lists`  
**Feature flag:** `purchasing`  
**Access:** Owner, Branch Manager  
**Purpose:** Automated reorder lists based on inventory thresholds.

**Flow:**
1. View existing stock lists with item count, status, schedule
2. Create stock list: name, auto-generate from low-stock items
3. Review items below minimum threshold
4. Convert to purchase order (links to Purchasing)

---

### 7.13 Purchasing
**Route:** `/restaurant/:id/purchasing`  
**Feature flag:** `purchasing`  
**Access:** Owner, Branch Manager  
**Purpose:** Purchase orders, suppliers, and procurement tracking.

**Flow:**
1. View purchase orders table: PO number, supplier, items, total, status
2. Create PO: select supplier, add line items, set delivery date
3. Track status: Draft → Sent → Received
4. Updates inventory on receipt

---

### 7.14 Customers
**Route:** `/restaurant/:id/customers`  
**Feature flag:** `crm`  
**Access:** Owner, Branch Manager  
**Purpose:** Customer relationship management.

**Flow:**
1. View customer records: name, phone, email, total orders, total spent, tier (New/Returning/Regular/VIP)
2. Search and filter customers
3. Add new customer manually
4. Click customer → Drawer with full order history, contact info, loyalty points
5. Customers selectable in POS customer picker

---

### 7.15 Delivery
**Route:** `/restaurant/:id/delivery`  
**Feature flag:** `delivery`  
**Access:** Owner, Branch Manager  
**Purpose:** Last-mile delivery operations.

**Four tabs:**

| Tab | Flow |
|-----|------|
| **Active Deliveries** | Kanban: Pending Pickup → In Transit → Delivered. Assign rider to ready orders. |
| **Rider Dashboard** | Cards per rider: status (Available/On Delivery/Off Duty), active orders, rating. Toggle status. |
| **Routes** | Define delivery zones, areas covered, estimated time, default rider. |
| **Settings** | Delivery radius, fee, auto-assignment, max concurrent orders per rider. |

**Connected to:** Orders (Out for Delivery status), Rider Portal, POS (rider picker)

---

### 7.16 Loyalty
**Route:** `/restaurant/:id/loyalty`  
**Feature flag:** `loyalty`  
**Access:** Restaurant Owner only  
**Purpose:** Points, tiers, and rewards program.

**Flow:**
1. View loyalty members and point balances
2. Configure reward tiers and redemption rules
3. Points applied at POS and tracked per customer

---

### 7.17 Employees
**Route:** `/restaurant/:id/employees`  
**Access:** Owner, Branch Manager  
**Purpose:** Team member records.

**Flow:**
1. View employees: name, role, branch, phone, status (Active/Inactive)
2. Add employee: name, role, branch assignment, contact
3. Roles include: Branch Manager, Cashier, Kitchen Staff, Waiter, Delivery Rider

---

### 7.18 Roles
**Route:** `/restaurant/:id/roles`  
**Access:** Owner, Branch Manager  
**Purpose:** User accounts and permission management.

**Flow:**
1. View all user accounts with role and status
2. Create user: name, email, password, role, branch, permissions
3. Toggle individual permissions: POS, Kitchen, Inventory, Reports, Customers, Delivery, Orders, Menu, Employees, Recipes, Stock Lists, Ledger, Roles
4. Permissions filter sidebar visibility for custom roles

---

### 7.19 Shifts
**Route:** `/restaurant/:id/shifts`  
**Access:** Owner, Branch Manager  
**Purpose:** Cashier shift management and cash control.

**Flow:**
1. View shifts: cashier name, branch, opening cash, expected balance, variance
2. Track shift open/close times
3. Identify cash discrepancies

---

### 7.20 Expenses
**Route:** `/restaurant/:id/expenses`  
**Feature flag:** `expenses`  
**Access:** Owner, Branch Manager  
**Purpose:** Operational cost tracking.

**Flow:**
1. View expenses table: date, category, amount, branch, notes
2. Add expense: category (Rent, Electricity, Gas, Salaries, Supplies, Maintenance, Marketing, Delivery, Miscellaneous), amount, date, branch
3. Feeds into Reports financial summary

---

### 7.21 Ledger
**Route:** `/restaurant/:id/ledger`  
**Feature flag:** `reports`  
**Access:** Owner, Branch Manager  
**Purpose:** Financial records — daily/weekly/monthly ledger entries.

**Flow:**
1. View ledger entries with date, description, debit, credit, balance
2. Filter by period (Daily, Weekly, Monthly)
3. Export records
4. Tracks revenue, expenses, and running balance

---

### 7.22 Reports
**Route:** `/restaurant/:id/reports`  
**Feature flag:** `reports`  
**Access:** Owner, Branch Manager  
**Purpose:** Business intelligence and analytics.

**Flow:**
1. Set date range and branch filter
2. View: Gross sales, Discounts, Tax collected, Net sales
3. Revenue trend chart (daily bar chart)
4. Financial summary: Gross → Discounts → COGS → Expenses → Net profit
5. Print or Export CSV

---

### 7.23 Settings
**Route:** `/restaurant/:id/settings`  
**Access:** Restaurant Owner only  
**Purpose:** Restaurant configuration hub.

**Settings tabs:**

| Tab | What It Controls |
|-----|------------------|
| **General** | Restaurant name, basic config, **Reset demo data** |
| **Branding** | Colors, logo mark, visual identity |
| **Online Ordering** | Public store URL, slug, delivery ETA settings, busy mode, COD |
| **Taxes** | Tax rates and rules |
| **Payments** | Accepted payment methods |
| **POS** | POS terminal behavior |
| **Kitchen** | KDS and prep settings (if `kds` enabled) |
| **Inventory** | Stock alert thresholds (if `inventory` enabled) |
| **Delivery** | Delivery defaults (if `delivery` enabled) |
| **Notifications** | Alert preferences |
| **Users & Roles** | Team access overview |
| **Features** | Toggle feature modules on/off per restaurant |
| **FBR** | Tax registration simulation (if `fbr` enabled) |

**Online Ordering tab key settings:**
- Customer URL: `{origin}/online-order/{slug}`
- Base kitchen time, delivery rider time, estimate buffer
- Busy kitchen mode (adds extra minutes)
- Cash on Delivery default

---

## 8. Staff Terminal Flows (Outside Sidebar)

### 8.1 Waiter Terminal
**Route:** `/restaurant/:id/waiter`

```
1. Select table from floor plan (shows status: Available/Occupied/etc.)
2. Browse menu by category
3. Tap items to add to table order
4. Add special instructions per item
5. "Send to Kitchen" → Creates Dine-in order (status: New)
6. Order appears on Kitchen KDS and Cashier POS
7. View active table orders list
```

### 8.2 Rider Portal
**Route:** `/restaurant/:id/rider-dashboard`

```
1. Rider sees profile, vehicle, zone, status (Available/On Delivery/Off Duty)
2. Tabs: My Deliveries | Ready for Pickup | Completed | Routes
3. Accept ready orders → Status: Out for Delivery
4. Mark delivered → Status: Completed
5. Track earnings and delivery stats
```

---

## 9. Customer Online Store Flow
**Route:** `/online-order/:slug` (public, no staff login)

```
1. Customer opens restaurant's public URL
2. Browses menu by category with sticky nav
3. Views Deals & Offers section (if active offers exist)
4. Adds items to cart (modifier modal for customizable items)
5. Sidebar cart shows items, subtotal, estimated delivery time
6. Checkout:
   - Choose fulfillment: Delivery or Pickup
   - Enter name, phone, address (with map picker for delivery)
   - Payment: Cash on Delivery (default)
7. Place order → Status: "Pending Confirmation"
8. Order appears in staff Orders queue (Pending Confirmation column)
9. Staff confirms → Normal kitchen pipeline begins
10. Customer can track live order status (if logged in via Customer Portal)
```

**Customer account features:** Login/register, order history, saved addresses, loyalty points.

---

## 10. Feature Modules & Gating

Features are toggled per restaurant in **Settings → Features**. Disabled features hide sidebar items and show "Feature not enabled" if accessed directly.

| Feature Key | Sidebar Items Affected | Description |
|-------------|------------------------|-------------|
| `pos` | POS | Point of sale billing |
| `tables` | Tables | Table management |
| `kds` | Kitchen, Kitchen Progress | Kitchen display system |
| `online` | (Online store link) | Public ordering page |
| `delivery` | Delivery | Delivery management |
| `inventory` | Recipes, Inventory | Stock and recipes |
| `purchasing` | Stock Lists, Purchasing | Procurement |
| `crm` | Customers | Customer CRM |
| `loyalty` | Loyalty | Rewards program |
| `expenses` | Expenses | Cost tracking |
| `reports` | Ledger, Reports | Analytics |
| `fbr` | Settings (FBR tab) | Tax compliance (demo) |

### Feature Module Groups (from platform config)

1. **Point of Sale** — POS Billing
2. **Front of House** — Table Management, Reservations
3. **Kitchen** — Kitchen Display
4. **Online Commerce** — Online Ordering
5. **Delivery & Fleet** — Delivery, Rider Management
6. **Inventory & Supply** — Inventory, Purchasing
7. **Customers** — Customer CRM, Loyalty
8. **Finance & Compliance** — Expenses, Accounting, Advanced Reports, FBR

---

## 11. Business Type Variations

Sidebar differs by business type. Below shows which items appear:

| Menu Item | Restaurant | Bakery | Pharmacy | Mart | Retail |
|-----------|:----------:|:------:|:--------:|:----:|:------:|
| Tables | ✓ | ✓ | — | — | — |
| Kitchen | ✓ | ✓ | — | — | — |
| Kitchen Progress | ✓ | ✓ | — | — | — |
| Offers | ✓ | — | — | — | — |
| Loyalty | ✓ | — | — | — | — |
| Shifts | ✓ | — | — | — | — |
| Recipes | ✓ | ✓ | — | — | — |
| All others | ✓ | ✓ | ✓ | ✓ | ✓ |

Pharmacy/Mart/Retail skip kitchen and table modules; focus on barcode POS, inventory, and delivery.

---

## 12. Data Model Relationships

```
Restaurant (tenant)
├── Branches (locations)
├── Features (enabled modules)
├── Branding (colors, slug)
├── Prep Settings (ETA calculation)
├── Categories (menu groupings by business type)
├── Products (menu items)
│   ├── linked to Recipes (optional)
│   ├── linked to Addons (optional)
│   └── direct stock OR recipe-based availability
├── Addons (modifiers by category)
├── Offers (promotions)
├── Inventory (raw materials)
├── Recipes (product → ingredients mapping)
├── Stock Lists (auto reorder)
├── Purchase Orders
├── Tables (per branch)
├── Employees / Riders
├── Users (login accounts with roles & permissions)
├── Customers
├── Orders
│   ├── items (with modifiers)
│   ├── status pipeline
│   ├── type (Dine-in/Takeaway/Delivery/Online)
│   ├── payment method
│   └── rider/table/waiter assignments
├── Expenses
├── Shifts
├── Routes (delivery zones)
└── Notifications
```

### Key Automatic Behaviors

1. **Sale → Inventory deduction:** When order is paid, recipe ingredients deduct from inventory
2. **Low stock → Alerts:** Dashboard and inventory highlight items below minimum
3. **Order status sync:** POS, Orders, Kitchen, Delivery, and Dashboard all share the same order status
4. **Online ETA:** Calculated from prep settings + cart items + kitchen queue load
5. **Branch scoping:** Tables, some employees, and POS pickers filter by active branch

---

## 13. Super Admin Sidebar (Platform Level)

For completeness — the platform owner sees:

| Menu | Route | Purpose |
|------|-------|---------|
| Dashboard | `/super-admin` | Platform-wide stats |
| Business Types | `/super-admin/business-types` | Configure restaurant/bakery/pharmacy/mart/retail |
| Businesses | `/super-admin/restaurants` | Manage all tenant restaurants |
| Plans | `/super-admin/plans` | Subscription plans (Starter/Professional/Enterprise) |
| Subscriptions | `/super-admin/subscriptions` | Active subscriptions |
| Feature management | `/super-admin/features` | Platform feature matrix |
| Audit logs | `/super-admin/audit-logs` | Activity audit trail |

---

## 14. Complete URL Route Reference

### Public
- `/` — Demo landing page
- `/login` — Staff login
- `/online-order/:slug` — Customer storefront

### Super Admin
- `/super-admin` — Dashboard
- `/super-admin/business-types`
- `/super-admin/restaurants`
- `/super-admin/restaurants/:id`
- `/super-admin/plans`
- `/super-admin/subscriptions`
- `/super-admin/features`
- `/super-admin/audit-logs`

### Restaurant Back Office
- `/restaurant/:id/dashboard`
- `/restaurant/:id/orders`
- `/restaurant/:id/tables`
- `/restaurant/:id/kitchen`
- `/restaurant/:id/kitchen-progress`
- `/restaurant/:id/menu`
- `/restaurant/:id/addons`
- `/restaurant/:id/offers`
- `/restaurant/:id/recipes`
- `/restaurant/:id/inventory`
- `/restaurant/:id/stock-lists`
- `/restaurant/:id/purchasing`
- `/restaurant/:id/customers`
- `/restaurant/:id/delivery`
- `/restaurant/:id/loyalty`
- `/restaurant/:id/employees`
- `/restaurant/:id/roles`
- `/restaurant/:id/shifts`
- `/restaurant/:id/expenses`
- `/restaurant/:id/ledger`
- `/restaurant/:id/reports`
- `/restaurant/:id/settings`
- `/restaurant/:id/notifications`
- `/restaurant/:id/branches`

### Full-Screen Terminals
- `/restaurant/:id/pos`
- `/restaurant/:id/waiter`
- `/restaurant/:id/rider-dashboard`
- `/restaurant/:id/store` → redirects to `/online-order/:slug`

---

## 15. Typical Restaurant Owner Daily Workflow

```
Morning:
  Dashboard → Check yesterday's sales, today's pipeline
  Inventory → Review low-stock alerts
  Stock Lists → Generate reorder list if needed

Setup (occasional):
  Menu → Add/update products and recipes
  Addons → Configure modifiers
  Offers → Create promotions for online store
  Settings → Update prep times, online store URL

Service hours:
  Orders → Monitor queue, confirm online orders
  Kitchen Progress → Watch prep times and bottlenecks
  Delivery → Assign riders to ready orders
  Tables → Monitor floor occupancy

Counter:
  POS → Process walk-in, takeaway, and dine-in payments

End of day:
  Reports → Review sales, payment mix, net profit
  Ledger → Check daily financial entries
  Shifts → Review cashier shift variances
  Expenses → Log any daily expenses
```

---

## 16. Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | React (Vite) |
| Routing | React Router DOM |
| State | AppContext (React Context) + localStorage |
| Charts | Recharts |
| Icons | Lucide React |
| Styling | CSS custom properties (light/dark themes) |

**Key source files:**
- `src/App.jsx` — All routes and access control
- `src/layouts/AppShell.jsx` — Sidebar and topbar
- `src/data/seed.js` — Demo data, business types, feature config
- `src/data/roleAccess.js` — Roles and permissions
- `src/utils/orderWorkflow.js` — Order status pipeline logic
- `src/context/AppContext.jsx` — Global state and actions
- `src/pages/RestaurantPages.jsx` — Most back-office pages
- `src/pages/POS.jsx` — Point of sale terminal
- `src/pages/RecipeInventoryPages.jsx` — Recipes, inventory, delivery, waiter, rider
- `src/pages/ManagerDashboardPages.jsx` — Dashboard, roles, customers, kitchen progress
- `src/pages/Storefront.jsx` — Customer online ordering

---

*Document generated from Orbit POS codebase. Reflects demo application behavior as of 2026.*
