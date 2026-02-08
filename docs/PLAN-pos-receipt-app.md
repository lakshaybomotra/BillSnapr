# PLAN-pos-receipt-app

> **Goal:** Build "BillSnapr" - A multi-tenant, **Online-Prioritized** POS & Receipt Printing SaaS mobile app for restaurants (React Native/Expo + Supabase).
> **Note:** V1 focuses on a perfect online experience. Full offline sync is deferred to V2, though basic caching will be used for resilience.

## 1. Architecture & Foundation

**Strategy:** Direct Supabase integration using React Query for state management and caching. This simplifies development significantly compared to a complex sync engine.

*   [ ] **Repo Setup**: Initialize Expo project (Managed workflow) with TypeScript.
*   [ ] **Supabase Setup**:
    *   Create Project.
    *   Design Schema: `tenants`, `profiles`, `products`, `orders`, `order_items`, `subscriptions`.
    *   RLS (Row Level Security): **CRITICAL**. Enforce tenant isolation strictly at the database level.
*   [ ] **State Management**:
    *   **TanStack Query**: For data fetching, caching, and background updates.
    *   **Optimistic Updates**: To make the UI feel instant even if the network takes a few ms.

## 2. Authentication & Onboarding (SaaS)

**Strategy:** A frictionless, "perfect" onboarding experience.

*   [ ] **Auth Flow**: standard Supabase Email/Password.
*   [ ] **Tenant Creation**: Automatic "Restaurant" creation on sign-up. User becomes Admin.
*   [ ] **Onboarding Wizard**:
    *   Step 1: Restaurant Details (Name, Logo, Currency).
    *   Step 2: Receipt Configuration (Header, Footer).
    *   Step 3: Create First Product (to get them started).
*   [ ] **Subscription UI**:
    *   Clear display of current plan (Free tier for V1).

## 3. Core POS Features (Online)

**Strategy:** Fast, responsive, and intuitive. "No-training-needed" UI.

*   [ ] **Product Management**:
    *   Real-time product list.
    *   Categories with fast filtering.
    *   Quick Edit/Delete actions.
*   [ ] **Point of Sale Interface**:
    *   **Layout**: Tablet-optimized grid vs Mobile list view.
    *   **Cart interactions**: Swipe to delete, tap to edit quantity.
    *   **Search**: Instant client-side search of loaded products.
*   [ ] **Checkout**:
    *   Payment recording (Cash/Card/External).
    *   **Instant Feedback**: Success animation immediately upon order submission.

## 4. Hardware Integration (Bluetooth Printing)

**Strategy:** This must work flawlessly. It's the core value prop.

*   [ ] **Printer Management**:
    *   Dedicated "Hardware" settings screen.
    *   Auto-reconnect logic for previously paired printers.
*   [ ] **Receipt Engine**:
    *   Custom builder to generate ESC/POS commands (not just printing screenshots).
    *   Support for Logo (bit image printing), Bold text, and Cut commands.
*   [ ] **Print Workflows**:
    *   Auto-print on checkout (configurable).
    *   Reprint from Order History.

## 5. Sales & History

*   [ ] **Order List**: Infinite scroll list of past sales.
*   [ ] **Details View**: Full receipt preview, void order option.
*   [ ] **Dashboard**: Simple daily stats (Total Sales, Order Count).

## 6. Verification & Polish (The "Perfect" Standard)

*   [ ] **UI/UX Audit**:
    *   Consistent spacing, typography, and colors (Design System).
    *   Loading skeletons (no jarring spinners).
    *   Error boundaries for network flakes.
*   [ ] **Network Resilience**:
    *   Graceful handling of "No Internet" (Toast message, distinct UI state).
    *   Prevent order submission if completely offline (for V1).

---

## Agent Assignments

*   **`mobile-developer`**: UI/UX Master, React Query setup, Bluetooth logic.
*   **`backend-specialist`**: Supabase DB design, RLS security, Edge Functions (if needed).
*   **`project-planner`**: Roadmap tracking.
