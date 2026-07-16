# Product Backlog

**Project Name:** SkillVerse – Community Skill Exchange

**Document Version:** 1.0

**Author:** Nhu Le Nguyen Quynh

**Last Updated:** July 16, 2026

---

# 1. Introduction

This Product Backlog defines the implementation work required to deliver the SkillVerse Minimum Viable Product (MVP). The backlog is organized into Epics, User Stories, priorities, and acceptance criteria.

The backlog is a living document and may be updated throughout the Software Development Life Cycle (SDLC).

---

# 2. Prioritization Method

The backlog uses the following priority levels:

| Priority | Description                                          |
| -------- | ---------------------------------------------------- |
| High     | Required for MVP                                     |
| Medium   | Important but can be implemented after core features |
| Low      | Future enhancement                                   |

---

# 3. Product Epics

| Epic ID | Epic                 | Description                       |
| ------- | -------------------- | --------------------------------- |
| EP-01   | Authentication       | User registration and login       |
| EP-02   | User Management      | User profile management           |
| EP-03   | Skill Management     | Create and manage skill listings  |
| EP-04   | Skill Discovery      | Browse and search skills          |
| EP-05   | Booking Management   | Book and manage learning sessions |
| EP-06   | Wallet & Skill Coins | Manage virtual currency           |
| EP-07   | Reviews              | Ratings and feedback              |
| EP-08   | Administration       | Basic platform administration     |
| EP-09   | DevOps               | CI/CD and deployment              |

---

# 4. User Stories

## EP-01 Authentication

| ID    | User Story                                                     | Priority |
| ----- | -------------------------------------------------------------- | -------- |
| US-01 | As a visitor, I want to register so that I can use SkillVerse. | High     |
| US-02 | As a registered user, I want to log in securely.               | High     |
| US-03 | As a user, I want to log out safely.                           | High     |

---

## EP-02 User Management

| ID    | User Story                                     | Priority |
| ----- | ---------------------------------------------- | -------- |
| US-04 | As a user, I want to view my profile.          | High     |
| US-05 | As a user, I want to edit my profile.          | High     |
| US-06 | As a user, I want to upload a profile picture. | Medium   |

---

## EP-03 Skill Management

| ID    | User Story                                       | Priority |
| ----- | ------------------------------------------------ | -------- |
| US-07 | As a teacher, I want to create a skill listing.  | High     |
| US-08 | As a teacher, I want to update my skill listing. | High     |
| US-09 | As a teacher, I want to delete my skill listing. | High     |

---

## EP-04 Skill Discovery

| ID    | User Story                                         | Priority |
| ----- | -------------------------------------------------- | -------- |
| US-10 | As a learner, I want to browse available skills.   | High     |
| US-11 | As a learner, I want to search skills by keyword.  | High     |
| US-12 | As a learner, I want to filter skills by category. | Medium   |

---

## EP-05 Booking Management

| ID    | User Story                                         | Priority |
| ----- | -------------------------------------------------- | -------- |
| US-13 | As a learner, I want to request a booking.         | High     |
| US-14 | As a teacher, I want to accept or reject bookings. | High     |
| US-15 | As a learner, I want to cancel a booking.          | Medium   |
| US-16 | As a user, I want to view my booking history.      | Medium   |

---

## EP-06 Wallet & Skill Coins

| ID    | User Story                                        | Priority |
| ----- | ------------------------------------------------- | -------- |
| US-17 | As a user, I want to view my Skill Coin balance.  | High     |
| US-18 | As a user, I want to view my transaction history. | Medium   |

---

## EP-07 Reviews

| ID    | User Story                                         | Priority |
| ----- | -------------------------------------------------- | -------- |
| US-19 | As a learner, I want to review completed sessions. | Medium   |
| US-20 | As a learner, I want to view teacher reviews.      | Medium   |

---

## EP-08 Administration

| ID    | User Story                                                     | Priority |
| ----- | -------------------------------------------------------------- | -------- |
| US-21 | As an administrator, I want to manage users.                   | Low      |
| US-22 | As an administrator, I want to moderate inappropriate content. | Low      |

---

## EP-09 DevOps

| ID    | User Story                                                    | Priority |
| ----- | ------------------------------------------------------------- | -------- |
| US-23 | As a developer, I want automated CI using GitHub Actions.     | High     |
| US-24 | As a developer, I want cloud deployment on AWS.               | High     |
| US-25 | As a developer, I want infrastructure managed with Terraform. | Medium   |

---

# 5. MVP Scope

The following features are included in the MVP:

* User registration and login
* User profile management
* Skill CRUD
* Skill browsing and searching
* Booking management
* Skill Coin wallet
* Reviews
* CI pipeline
* AWS deployment

Features excluded from the MVP:

* Real-time chat
* Notifications
* Recommendation engine
* Mobile application
* Social login
* Gamification

---

# 6. Definition of Done (DoD)

A backlog item is considered complete when:

* Requirements are implemented.
* Code follows project standards.
* Unit tests pass.
* Code is reviewed (if applicable).
* API documentation is updated.
* No critical defects remain.

---

# 7. Backlog Traceability

| Epic               | Related Documents                |
| ------------------ | -------------------------------- |
| Authentication     | SRS, API Design, Database Design |
| User Management    | SRS, API Design, Database Design |
| Skill Management   | SRS, API Design, Database Design |
| Booking Management | SRS, API Design, Database Design |
| Wallet             | SRS, Database Design             |
| Reviews            | SRS, API Design                  |

---

# 8. Product Backlog Summary

| Epic                 | User Stories |
| -------------------- | -----------: |
| Authentication       |            3 |
| User Management      |            3 |
| Skill Management     |            3 |
| Skill Discovery      |            3 |
| Booking Management   |            4 |
| Wallet & Skill Coins |            2 |
| Reviews              |            2 |
| Administration       |            2 |
| DevOps               |            3 |

**Total Epics:** 9

**Total User Stories:** 25

---

# 9. Future Backlog

Potential backlog items for future releases include:

* Real-time messaging
* Push notifications
* Skill recommendations
* Favorite skills
* Achievement badges
* Learning paths
* Video session integration
* AI-powered skill matching

---

# 10. Summary

This Product Backlog provides the implementation roadmap for the SkillVerse MVP. It organizes the project's functional requirements into prioritized Epics and User Stories, ensuring development remains aligned with the project objectives and the 10-week internship schedule.
