# Risk Management

**Project Name:** SkillVerse – Community Skill Exchange

**Document Version:** 1.0

**Author:** Nhu Le Nguyen Quynh

**Last Updated:** July 16, 2026

---

# 1. Introduction

This Risk Management document identifies potential risks that may affect the successful delivery of the SkillVerse project during the 10-week internship. It defines the approach for identifying, assessing, monitoring, and mitigating risks throughout the Software Development Life Cycle (SDLC).

The objective is to minimize the impact of uncertainties and improve the likelihood of delivering a functional Minimum Viable Product (MVP) on schedule.

---

# 2. Risk Management Objectives

The objectives of risk management are to:

* Identify potential project risks as early as possible.
* Evaluate the likelihood and impact of each risk.
* Define appropriate mitigation and contingency plans.
* Monitor risks throughout the project lifecycle.
* Support informed decision-making during development.

---

# 3. Risk Assessment Criteria

## Probability

| Level  | Description                  |
| ------ | ---------------------------- |
| Low    | Unlikely to occur            |
| Medium | May occur during the project |
| High   | Very likely to occur         |

---

## Impact

| Level  | Description                                       |
| ------ | ------------------------------------------------- |
| Low    | Minimal effect on project progress                |
| Medium | Moderate delay or reduced functionality           |
| High   | Significant impact on schedule, quality, or scope |

---

## Risk Priority Matrix

| Probability | Low Impact | Medium Impact | High Impact |
| ----------- | ---------- | ------------- | ----------- |
| **High**    | Medium     | High          | Critical    |
| **Medium**  | Low        | Medium        | High        |
| **Low**     | Low        | Low           | Medium      |

---

# 4. Risk Register

| ID   | Risk                                                                | Category       | Probability | Impact | Priority | Mitigation Strategy                                                                                                 |
| ---- | ------------------------------------------------------------------- | -------------- | ----------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------- |
| R-01 | Learning curve for Angular, FastAPI, AWS, Terraform, and Kubernetes | Technical      | High        | High   | Critical | Allocate additional study time, follow official documentation, build small practice examples before implementation. |
| R-02 | Project scope exceeds available internship time                     | Project        | High        | High   | Critical | Focus on MVP features and postpone non-essential enhancements.                                                      |
| R-03 | Integration issues between frontend and backend                     | Technical      | Medium      | High   | High     | Define API contracts early and perform incremental integration testing.                                             |
| R-04 | Database design requires significant changes during development     | Technical      | Medium      | Medium | Medium   | Review requirements carefully and normalize the database before implementation.                                     |
| R-05 | AWS deployment or configuration issues                              | Infrastructure | Medium      | High   | High     | Test deployments in stages and document deployment procedures.                                                      |
| R-06 | CI/CD pipeline failures                                             | DevOps         | Medium      | Medium | Medium   | Validate GitHub Actions workflows incrementally and use separate testing branches when appropriate.                 |
| R-07 | Data loss during development                                        | Operational    | Low         | High   | Medium   | Use Git version control, regular commits, and database backups.                                                     |
| R-08 | Unexpected software bugs                                            | Quality        | High        | Medium | High     | Apply unit testing, integration testing, debugging, and code reviews.                                               |
| R-09 | Schedule delays due to unfamiliar technologies                      | Schedule       | High        | Medium | High     | Maintain weekly milestones and adjust priorities when necessary.                                                    |
| R-10 | Security vulnerabilities (authentication or authorization flaws)    | Security       | Medium      | High   | High     | Implement JWT authentication, password hashing, input validation, and authorization checks.                         |

---

# 5. Risk Response Strategies

| Strategy | Description                                                      |
| -------- | ---------------------------------------------------------------- |
| Avoid    | Change the project approach to eliminate the risk.               |
| Mitigate | Reduce the probability or impact of the risk.                    |
| Transfer | Shift responsibility to a third party when appropriate.          |
| Accept   | Acknowledge the risk and prepare contingency plans if it occurs. |

---

# 6. Risk Monitoring

Risks will be reviewed throughout the internship.

Risk monitoring activities include:

* Weekly progress reviews.
* Updating the risk register when new risks are identified.
* Monitoring milestone completion.
* Tracking unresolved technical issues.
* Reviewing testing and deployment results.

---

# 7. Contingency Plan

If significant risks occur, the following actions may be taken:

* Reduce project scope while preserving core MVP functionality.
* Reprioritize backlog items based on business value.
* Allocate additional time to critical technical challenges.
* Increase testing before deployment.
* Document unresolved issues for future improvements.

---

# 8. Assumptions

The following assumptions support this risk assessment:

* The internship will proceed according to the planned 10-week schedule.
* Required software and cloud services remain available.
* Development tools function as expected.
* Learning resources and technical documentation are accessible.

---

# 9. Constraints

Risk management is influenced by the following constraints:

* Limited project duration.
* Single-developer project.
* Limited cloud resource availability.
* Time required to learn unfamiliar technologies.
* MVP-focused project scope.

---

# 10. Risk Review Schedule

| Week    | Review Activity                                   |
| ------- | ------------------------------------------------- |
| Week 1  | Initial risk identification                       |
| Week 3  | Review technical implementation risks             |
| Week 5  | Review integration and testing risks              |
| Week 7  | Review deployment and infrastructure risks        |
| Week 10 | Final project risk assessment and lessons learned |

---

# 11. Success Indicators

Risk management will be considered effective if:

* Major project risks are identified early.
* High-priority risks are mitigated before becoming critical issues.
* MVP milestones are achieved according to the roadmap.
* Deployment and testing are completed successfully.
* The project is delivered within the internship timeframe.

---

# 12. Summary

Risk management is an ongoing process throughout the SkillVerse project. By proactively identifying, assessing, and mitigating risks, the project aims to reduce uncertainty, maintain development progress, and successfully deliver a secure, functional, and cloud-deployed Community Skill Exchange Platform within the internship schedule.
