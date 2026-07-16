# API Design

**Project Name:** SkillVerse – Community Skill Exchange

**Document Version:** 1.0

**Author:** Nhu Le Nguyen Quynh

**Last Updated:** July 16, 2026

---

# 1. Introduction

This document defines the RESTful API specification for SkillVerse. It describes the available endpoints, request methods, authentication requirements, request and response formats, HTTP status codes, and error handling conventions.

The API follows REST principles and serves as the communication layer between the Angular frontend and the FastAPI backend.

---

# 2. API Overview

## Base URL

Development:

```
http://localhost:8000/api/v1
```

Production:

```
https://api.skillverse.com/api/v1
```

---

## Data Format

All requests and responses use JSON.

Example for SUCCESS:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Example for ERROR:
```json
{
    "success": false,
    "error": {
        "code": 404,
        "message": "Skill not found"
    }
}
```

---

# Authentication

Protected endpoints require JWT authentication.

Header:

```
Authorization: Bearer <access_token>
```

---

# Authorization

SkillVerse uses Role-Based Access Control (RBAC).

• User

• Administrator

---

| Endpoint            | User       | Admin |
| ------------------- | ---------- | ----- |
| GET /skills         | ✅          | ✅     |
| POST /skills        | ✅          | ✅     |
| PUT /skills/{id}    | Owner only | ✅     |
| DELETE /skills/{id} | Owner only | ✅     |
| GET /wallet         | Owner only | ✅     |

---

# 3. API Modules

| Module         | Description                |
| -------------- | -------------------------- |
| Authentication | Register, login, logout    |
| Users          | User profile management    |
| Skills         | Skill CRUD operations      |
| Bookings       | Session booking management |
| Wallet         | Skill Coin balance         |
| Transactions   | Wallet history             |
| Reviews        | Ratings and comments       |

---

# 4. Authentication API

## Register

```
POST /auth/register
```

### Request

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Response

```
201 Created
```

---

## Login

```
POST /auth/login
```

### Request

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Success

```
200 OK
```

Returns:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

---

## Logout

```
POST /auth/logout
```

Authentication required.

---

# 5. User API

## Get Profile

```
GET /users/me
```

---

## Update Profile

```
PUT /users/me
```

---

## Upload Avatar

```
POST /users/avatar
```

(Optional enhancement)

---

# 6. Skill API

## List Skills

```
GET /skills
```

Supports:

* search
* category
* pagination

---

## Get Skill

```
GET /skills/{id}
```

---

## Create Skill

```
POST /skills
```

---

## Update Skill

```
PUT /skills/{id}
```

---

## Delete Skill

```
DELETE /skills/{id}
```

---

# 7. Booking API

## Create Booking

```
POST /bookings
```

---

## List My Bookings

```
GET /bookings
```

---

## Get Booking

```
GET /bookings/{id}
```

---

## Update Booking Status

```
PATCH /bookings/{id}/status
```

Supported statuses:

| Status    | Performed by       |
| --------- | ------------------ |
| Pending   |                    |
| Accepted  | Teacher            |
| Rejected  | Teacher            |
| Cancelled | Learner or Teacher |
| Completed | System or Teacher  |

---

# 8. Wallet API

## View Wallet

```
GET /users/me/wallet
```

---

# 9. Transaction API

## List Transaction
GET /wallet/transactions

## Get Transaction
GET /wallet/transactions/{id}

---

# 10. Review API

## Create Review

```
POST /reviews
```

---

## View Reviews

```
GET /skills/{id}/reviews
```

---

# 11. HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | OK                    |
| 201  | Created               |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Validation Error      |
| 500  | Internal Server Error |

---

# 12. Error Response Format

All errors follow a consistent JSON structure.

Example:

```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Skill not found"
  }
}
```

---

# 13. API Versioning

The API uses URL-based versioning.

Example:

```
/api/v1
```

Future versions may introduce:

```
/api/v2
```

without breaking existing clients.

---

# 14. Security Considerations

* JWT authentication for protected endpoints.
* Password hashing using secure algorithms.
* Input validation with Pydantic.
* Authorization checks to prevent unauthorized resource access.
* HTTPS required in production.

---

# 15. API Design Principles

The SkillVerse API follows these principles:

* RESTful resource naming.
* Stateless communication.
* Consistent JSON responses.
* Proper use of HTTP methods.
* Meaningful HTTP status codes.
* Clear separation of resources.
* Versioned endpoints.

---

# 16. API Summary

| Module         | Endpoints |
| -------------- | --------- |
| Authentication | 3         |
| Users          | 3         |
| Skills         | 5         |
| Bookings       | 4         |
| Wallet         | 2         |
| Reviews        | 2         |

**Total Planned Endpoints (MVP): 19**
