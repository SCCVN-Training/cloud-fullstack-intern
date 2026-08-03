# Relational vs NoSQL — PostgreSQL vs MongoDB for SkillVerse

## The core distinction

- **Relational (PostgreSQL):** data lives in fixed-schema tables with typed columns. Relationships between tables (e.g. a user _has many_ enrollments) are expressed with foreign keys, and the database itself enforces constraints like "this email must be unique" or "this column cannot be null."
- **NoSQL / document (MongoDB):** data lives as flexible, often nested JSON-like documents. There's no enforced schema by default — two documents in the same collection can have different fields. Relationships are usually either embedded (nested inside the parent document) or manually referenced (an id field the application code resolves).

## Why this matters for SkillVerse specifically

SkillVerse's core entities — users, skills/courses, enrollments, progress records — are **highly relational**:

- A user can enroll in many skills; a skill can have many enrolled users (many-to-many)
- Progress records reference both a user and a skill
- We need strong guarantees like "you can't create a progress record for a user that doesn't exist" and "an email must be unique across the whole users table"

That's exactly the kind of guarantee a relational database enforces automatically (via foreign keys and unique constraints), and exactly the kind of guarantee you'd have to hand-roll in application code with MongoDB.

## Comparison table

|                                 | PostgreSQL (relational)                                                                 | MongoDB (document/NoSQL)                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema                          | Fixed, enforced by the database                                                         | Flexible, enforced (if at all) by application code                                                                                           |
| Relationships                   | Native (foreign keys, joins)                                                            | Manual (embedding or app-level reference resolution)                                                                                         |
| Data integrity                  | Strong — unique constraints, NOT NULL, foreign key constraints                          | Weaker by default — most integrity checks live in app code                                                                                   |
| Best fit                        | Structured data with clear relationships: users, orders, enrollments, financial records | Unstructured/semi-structured data, rapidly changing shapes: logs, activity feeds, product catalogs with wildly different attributes per item |
| Query language                  | SQL — powerful joins/aggregations across tables                                         | Query API on individual documents/collections — joins (`$lookup`) are possible but less natural                                              |
| Scaling pattern                 | Vertical scaling is typical; horizontal (sharding) is possible but more involved        | Built with horizontal sharding as a first-class feature                                                                                      |
| Learning curve for this project | Matches what we already need (typed models, relationships)                              | Would require re-modeling relational data as documents                                                                                       |

## Decision for this project

**PostgreSQL**, because:

1. Our data (users, skills, enrollments) is inherently relational — we want the database itself, not just our Python code, enforcing things like unique emails and valid foreign keys.
2. We get free, automatic validation of data shape at the DB layer, on top of what Pydantic already validates at the API layer — defense in depth.
3. Standard SQL joins will make skills/enrollment/progress queries ("show me all skills a user is enrolled in") much simpler than the equivalent MongoDB aggregation pipeline.

**Where MongoDB would have been the better call:** if SkillVerse needed to store, say, arbitrary/variable lesson content blocks (video, quiz, text, code sandbox — all with wildly different fields) or high-volume activity/analytics logs where schema flexibility and write throughput matter more than relational integrity. That's a realistic future extension (e.g. a "content blocks" or "activity log" service) worth keeping in mind for the microservice design in week 5 — it doesn't have to be a single database for the whole system.
