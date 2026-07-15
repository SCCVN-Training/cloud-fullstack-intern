# Syncra - Corporate Internal Event & Workshop Management Platform

A production-grade enterprise application for managing internal company workshops and training events. Tech leads can create and post workshops; employees register and discover learning opportunities.

## Overview

This is a **10-week solo training milestone** at SCC Vietnam, designed to teach full-stack enterprise architecture, microservices design, cloud infrastructure, and DevOps practices through a real-world application.

### Key Features

- **Workshop Posting & Discovery** – Tech leads publish workshops with descriptions, schedules, speaker bios, and asset uploads
- **Employee Registration & Seat Management** – Attendees register for workshops with real-time seat capacity tracking and waitlist support
- **Role-Based Access Control** – Admin, Speaker, and Attendee role separation with granular permissions
- **Cloud-Native Architecture** – Built on AWS (S3, Lambda, Secrets Manager, Elastic Beanstalk) with infrastructure-as-code
- **Observability & Monitoring** – Structured JSON logging, correlation IDs, CloudWatch dashboards for production visibility

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Angular (Modules, Components, Services, RxJS, Reactive Forms) |
| **Backend** | Python, FastAPI (Routers, Pydantic, Dependency Injection) |
| **Database** | PostgreSQL (schema-per-microservice pattern) |
| **Cloud** | AWS (S3, Lambda, Secrets Manager, Elastic Beanstalk) |
| **DevOps** | GitHub Actions (CI/CD), Terraform (IaC), Kubernetes/EKS |
| **Observability** | Amazon CloudWatch (structured logging, metrics) |

## System Architecture

The backend is split into **three independent microservices** with isolated databases:

1. **UserService** – Employee profiles, authentication, authorization (Admin/Speaker/Attendee roles)
2. **EventService** – Workshop management, speaker information, schedule, S3 asset uploads
3. **RegistrationService** – Registration bookings, seat capacity tracking, cancellations

Each service owns its PostgreSQL schema, publishes events for inter-service communication, and exposes a RESTful API.

## 10-Week Training Roadmap

| Week | Focus | Deliverable |
|------|-------|-------------|
| **1–2** | Foundations & Boilerplate | Monorepo setup, Git workflow, Angular/FastAPI scaffolding, local Postgres |
| **3** | Full-Stack Core | REST APIs, database integration, basic CRUD operations |
| **4** | Business Logic & Architecture | Repository/Service patterns, auth stubs, Coach Demo #1 |
| **5** | Microservice Splitting | Monolith → 3 microservices, Docker Compose, DTO contracts |
| **6** | AWS Cloud Services | Secrets Manager, S3 uploads, Lambda cron (daily email summaries) |
| **7** | End-to-End Integration | Full Angular + microservices stack, 1st service to cloud |
| **8** | Cloud Deployment | Elastic Beanstalk, Lambda, S3; smoke testing, rollback strategy |
| **9** | DevOps & GitOps | GitHub Actions pipelines, Terraform modules, Kubernetes manifests |
| **10** | Observability & Final Demo | Correlation IDs, CloudWatch dashboards, production-ready handoff |

## Project Structure

```
scc-event-platform/
├── apps/web/                    # Angular frontend
├── services/                    # Microservices
│   ├── user-service/
│   ├── event-service/
│   └── registration-service/
├── infra/                       # Infrastructure & DevOps
│   ├── terraform/               # IaC modules
│   ├── k8s/                     # Kubernetes manifests
│   └── lambda/                  # Lambda functions
├── .github/workflows/           # CI/CD pipelines
└── docker-compose.dev.yml       # Local development stack
```

## Getting Started

### Prerequisites
- Node.js 18+, npm/yarn
- Python 3.10+, pip
- PostgreSQL 15+ (or Docker)
- AWS CLI, Git

### Local Development

1. **Clone & install dependencies:**
   ```bash
   git clone <repo-url>
   cd scc-event-platform
   npm install  # Angular deps
   pip install -r services/user-service/requirements.txt  # Each service
   ```

2. **Start local services:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Run Angular dev server:**
   ```bash
   cd apps/web
   ng serve
   ```

4. **Run FastAPI services:**
   ```bash
   cd services/user-service
   uvicorn app.main:app --reload
   ```

Visit `http://localhost:4200` (Angular) and `http://localhost:8000` (API docs).

## Development Practices

- **Clean Architecture** – Repository/Service/Controller layers, dependency injection
- **Database Integrity** – Schema per microservice, transactional consistency, logical referential integrity
- **API Contracts** – OpenAPI/Swagger documentation, versioned endpoints
- **Security** – AWS Secrets Manager for credentials, environment-based configuration, role-based access
- **Testing** – Unit tests, integration tests, end-to-end workflows
- **Infrastructure as Code** – Terraform modules for repeatable, versioned deployments
- **Observability** – Correlation IDs, structured JSON logs, CloudWatch metrics

## Contributing

Contributions are coordinated internally for this training project.

## License

Internal SCC Vietnam Training Project – Educational Use Only

---

**Built with ❤️ for enterprise software excellence.**