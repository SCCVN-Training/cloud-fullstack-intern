# Software Requirements Specification (SRS)

**Project Name:** SkillVerse – Community Skill Exchange

**Document Version:** 1.0

**Author:** Nhu Le Nguyen Quynh

**Last Updated:** July 16, 2026

---

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for SkillVerse. It serves as the primary reference for project planning, system design, implementation, testing, and validation throughout the Software Development Life Cycle (SDLC).

## 1.2 Scope

SkillVerse is a cloud-based community platform that enables users to exchange skills through a virtual Skill Coin system. Users can teach skills, learn from others, book learning sessions, and build their reputation through ratings and reviews.

---

# 2. Product Overview

The platform consists of:

* Angular web frontend
* FastAPI REST API
* PostgreSQL database
* AWS cloud infrastructure
* GitHub Actions CI pipeline

The first release focuses on delivering a Minimum Viable Product (MVP) within the internship period.

---

# 3. Functional Requirements

## FR-01 User Registration

Users shall be able to:

* Register with email and password.
* Validate required information.
* Receive confirmation that registration is successful.

---

## FR-02 User Authentication

Users shall be able to:

* Log in.
* Log out.
* Access protected resources after authentication.

---

## FR-03 User Profile

Users shall be able to:

* View their profile.
* Edit personal information.
* Upload a profile picture (optional enhancement).
* View Skill Coin balance.

---

## FR-04 Skill Management

Users shall be able to:

* Create a skill listing.
* Edit a skill listing.
* Delete a skill listing.
* Categorize skills.
* Set skill descriptions and availability.

---

## FR-05 Skill Discovery

Users shall be able to:

* Browse available skills.
* Search by keyword.
* Filter by category.
* View teacher profiles.

---

## FR-06 Booking Management

Users shall be able to:

* Request a learning session.
* Accept or reject booking requests.
* Cancel bookings.
* View booking history.

---

## FR-07 Skill Coin System

The system shall:

* Award Skill Coins after completed teaching sessions.
* Deduct Skill Coins when learning sessions are completed.
* Display wallet balance.
* Record transaction history.

---

## FR-08 Ratings and Reviews

Users shall be able to:

* Rate completed sessions.
* Leave written feedback.
* View teacher ratings.

---

## FR-09 Administration

Administrators shall be able to:

* View users.
* Manage reported content.
* Monitor platform activity.

---

# 4. Non-Functional Requirements

## Performance

* API responses should be delivered within an acceptable time under normal usage.
* The application should support multiple concurrent users appropriate for an internship-scale deployment.

## Security

* Passwords must be securely hashed.
* Protected endpoints require authentication.
* Input data must be validated.
* Sensitive configuration must not be hardcoded.

## Reliability

* Prevent data corruption.
* Handle invalid requests gracefully.
* Maintain database consistency.

## Usability

* Responsive user interface.
* Simple navigation.
* Consistent design.

## Maintainability

* Modular architecture.
* Clear documentation.
* Readable and maintainable code.

## Scalability

The architecture should support future enhancements such as:

* Chat
* Notifications
* Mobile applications
* Microservices

---

# 5. Business Rules

* Every user must register before using protected features.
* A teacher may publish multiple skills.
* A learner may request multiple sessions.
* Skill Coin balances cannot become negative.
* Ratings may only be submitted after completed sessions.
* Deleted users must not invalidate historical booking records.

---

# 6. System Constraints

* Single developer project.
* Development period limited to 10 weeks.
* Angular frontend.
* FastAPI backend.
* PostgreSQL database.
* AWS deployment.
* GitHub Actions for CI.

---

# 7. Assumptions

* Users have internet access.
* Email addresses are unique.
* PostgreSQL is available.
* AWS services are accessible.
* GitHub repository is available.

---

# 8. Use Cases

| ID    | Use Case         |
| ----- | ---------------- |
| UC-01 | Register Account |
| UC-02 | Login            |
| UC-03 | Update Profile   |
| UC-04 | Create Skill     |
| UC-05 | Browse Skills    |
| UC-06 | Search Skills    |
| UC-07 | Request Booking  |
| UC-08 | Accept Booking   |
| UC-09 | Complete Session |
| UC-10 | Leave Review     |

---

# 9. User Stories

### Authentication

* As a new user, I want to register an account so that I can access the platform.
* As a registered user, I want to log in securely so that I can manage my activities.

### Skills

* As a teacher, I want to publish my skills so that others can learn from me.
* As a learner, I want to search available skills so that I can find suitable teachers.

### Booking

* As a learner, I want to request a session so that I can schedule learning with a teacher.
* As a teacher, I want to manage booking requests so that I can organize my availability.

### Reviews

* As a learner, I want to rate completed sessions so that I can help other users choose trustworthy teachers.

---

# 10. Acceptance Criteria

| Requirement    | Acceptance Criteria                                            |
| -------------- | -------------------------------------------------------------- |
| Registration   | User account is created successfully with valid input.         |
| Login          | Authenticated users receive access to protected resources.     |
| Skill Creation | Users can create, edit, and delete their own skill listings.   |
| Search         | Users can search and filter available skills.                  |
| Booking        | Users can create and manage booking requests.                  |
| Wallet         | Skill Coin balances update correctly after completed sessions. |
| Reviews        | Reviews can only be submitted after completed sessions.        |

---

# 11. Requirement Traceability Matrix

| Requirement | User Persona        | Related Module   |
| ----------- | ------------------- | ---------------- |
| FR-01       | Emma, David, Sophia | Authentication   |
| FR-02       | All Users           | Authentication   |
| FR-03       | All Users           | User Profile     |
| FR-04       | David, Sophia       | Skill Management |
| FR-05       | Emma                | Skill Discovery  |
| FR-06       | Emma, David         | Booking          |
| FR-07       | Emma, David, Sophia | Wallet           |
| FR-08       | Emma                | Reviews          |
| FR-09       | Alex                | Administration   |

---

# 12. Summary

This SRS defines the functional scope and quality expectations for SkillVerse. It provides a clear specification for the development team and serves as the foundation for the system architecture, database design, API design, implementation, testing, and deployment activities.
