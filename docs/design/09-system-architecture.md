# System Architecture

**Project Name:** SkillVerse – Community Skill Exchange

**Document Version:** 1.0

**Author:** Nhu Le Nguyen Quynh

**Last Updated:** July 16, 2026

---

# 1. Introduction

This document describes the high-level architecture of SkillVerse. It defines the major system components, their responsibilities, interactions, and the technologies used to implement the application.

The architecture is designed to support the Minimum Viable Product (MVP) while remaining extensible for future cloud-native enhancements.

---

# 2. Architecture Goals

The architecture aims to:

* Separate frontend and backend responsibilities.
* Follow a layered architecture for maintainability.
* Expose functionality through RESTful APIs.
* Support deployment to AWS.
* Enable future migration to microservices.
* Maintain a clean and modular project structure.

---

# 3. High-Level Architecture

```text
                    User
                      │
                      ▼
             Angular Web Frontend
                      │
              HTTPS / REST API
                      │
                      ▼
              FastAPI Backend
      ┌───────────────┼───────────────┐
      │               │               │
 Authentication   Business Logic   Data Access
      │               │               │
      └───────────────┼───────────────┘
                      │
                      ▼
               PostgreSQL Database
```

---

# 4. Architecture Style

SkillVerse adopts a **Layered Architecture (N-tier Architecture)**.

### Presentation Layer

Responsibilities:

* Display user interface.
* Validate client input.
* Send API requests.
* Display API responses.

Technology:

* Angular
* TypeScript
* HTML
* SCSS

---

### Application Layer

Responsibilities:

* Process requests.
* Execute business logic.
* Coordinate application workflows.
* Apply validation rules.

Technology:

* FastAPI
* Python

---

### Data Layer

Responsibilities:

* Store application data.
* Execute database queries.
* Maintain data integrity.

Technology:

* PostgreSQL
* SQLAlchemy ORM

---

# 5. Component Overview

## Frontend

Major responsibilities:

* Authentication pages
* Dashboard
* User Profile
* Skill Management
* Skill Search
* Booking Management
* Wallet
* Reviews

---

## Backend

Major modules:

* Authentication
* User Management
* Skill Management
* Booking Service
* Wallet Service
* Review Service
* Administration

---

## Database

Primary entities:

* Users
* Skills
* Bookings
* Reviews
* Wallets
* Transactions

Detailed relationships are documented in the Database Design document.

---

# 6. Request Flow

A typical user request follows this process:

```text
User
   │
   ▼
Angular UI
   │
REST Request
   │
FastAPI Router
   │
Service Layer
   │
Repository Layer
   │
PostgreSQL
   │
Response
   │
Angular UI
```

---

# 7. Layer Responsibilities

| Layer      | Responsibility                     |
| ---------- | ---------------------------------- |
| Frontend   | User interaction and presentation  |
| API        | Receive and validate HTTP requests |
| Service    | Business logic and workflow        |
| Repository | Database operations                |
| Database   | Persistent data storage            |

Each layer has a single responsibility and communicates only with adjacent layers.

---

# 8. Security Overview

The architecture includes the following security measures:

* JWT-based authentication.
* Password hashing.
* Request validation using Pydantic.
* Environment-based configuration.
* Protected API endpoints.
* HTTPS deployment in production.

---

# 9. Deployment Overview

The MVP deployment consists of:

```text
Browser
    │
    ▼
Angular Frontend
    │
    ▼
FastAPI REST API
    │
    ▼
PostgreSQL Database

CI/CD

GitHub
    │
GitHub Actions
    │
AWS Deployment
```

Future versions may introduce:

* Docker containers
* Kubernetes
* Load balancing
* Monitoring
* Auto scaling

---

# 10. Architectural Principles

SkillVerse follows these software engineering principles:

* Separation of Concerns
* Single Responsibility Principle
* Modularity
* Reusability
* Scalability
* Maintainability
* RESTful API Design
* Cloud-Ready Architecture

---

# 11. Future Evolution

The current architecture is designed so that individual modules can later evolve into independent microservices if required.

Possible future services include:

* Authentication Service
* User Service
* Skill Service
* Booking Service
* Wallet Service
* Notification Service

This minimizes future refactoring while supporting gradual system growth.

---

# 12. Summary

The SkillVerse architecture provides a modular and scalable foundation for the internship project. It separates presentation, business logic, and data management while following industry-standard architectural practices.

The layered architecture supports the current MVP and provides a clear migration path toward a cloud-native microservices architecture in future iterations.
