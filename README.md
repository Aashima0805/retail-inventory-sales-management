# Retail Inventory & Sales Management System

A production-grade, full-stack retail management web application built strictly to the Business Requirements Document (BRD) for small retail shops. The system manages products, incoming stock receipts, inventory balances, point-of-sale checkout, receipts, sales auditing, and managerial reporting.

---

## 1. Technology Stack

* **Frontend:** Angular 21, TypeScript, HTML5, CSS3, Angular Material & CDK
* **Backend:** Java 17+, Spring Boot 3.3.5, Spring Security, Spring Data JPA, Hibernate, Flyway, JJWT, Jakarta Validation
* **Database:** Supabase PostgreSQL (Strict Free Plan) via PostgreSQL JDBC Driver
* **API Documentation:** OpenAPI 3 / Swagger UI (`springdoc-openapi`)
* **Build Tools:** Maven 3.9+, Node.js 24+, npm 11+

---

## 2. Zero-Cost & Free-Tier Policy

The project is designed to operate on permanent free tiers:
* **Database:** Supabase PostgreSQL Free Tier (connection pool strictly limited to 5–10 connections via HikariCP).
* **No Paid Upgrades:** No paid add-ons, compute upgrades, or external paid services.
* **Environment Protection:** Secrets, database credentials, and JWT signing keys are managed via environment variables and excluded from Git.

---

## 3. Project Directory Structure

```
KANINI/
├── .env.example                       # Template for environment variables (no secrets)
├── .gitignore                          # Excludes build artifacts, secrets, and IDE files
├── README.md                           # Main project documentation and setup guide
├── docs/
│   └── SYSTEM_DESIGN.md                # System design, Mermaid ER diagram, and architecture
├── backend/                            # Spring Boot 3 Maven Project
│   ├── pom.xml                         # Maven dependencies & build configuration
│   └── src/
│       └── main/
│           ├── java/com/retail/inventory/
│           │   ├── InventoryApplication.java # Spring Boot main entrypoint
│           │   ├── config/             # Security, CORS, OpenAPI configs
│           │   ├── controller/         # REST Controllers
│           │   ├── dto/                # Request & Response DTOs
│           │   ├── entity/             # JPA Entities
│           │   ├── exception/          # GlobalExceptionHandler & Custom Exceptions
│           │   ├── repository/         # Spring Data JPA Repositories
│           │   ├── security/           # JWT Filter, Token Provider, UserDetailsService
│           │   └── service/            # Transactional Business Services
│           └── resources/
│               ├── application.yml     # Application configuration & Supabase pool
│               └── db/migration/
│                   ├── V1__initial_schema.sql    # Tables, keys, and indexes
│                   └── V2__seed_initial_data.sql # Seed users, roles, categories, products
└── frontend/                           # Angular 21 Material Project
    ├── angular.json                    # Angular CLI build configuration
    ├── package.json                    # Node dependencies & scripts
    └── src/
        ├── index.html                  # HTML entrypoint with Roboto & Material Icons
        ├── styles.css                  # Global styles, Material theme & print CSS
        ├── environments/
        │   ├── environment.ts          # Production environment
        │   └── environment.development.ts # Development environment
        └── app/
            ├── core/
            │   ├── guards/             # AuthGuard, RoleGuard
            │   ├── interceptors/       # JwtInterceptor, ErrorInterceptor
            │   ├── models/             # TypeScript models & interfaces
            │   └── services/           # AuthService, NotificationService
            ├── features/
            │   ├── auth/               # Login component
            │   ├── admin/              # Catalog, Staff, Adjustments, Reports
            │   ├── cashier/            # POS counter, Receipts, My-Sales
            │   └── inventory/          # Incoming stock, Low stock monitoring
            └── shared/                 # Reusable components & UI layout
```

---

## 4. Setup and Execution Instructions

### Prerequisites
* Java JDK 17, 21, or 24
* Apache Maven 3.9+
* Node.js 20+ & npm 10+
* Free Supabase Account with a PostgreSQL project

### Step 1: Environment Variables Setup
Copy `.env.example` to `.env` in the root directory (or set environment variables in your terminal/IDE):
```bash
cp .env.example .env
```
Fill in your Supabase database host, database credentials, and a secure random JWT secret string.

### Step 2: Backend Build & Run
```bash
cd backend

# Compile and package the backend application
mvn clean package -DskipTests

# Run the Spring Boot application
mvn spring-boot:run
```
Flyway automatically creates the database tables (`V1__initial_schema.sql`) and seeds the default roles, users, and catalog (`V2__seed_initial_data.sql`).
* Backend API Base: `http://localhost:8080/api/v1`
* Swagger UI Docs: `http://localhost:8080/swagger-ui.html`

### Step 3: Frontend Build & Run
```bash
cd frontend

# Install dependencies (already executed during setup)
npm install

# Start the Angular development server
npm start
```
* Frontend Application URL: `http://localhost:4200`

---

## 5. Default Seed Accounts for Testing

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin` | `password123` | `ROLE_ADMIN` | Store Manager with catalog, staff, adjustments, & reports |
| `cashier1` | `password123` | `ROLE_CASHIER` | Checkout operator with POS search, sales, & own receipts |
| `inventory1` | `password123` | `ROLE_INVENTORY_STAFF` | Stock keeper for incoming deliveries & low-stock alerts |
