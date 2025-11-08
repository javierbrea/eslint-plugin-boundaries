# Contribution Workflow

This guide outlines how we organize work using GitHub Discussions (RFCs), Issues, Projects, and Milestones.

### Step 1: Open an RFC (if the change requires discussion)

**When to open an RFC:**
- Major feature implementation
- Breaking changes
- Architectural decisions
- Significant API modifications

**When to skip an RFC:**
- Bug fixes
- Documentation updates
- Small enhancements (< 1 day of work)
- Chore/maintenance tasks

**Where:** GitHub Discussions → Category: "RFCs"

**How to Document Amendments:**

Edits or changes to an accepted RFC should be documented in an "Amendment" section within the original RFC discussion. Use the following template for clarity:

```markdown
## Amendments

### Amendment [incremental number] (date)

**What changed:**
- Old approach: [old description]
- New approach: [new description]
- Impact: [how does this affect implementation?]
```

---

### Step 2: Create Issue(s) from Accepted RFC

**When:** Once the RFC has consensus and community agreement, or it has not received objections after a 7-day period.

**RFC Reference**

A reference link to the original RFC discussion should be included in the issue body:

```markdown
[From RFC #x](https://github.com/org/repo/discussions/123)
```

---

### Step 3: Break Down into Sub-Issues (if needed)

**When to create sub-issues:**
- If the RFC requires multiple work areas
- Different people could work on different parts
- Work spans 2+ days total

**How to create:** First create the issue, then click on "Create sub-issue" in the issue body. You can also use the  `relationships` sidebar to link issues as parent/child.

---

### Step 4: Add to Project & Assign to Milestone

**When:** Once Issue(s) are created

**Add to Project:**
1. Go to the project board
2. Add the issue to its appropriate column (e.g., "To Do")

**Assign to Milestone:**
1. Click "Milestone" in the issue sidebar
2. Choose the target version (e.g., `v3.0.0`)

**Add Priority label:**
- `p0-critical` - Blocking release, must do
- `p1-high` - Important, schedule soon
- `p2-medium` - Nice to have
- `p3-low` - Future consideration

---

### Step 5: Contributors Pick Up Tasks

**For core contributors:**
1. Move Issue from "Backlog" → "To Do" (in Project)
2. Assign to yourself

**For external contributors:**
1. Comment on Issue: *"I'd like to work on this"*
2. Maintainer will assign the issue

**Create branch:**
Create branch from `release`, or from the specific milestone branch when applies (e.g., `release-vX.X.X`): `feat/{issue-number}/description`

**Labels for contributors:**
- `good-first-issue` - For beginner-friendly tasks
- `help-wanted` - Actively seeking contributions
- `blocked` - Waiting for something else before work can start

---

### Step 6: During Development

**Move in Project:**
- When starting work: `Backlog` → `In Progress`
- When PR opens: `In Progress` → `In Review`
- When PR is merged into the release branch: `In Review` → `Release`
- When merged into main branch: Auto-move to `Done` (if PR references `Closes #{issue}`)

> [!TIP]
> Closing issue via PR (`Closes #N`) auto-moves both Issue and Sub-issues
