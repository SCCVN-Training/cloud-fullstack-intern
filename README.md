# SkillVerse

> **Community Skill Exchange Platform**

A community-driven platform where people exchange skills by teaching and learning from one another using a virtual credit system instead of money.

---

## 📖 Overview

SkillVerse is a full-stack cloud application developed as part of the SCC Cloud Fullstack Internship.

The platform enables users to:

- Create a personal profile
- Offer skills they can teach
- Discover skills they want to learn
- Book learning sessions
- Earn Skill Coins by teaching
- Spend Skill Coins to learn from others

This project follows the Software Development Life Cycle (SDLC) and will be developed incrementally throughout the internship using Agile practices.

---

## 🎯 Objectives 

- Build a modern full-stack web application
- Apply SDLC principles
- Practice Git & GitHub workflows
- Develop using Angular and FastAPI
- Design a PostgreSQL database
- Implement RESTful APIs
- Write unit and integration tests
- Deploy to AWS
- Build CI/CD pipelines with GitHub Actions
- Learn microservices architecture

---

## ❗ Problem Statement

Many people possess valuable skills but have limited opportunities to share them within their communities. At the same time, individuals seeking to learn new skills often face financial barriers or struggle to find trustworthy local mentors.

Traditional learning platforms typically rely on monetary transactions, making knowledge sharing less accessible for people who are willing to exchange skills instead of paying for courses.

SkillVerse addresses this challenge by providing a community-based platform where users can teach others, earn virtual Skill Coins, and use those coins to learn new skills from the community.

---

## 💡 Solution
SkillVerse provides a community-driven platform where users can exchange knowledge through a virtual credit system instead of traditional monetary payments.

The platform enables users to:

- Create a personal profile showcasing their skills and interests
- Offer skills they are willing to teach
- Discover and request skills they want to learn
- Book learning sessions with other community members
- Earn Skill Coins by teaching others
- Spend Skill Coins to learn new skills
- Build trust through ratings and reviews

By rewarding knowledge sharing, SkillVerse encourages continuous learning while making education more accessible and affordable.

---

## 🚀 Vision
To build a collaborative learning community where knowledge is accessible to everyone, empowering people to teach, learn, and grow together through skill exchange rather than financial transactions.

SkillVerse aims to foster lifelong learning by connecting individuals with diverse expertise while promoting collaboration, personal development, and community engagement.

---

## ✨ MVP Features
### User Management

- User registration and authentication
- User profile management

### Skill Marketplace

- Create and manage skill listings
- Browse and search available skills
- View skill details

### Skill Exchange

- Request learning sessions
- Book skill exchange sessions
- Manage upcoming bookings

### Skill Coin System

- Earn Skill Coins by teaching
- Spend Skill Coins when learning
- View wallet balance and transaction history

### Community

- Ratings and reviews
- User learning and teaching history

---

## 🛠️ Technology Stack

### Frontend

- Angular
- TypeScript
- HTML
- CSS

### Backend

- FastAPI
- Python

### Database

- PostgreSQL

### Cloud & DevOps

- AWS
- Docker
- GitHub Actions
- Terraform
- Kubernetes (later stage)

---

## 🏗 High-Level Architecture
```text
                        SkillVerse

                  +------------------+
                  |   Angular Client |
                  +---------+--------+
                            |
                      REST API (HTTPS)
                            |
                  +---------v--------+
                  |  FastAPI Backend |
                  +---------+--------+
                            |
                  +---------v--------+
                  |   PostgreSQL DB  |
                  +---------+--------+
                            |
                  +---------v--------+
                  | AWS Cloud Services|
                  | (S3, Secrets, etc.)|
                  +-------------------+
```

The application follows a layered architecture consisting of:

- **Frontend:** Angular web application for user interaction
- **Backend:** FastAPI REST API handling business logic
- **Database:** PostgreSQL for persistent data storage
- **Cloud:** AWS services for deployment, storage, monitoring, and future scalability

---

## 📂 Project Structure

```
cloud-fullstack-intern/

├── frontend/
├── backend/
├── docs/
    └── images/
├── scripts/
├── infrastructure/
    └── aws/
    └── kubernetes/
    └── terraform/
├── .github/
│   └── workflows/
├── README.md
└── .gitignore
└── CHANGELOG.md    
```

---

## 🌿 Git Workflow
Development follows the internship Git workflow.

```text
main
  │
  └── dev_nhu
        │
        ├── Develop feature
        ├── Commit changes
        ├── Push to GitHub
        ├── Review (if required)
        └── Merge into main
```

### Branch

- **main** – Stable production branch
- **dev_nhu** – Personal development branch

### Commit Convention

The project follows Conventional Commits.

| Prefix | Description |
|---------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `style:` | Formatting changes |
| `refactor:` | Code refactoring |
| `test:` | Add or update tests |
| `chore:` | Maintenance tasks |

Example:

```bash
docs: add initial project README
feat: implement user authentication
test: add unit tests for login service
fix: resolve booking validation issue
```

---

## 📈 Development Status

Current Phase:

- [x] Project Planning
- [ ] Requirements Analysis
- [ ] System Design
- [ ] Development
- [ ] Testing
- [ ] Deployment
- [ ] Maintenance

---

## 📅 Internship Timeline

| Week | Focus |
|------|-------|
| 1 | Planning, Git, Documentation |
| 2 | Angular |
| 3 | FastAPI & PostgreSQL |
| 4 | Backend Development |
| 5 | Integration |
| 6 | AWS |
| 7 | Deployment |
| 8 | Microservices |
| 9 | Terraform & Kubernetes |
| 10 | Monitoring & Presentation |

---

## 👩‍💻 Author

Intern: Nhu Le Nguyen Quynh

Fullstack Cloud Engineer Internship