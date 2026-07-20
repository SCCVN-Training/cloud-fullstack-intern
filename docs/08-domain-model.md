# Domain Model Specification

**Project:** Syncra – Corporate Internal Knowledge Sharing Platform

**Version:** 1.0

**Status:** Draft

---

# Table of Contents

1. Purpose
2. Domain Overview
3. Ubiquitous Language
4. Context Diagram
5. Core Domain Model
6. Entity Catalogue
7. Relationship Catalogue
8. Aggregate Boundaries
9. Business Invariants
10. Domain Events
11. Future Evolution
12. Traceability to PRD

---

# 1. Purpose

This document describes the core business domain of Syncra.

It serves as the bridge between business requirements and technical implementation.

Unlike the database schema, the Domain Model focuses on business concepts rather than implementation details.

Every database table, REST API, Angular page, and microservice should ultimately be derived from this model.

---

# 2. Domain Overview

Syncra is an internal corporate platform for planning, organizing, delivering, and tracking knowledge-sharing events.

The platform enables organizers to create workshops while allowing employees to discover, register for, attend, and review internal learning sessions.

The system also manages meeting rooms, attendance, learning materials, and notifications.

---

# 3. Ubiquitous Language

The following business terms should be used consistently throughout documentation and implementation.

| Term | Meaning |
|------|---------|
| Employee | A company member using the platform |
| Organizer | An employee authorized to create and manage events |
| Knowledge Event | An internal workshop, seminar, training session, or technical sharing |
| Speaker | An employee assigned to present during a specific event |
| Participant | An employee registered for an event |
| Registration | A participant's enrollment in an event |
| Attendance | A participant's attendance record |
| Meeting Room | A physical location where an event takes place |
| Learning Material | Documents associated with an event |
| Department | Organizational unit within the company |
| Notification | A system message sent to employees |

---

# 4. Context Diagram

The Context Diagram illustrates the primary actors interacting with Syncra.

```text
                       +----------------------+
                       |     Organizer        |
                       +----------+-----------+
                                  |
                                  |
                                  v
+-------------+          +-----------------------+
|  Employee   +--------->|       Syncra          |
+------+------+\         |                       |
       ^        \        |  Knowledge Sharing    |
       |         \------>|      Platform         |
       |                 |                       |
       |                 +-----------+-----------+
       |                             |
       |                             |
       |                             v
+------+-------+           +----------------------+
| Assigned     |           | Corporate Services   |
| Speaker      |           |                      |
| (Employee)   |           | Email / Storage      |
+--------------+           | Authentication       |
                           +----------------------+
```

---

# 5. Core Domain Model

```text
                              Organization
                                    │
                        has many Departments
                                    │
                                    ▼
                              Department
                                    │
                         has many Employees
                                    │
                                    ▼
                              Employee
                     ┌──────────┼────────────┐
                     │          │            │
             organizes      registers    assigned as
                     │          │            │
                     ▼          ▼            ▼
                    Knowledge Event
              ┌─────────┼────────────┬──────────────┐
              │         │            │              │
              ▼         ▼            ▼              ▼
        Meeting Room Registration Attendance Learning Material
              │
              ▼
       Notification
```

---

# 6. Entity Catalogue

---

## Organization

Represents the company using Syncra.

Responsibilities

- Owns departments
- Defines organizational context

Relationships

- Has many Departments

---

## Department

Represents an organizational unit.

Examples

- Engineering
- HR
- Finance
- QA

Responsibilities

- Groups employees
- Organizes events

Relationships

- Belongs to Organization
- Has many Employees
- May organize many Events

---

## Employee

Represents a company employee.

Responsibilities

- Browse events
- Register
- Attend
- Download materials

An Employee may also become

- Organizer
- Speaker

depending on business context.

Relationships

- Belongs to Department
- Creates Events (if Organizer)
- Registers for Events
- May present Events

---

## Knowledge Event

The central business entity.

Represents

- Workshop
- Seminar
- Technical Sharing
- Training Session

Responsibilities

- Manage registrations
- Reserve rooms
- Track attendance
- Store learning materials

Relationships

- Created by Organizer
- Uses one Meeting Room
- Has many Registrations
- Has many Attendance Records
- Has many Learning Materials
- Has many Speakers

---

## Meeting Room

Represents a physical meeting room.

Responsibilities

- Host events
- Define capacity
- Define equipment

Relationships

- Hosts many Events over time

---

## Registration

Represents an employee enrolling in an event.

Responsibilities

- Reserve participant seat
- Maintain registration status

Relationships

- Belongs to Employee
- Belongs to Event

---

## Attendance

Represents participation in an event.

Possible states

- Present
- Absent
- Excused

Relationships

- Belongs to Registration

---

## Learning Material

Represents downloadable content.

Examples

- Slides
- PDF
- Source Code
- Recording Link

Relationships

- Belongs to Event

---

## Notification

Represents a communication sent by the platform.

Examples

- Registration Confirmation
- Reminder
- Cancellation
- Waitlist Promotion

Relationships

- References Employee
- References Event

---

# 7. Relationship Catalogue

| Source | Relationship | Target | Cardinality |
|---------|--------------|---------|-------------|
| Organization | contains | Department | 1:N |
| Department | employs | Employee | 1:N |
| Organizer (Employee) | creates | Knowledge Event | 1:N |
| Knowledge Event | uses | Meeting Room | N:1 |
| Employee | registers for | Knowledge Event | M:N (via Registration) |
| Knowledge Event | has | Registration | 1:N |
| Registration | results in | Attendance | 1:0..1 |
| Knowledge Event | contains | Learning Material | 1:N |
| Knowledge Event | has | Speaker Assignment | 1:N |
| Speaker Assignment | references | Employee | N:1 |
| Notification | targets | Employee | N:1 |

---

# 8. Aggregate Boundaries

Aggregates define consistency boundaries within the domain.

---

## Knowledge Event Aggregate (Primary Aggregate)

Root Entity

Knowledge Event

Owns

- Registration
- Attendance
- Learning Material
- Speaker Assignment

Business Rule

All changes related to an event should pass through the Knowledge Event aggregate.

---

## Employee Aggregate

Root Entity

Employee

Owns

- Profile Information

References

- Department
- Registrations
- Speaker Assignments

---

## Meeting Room Aggregate

Root Entity

Meeting Room

Owns

- Capacity
- Equipment

Referenced by

Knowledge Event

---

# 9. Business Invariants

The following rules must always hold true.

---

BI-001

An event must have exactly one meeting room.

---

BI-002

An event cannot exceed room capacity.

---

BI-003

An employee cannot register twice for the same event.

---

BI-004

A meeting room cannot host overlapping events.

---

BI-005

Every registration belongs to one employee and one event.

---

BI-006

Attendance cannot exist without a registration.

---

BI-007

Learning materials belong to exactly one event.

---

BI-008

Only organizers may create or publish events.

---

BI-009

Only registered employees may download learning materials.

---

BI-010

Archived events are read-only.

---

# 10. Domain Events

Domain Events represent significant business occurrences.

Examples

- EventCreated
- EventUpdated
- EventPublished
- RegistrationOpened
- RegistrationClosed
- EmployeeRegistered
- RegistrationCancelled
- WaitlistPromoted
- AttendanceRecorded
- LearningMaterialUploaded
- EventCompleted
- EventArchived

These events are business concepts and should not be confused with UI events or framework events.

---

# 11. Future Domain Evolution

Potential future additions include:

- Knowledge Programs
- Learning Paths
- Certifications
- Event Feedback
- Calendar Integration
- Microsoft Teams Integration
- AI Recommendations
- Multi-organization Support

These are intentionally excluded from the MVP to maintain focus.

---

# 12. Traceability to PRD

| Domain Entity | Related Functional Requirements |
|---------------|---------------------------------|
| Employee | FR-001 to FR-004 |
| Knowledge Event | FR-005 to FR-015 |
| Registration | FR-020 to FR-025 |
| Attendance | FR-026 to FR-028 |
| Learning Material | FR-029 to FR-031 |
| Notification | FR-032 to FR-036 |
| Meeting Room | FR-011 to FR-015 |