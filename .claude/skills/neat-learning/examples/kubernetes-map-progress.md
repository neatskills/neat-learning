---
goal: Deploy applications to production
domain: technical
started: 2026-06-27T10:00:00Z
last_session: 2026-06-29T14:30:00Z
total_sessions: 3
progress:
  mastered: 2
  total: 5
  overall_level: 3.2
---

# Kubernetes Learning Map

**Goal:** Deploy applications to production

**Domain:** Technical

## Foundation

### Pod
**What it is:** Container wrapper with lifecycle management

**Level:** 6 (Can explain tradeoffs)

**Status:** Mastered

**Review:** Next review in 4 days (2026-07-03)

#### Discover ✓
date: 2026-06-27T10:30:00Z
questions:
  correct: 5
  total: 5
hints_needed: 0
signals:
  confusion: []
  strengths: [lifecycle, restart-policy, container-relationship]

Strong understanding demonstrated.

#### Name ✓
vocabulary_introduced: 2026-06-27T10:45:00Z
terms:
  - Pod
  - Pod spec
  - Pod lifecycle
  - Pod status
  - container restart policy

#### Practice ✓
date: 2026-06-27T11:00:00Z
independence: true
exercises:
  - name: Write Pod manifest
    status: complete
    errors: 0
  - name: Debug failing Pod
    status: complete
    errors: 0

#### Calibrate ✓
date: 2026-06-27T11:30:00Z
tradeoffs:
  correct: 3
  total: 3
expert_thinking:
  - Knows when NOT to use Pods (one-time tasks → Job)
  - Understands Pod vs Deployment contexts
  - Identified common mistakes (missing resource limits)

**Activity:** Mastered
**Review interval:** 345600 seconds (4 days)
**Last activity:** 2026-06-27T11:30:00Z

---

### Service
**What it is:** Network access to Pods

**Level:** 5 (Can teach others)

**Status:** Mastered

**Review:** Due for review now

#### Discover ✓
date: 2026-06-28T10:00:00Z
questions:
  correct: 4
  total: 5
hints_needed: 1
signals:
  confusion: []
  strengths: [ClusterIP-vs-NodePort, selector-matching]

Good understanding with minor confusion on LoadBalancer.

#### Name ✓
vocabulary_introduced: 2026-06-28T10:20:00Z
terms:
  - Service
  - ClusterIP
  - NodePort
  - LoadBalancer
  - selector

#### Practice ✓
date: 2026-06-28T10:45:00Z
independence: true
exercises:
  - name: Create ClusterIP Service
    status: complete
    errors: 0
  - name: Debug Service not routing
    status: complete
    errors: 1

#### Calibrate ✓
date: 2026-06-28T11:15:00Z
tradeoffs:
  correct: 2
  total: 3
expert_thinking:
  - Understands Service types and when to use each
  - Knows common selector mistakes

**Activity:** Mastered
**Review interval:** 172800 seconds (2 days)
**Last activity:** 2026-06-28T11:15:00Z

---

## Core

### Deployment
**What it is:** Manages Pod replicas and updates

**Level:** 2 (Can explain concepts)

**Status:** Ready for Practice

**Requires:** Pod

#### Discover ✓
date: 2026-06-29T09:00:00Z
questions:
  correct: 5
  total: 5
hints_needed: 0
signals:
  confusion: []
  strengths: [rolling-updates, replica-management, self-healing]

Strong understanding demonstrated.

#### Name ✓
vocabulary_introduced: 2026-06-29T09:30:00Z
terms:
  - Deployment
  - ReplicaSet
  - replicas
  - rolling update
  - rollback

**Activity:** Ready for Practice

---

### ConfigMap
**What it is:** Configuration management

**Level:** 0 (Not started)

**Status:** Ready to discover

**Requires:** Pod

---

### Secret
**What it is:** Sensitive data management

**Level:** 0 (Not started)

**Requires:** Pod, ConfigMap
