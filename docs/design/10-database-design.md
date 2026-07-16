# Database Design

**Project Name:** SkillVerse – Community Skill Exchange

**Document Version:** 1.0

**Author:** Nhu Le Nguyen Quynh

**Last Updated:** July 16, 2026

---

# 1. Introduction

This document describes the logical database design for SkillVerse. It defines the core entities, relationships, attributes, and constraints required to support the application's business processes.

The database is implemented using PostgreSQL and accessed through SQLAlchemy ORM in the FastAPI backend.

---

# 2. Database Objectives

The database is designed to:

* Store application data securely and consistently.
* Support the core business processes of SkillVerse.
* Minimize data redundancy through normalization.
* Maintain referential integrity.
* Provide a scalable foundation for future enhancements.

---

# 3. Database Technology

| Item           | Technology          |
| -------------- | ------------------- |
| Database       | PostgreSQL          |
| ORM            | SQLAlchemy          |
| Migration Tool | Alembic             |
| Data Format    | Relational Database |

---

# 4. Core Entities

The MVP consists of the following primary entities:

| Entity      | Purpose                                             |
| ----------- | --------------------------------------------------- |
| User        | Store user accounts and profile information         |
| Skill       | Store skills offered by users                       |
| Booking     | Manage learning session requests                    |
| Wallet      | Store each user's Skill Coin balance                |
| Transaction | Record Skill Coin transfers                         |
| Review      | Store ratings and feedback after completed sessions |

---

# 5. Entity Relationship Overview

```text
+---------+
|  User   |
+---------+
     |
     | 1
     |
     | *
+---------+
|  Skill  |
+---------+

User
  |
  |1
  |
  |*
Booking
  |
  |*
  |
  |1
Skill

User
  |
  |1
  |
Wallet

Wallet
  |
  |1
  |
  |*
Transaction

Booking
  |
  |1
  |
Review
```

---

# 6. Entity Definitions

## 6.1 User

Represents registered users of the platform.

| Field         | Type         | Constraints |
| ------------- | ------------ | ----------- |
| id            | UUID         | Primary Key |
| full_name     | VARCHAR(100) | Required    |
| email         | VARCHAR(255) | Unique      |
| password_hash | TEXT         | Required    |
| bio           | TEXT         | Optional    |
| avatar_url    | TEXT         | Optional    |
| created_at    | TIMESTAMP    | Required    |
| updated_at    | TIMESTAMP    | Required    |

---

## 6.2 Skill

Represents a skill that a user is willing to teach.

| Field        | Type         | Constraints        |
| ------------ | ------------ | ------------------ |
| id           | UUID         | Primary Key        |
| user_id      | UUID         | Foreign Key → User |
| title        | VARCHAR(150) | Required           |
| category     | VARCHAR(100) | Required           |
| description  | TEXT         | Required           |
| availability | TEXT         | Optional           |
| created_at   | TIMESTAMP    | Required           |
| updated_at   | TIMESTAMP    | Required           |

---

## 6.3 Booking

Represents a learning session request.

| Field        | Type      | Constraints                                           |
| ------------ | --------- | ----------------------------------------------------- |
| id           | UUID      | Primary Key                                           |
| learner_id   | UUID      | Foreign Key → User                                    |
| skill_id     | UUID      | Foreign Key → Skill                                   |
| booking_date | TIMESTAMP | Required                                              |
| status       | ENUM      | Pending / Accepted / Rejected / Completed / Cancelled |
| created_at   | TIMESTAMP | Required                                              |
| updated_at   | TIMESTAMP    | Required           |

---

## 6.4 Wallet

Stores each user's Skill Coin balance.

| Field      | Type      | Constraints        |
| ---------- | --------- | ------------------ |
| id         | UUID      | Primary Key        |
| user_id    | UUID      | Foreign Key → User |
| balance    | INTEGER   | Default 0          |
| updated_at | TIMESTAMP | Required           |

---

## 6.5 Transaction

Stores every Skill Coin transaction.

| Field            | Type      | Constraints          |
| ---------------- | --------- | -------------------- |
| id               | UUID      | Primary Key          |
| wallet_id        | UUID      | Foreign Key → Wallet |
| amount           | INTEGER   | Required             |
| transaction_type | ENUM      | Earn / Spend         |
| description      | TEXT      | Optional             |
| created_at       | TIMESTAMP | Required             |

---

## 6.6 Review

Represents feedback for completed learning sessions.

| Field      | Type      | Constraints           |
| ---------- | --------- | --------------------- |
| id         | UUID      | Primary Key           |
| booking_id | UUID      | Foreign Key → Booking |
| rating     | INTEGER   | Range 1–5             |
| comment    | TEXT      | Optional              |
| created_at | TIMESTAMP | Required              |

---

# 7. Relationships

| Parent  | Relationship | Child                |
| ------- | ------------ | -------------------- |
| User    | 1 → Many     | Skill                |
| User    | 1 → One      | Wallet               |
| User    | 1 → Many     | Booking (as learner) |
| Skill   | 1 → Many     | Booking              |
| Wallet  | 1 → Many     | Transaction          |
| Booking | 1 → One      | Review               |

---

# 8. Business Rules

* Every user has exactly one wallet.
* A user can teach multiple skills.
* A skill can receive multiple booking requests.
* Skill Coin balances cannot become negative.
* Reviews are only allowed after a booking is completed.
* Email addresses must be unique.
* Deleted users must not remove historical booking records.

---

# 9. Normalization

The database is designed to satisfy the Third Normal Form (3NF):

* Each table represents a single entity.
* No repeating groups are stored.
* Non-key attributes depend only on the primary key.
* Data redundancy is minimized through foreign key relationships.

---

# 10. Indexing Strategy

Indexes should be created on:

* email
* category
* learner_id
* user_id
* skill_id
* booking_date

These indexes improve authentication, searching, and booking performance.

---

# 11. Future Enhancements

Future versions of SkillVerse may introduce additional entities such as:

* Message
* Notification
* Skill Category
* Session History
* Achievement
* Badge
* Report
* Favorite Skill
* Learning Path

The current database structure is designed to accommodate these enhancements with minimal disruption.

---

# 12. Summary

The SkillVerse database design provides a normalized and scalable relational model that supports the MVP features while maintaining data integrity and extensibility.

The defined entities and relationships serve as the foundation for SQLAlchemy models, REST APIs, business logic, and future cloud deployment.
