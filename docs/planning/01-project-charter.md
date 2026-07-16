# Project Charter

**Project Name:** SkillVerse – Community Skill Exchange

**Document Version:** 1.0

**Author:** Nhu Le Nguyen Quynh

**Project Type:** Full-Stack Cloud Web Application

**Methodology:** Agile Software Development Life Cycle (SDLC)

**Duration:** 10 Weeks

**Organization:** SCC Cloud Fullstack Internship

**Document Status:** Draft

**Last Updated:** July 16, 2026

---

# 1. Project Overview

SkillVerse is a cloud-based community platform that enables people to exchange knowledge and practical skills through collaborative learning rather than traditional monetary payment.

Instead of paying for courses, users can teach skills they possess to earn virtual **Skill Coins**, which can then be exchanged for learning opportunities offered by other community members.

The project is developed as part of the SCC Cloud Fullstack Internship to demonstrate the complete software development life cycle, from project planning and system design to implementation, testing, cloud deployment, and monitoring.

---

# 2. Background

Learning new skills has become increasingly important for students, professionals, and lifelong learners. However, many existing learning platforms focus primarily on paid courses, subscriptions, or one-way knowledge delivery.

At the same time, many individuals possess valuable practical skills—including programming, cooking, photography, language learning, music, design, and fitness—but have limited opportunities to share their knowledge within their communities.

SkillVerse addresses this gap by encouraging peer-to-peer learning through a virtual credit system that rewards community participation rather than financial transactions.

---

# 3. Business Problem

Current learning platforms present several challenges:

* Learning opportunities often require monetary payment.
* Individuals with valuable skills have limited opportunities to teach locally.
* Knowledge sharing within communities is fragmented.
* Informal learning exchanges are difficult to organize and manage.
* There is no simple platform that rewards teaching through a non-monetary exchange model.

---

# 4. Proposed Solution

SkillVerse provides a centralized web platform where users can:

* Create personal profiles.
* Offer skills they are willing to teach.
* Search for skills they wish to learn.
* Request and manage learning sessions.
* Earn Skill Coins by teaching others.
* Spend Skill Coins to learn from the community.
* Build trust through ratings and reviews.

The platform promotes collaborative learning while encouraging active community participation.

---

# 5. Project Objectives

The project aims to:

* Develop a modern full-stack web application using Angular and FastAPI.
* Apply Agile SDLC principles throughout development.
* Design and implement a relational PostgreSQL database (hosted on Neon).
* Build secure RESTful APIs.
* Deploy the application to AWS cloud services.
* Implement Continuous Integration using GitHub Actions.
* Practice professional Git workflows and version control.
* Produce maintainable code supported by technical documentation.
* Deliver a functional Minimum Viable Product (MVP) within the internship timeline.

---

# 6. Project Scope

## In Scope

The first release (MVP) will include:

* User registration and authentication
* User profile management
* Skill creation and management
* Browse and search skills
* Session booking requests
* Skill Coin wallet and balance
* Ratings and reviews
* Responsive web interface
* RESTful backend services
* PostgreSQL database
* AWS deployment
* CI pipeline using GitHub Actions

## Out of Scope

The following features are intentionally excluded from Version 1.0:

* Mobile application
* Video conferencing
* Real-time chat
* Payment gateway integration
* AI recommendations
* Push notifications
* Multi-language support
* Social media integration

These may be considered in future versions after the MVP is completed.

---

# 7. Deliverables

The project will deliver:

* Project documentation
* Angular frontend application
* FastAPI backend application
* PostgreSQL database hosted on Neon
* RESTful API
* Unit and integration tests
* GitHub Actions workflow
* Docker configuration
* AWS cloud deployment
* Final project presentation

---

# 8. Technology Stack

| Layer             | Technology                        |
| ----------------- | --------------------------------- |
| Frontend          | Angular, TypeScript, HTML, SCSS   |
| Backend           | FastAPI, Python                   |
| Database          | PostgreSQL (on Neon)                        |
| ORM               | SQLAlchemy                        |
| API Documentation | OpenAPI (Swagger)                 |
| Testing           | Pytest, Angular Testing Framework |
| Version Control   | Git & GitHub                      |
| CI/CD             | GitHub Actions                    |
| Containerization  | Docker                            |
| Cloud Platform    | AWS                               |
| Infrastructure    | Terraform (later phase)           |
| Orchestration     | Kubernetes (later phase)          |

---

# 9. Assumptions

The project assumes that:

* The internship follows the planned 10-week schedule.
* Required development tools are available.
* AWS services are accessible for deployment.
* PostgreSQL is available for development.
* GitHub Actions can be used for Continuous Integration.
* The project will be developed by a single developer.

---

# 10. Constraints

| Constraint     | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| Time           | Development must be completed within 10 weeks.                              |
| Team Size      | Single developer project.                                                   |
| Learning Curve | New technologies must be learned while developing.                          |
| Resources      | Cloud usage should remain within free or educational limits where possible. |
| Scope          | Only the MVP is guaranteed for completion.                                  |

---

# 11. Success Criteria

The project will be considered successful when:

* Users can register and authenticate successfully.
* Users can create and manage skill listings.
* Users can browse and search available skills.
* Users can request learning sessions.
* Skill Coin transactions function correctly.
* Unit tests pass for core functionality.
* The application is deployed successfully to AWS.
* Technical documentation is complete and up to date.
* The project is demonstrated successfully at the end of the internship.

---

# 12. Project Milestones

| Week    | Milestone                                               |
| ------- | ------------------------------------------------------- |
| Week 1  | Planning, repository setup, Git workflow, documentation |
| Week 2  | Angular application and frontend foundation             |
| Week 3  | FastAPI backend and PostgreSQL integration              |
| Week 4  | Core business features                                  |
| Week 5  | Frontend and backend integration                        |
| Week 6  | AWS services and cloud configuration                    |
| Week 7  | Cloud deployment and testing                            |
| Week 8  | Feature completion and refinements                      |
| Week 9  | Infrastructure automation and monitoring                |
| Week 10 | Final testing, documentation, and project presentation  |

---

# 13. Definition of Success

SkillVerse will be considered a successful internship project if it:

* Demonstrates the complete Software Development Life Cycle.
* Implements a functional and deployable MVP.
* Applies modern software engineering practices.
* Follows clean architecture and maintainable coding standards.
* Serves as a professional portfolio project that showcases full-stack cloud engineering skills.
