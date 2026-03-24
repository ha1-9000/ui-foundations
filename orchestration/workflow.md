# UI Foundations Workflow

## Purpose
This workflow defines how new design-system foundations and components move from request to draft, into Figma, back into the repository, and eventually toward Code Connect readiness.

The goal is not maximum automation from day one. The goal is a process that is clear, repeatable, and easy to operate.

## Core Principle
**Conversation is input. Draft is truth. Project is control. Figma and repository are execution layers.**

## The Flow

### 1. Request / Intake
Work starts as a conversation, bug, product need, inconsistency, or implementation pain.

At intake, the only job is to clarify:
- what is needed
- why it matters
- whether this is net-new, an extension, or a fix
- which part of the system is affected

**Output:** a draft candidate.

### 2. Draft
The request is turned into a short written draft.

The draft should cover:
- problem
- proposed direction
- scope
- constraints
- related components or foundations
- open questions
- acceptance criteria

The draft can live in markdown or in the GitHub issue body.

**Rule:** if it is not written down, it is not ready for design or engineering.

**Output:** a usable draft.

### 3. Project Tracking
Once the draft is usable, it goes into the GitHub Project.

The project is the control layer. It tracks:
- status
- owner
- type
- priority
- area
- links to draft, Figma, branch, and PR

Suggested statuses:
- Inbox
- Drafting
- Ready for Figma
- In Figma
- Ready for Build
- In Build
- Review
- Blocked
- Done

**Output:** a visible tracked item.

### 4. Figma
When the draft is ready, the work moves into Figma.

Figma is used to:
- explore structure
- define variants
- test naming
- align visual behavior
- validate boundaries

Figma should reflect the draft, not replace it. If important decisions happen in Figma, the draft must be updated.

**Output:** a stable design direction.

### 5. Repository
Once the design direction is stable, repository work begins.

This may include:
- tokens
- component API
- structure
- stories
- docs
- tests
- migration notes

Implementation should map back to the draft and Figma. If code reveals a mismatch, reconcile it explicitly instead of letting the work drift.

**Output:** branch or PR.

### 6. Review
Review is not just “does it compile.”

Check for:
- design-system consistency
- naming
- composability
- accessibility
- token alignment
- documentation quality
- Code Connect readiness

If needed, run review in two passes:
- system or design review
- engineering review

**Output:** approved or revised work.

### 7. Code Connect Readiness
Not every component needs full Code Connect maturity immediately, but the workflow should move work in that direction.

Typical readiness signals:
- stable naming
- predictable variants
- documented props
- mapped design and code structure
- clean Figma-to-code relationship

**Output:** ready now, or queued for later alignment.

## Roles

### Frontdesk / Orchestrator
- receives requests
- clarifies ambiguous input
- creates or improves drafts
- keeps project tracking honest
- routes work to the right specialist

### Design-System / DesignOps Agent
- shapes component logic
- checks system consistency
- defines naming and structure
- reviews design fit

### Coding Agent
- implements components and foundations
- aligns code with draft and system constraints
- prepares docs, stories, and tests

### Docs Agent
- turns decisions into usable documentation
- keeps guidance aligned with implementation

## Rules of Engagement
1. **No direct jump from chat to build** without a draft.
2. **No invisible design decisions** trapped only in Figma.
3. **No silent implementation drift** away from draft or design intent.
4. **Project status must reflect reality.**
5. **Automation should support the workflow, not replace thinking.**

## Practical Bias
- Keep drafts short.
- Keep project status honest.
- Prefer explicit handoffs over invisible assumptions.
- Prove the workflow manually before automating it.
