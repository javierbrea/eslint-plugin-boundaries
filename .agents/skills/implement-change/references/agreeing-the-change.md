# Agreeing the change

The step of the `implement-change` skill that an architectural change passes before any code is written.

## Procedure

1. **Write the goal**: what the change is for and what it leaves out, in two or three sentences. Ask the user now when the request does not give it.
2. **Have it designed** by the `architect`, with the goal and what the user already decided. Read its design against the docs before going on.
3. **Have it challenged** by the `skeptic` when the change is architectural and new, as "Sizing the change" of the skill says. Give it the goal, how the change is accepted, what the user already decided and the design, never the reasons you have to like it.
   - Check each objection as "Checking a finding" of the skill says, and change the design for those that are true.
4. **Present it to the user**, as "What the user sees" says, and ask what is still theirs to decide.
5. **Go on until the user approves** the goal, the design and how it is accepted. Whatever changes one of the three afterwards goes back to the user.

- **What the plan of the work already settles is never asked again**: only what it leaves open.

## What the user sees

- **The goal**, and what the change leaves out.
- **The design in plain words**: what goes where, and one real case followed from end to end through the projects it crosses.
- **The alternatives**, when the `skeptic` or the `architect` gave any, each with what it gains and costs against the design, and the one recommended. One that was dropped is shown with its reason. With no real alternative, say so.
- **How the change is accepted**: what can be run or seen once it is done, such as a command that passes, a test that exists or a step in the playground. Never "it works".

## Asking the user

- **A question is a decision that is theirs, or a point where reading it another way changes the code.** What the docs or the code answer is never asked.
- **Each question stands alone**: what is being decided, one example of the case, each option with what follows from it, and the one recommended.
- **Ask what the design implies, never whether it is understood**: "with this, a file that no element matches gets no error: is that what you want?", never "is the design clear?".
- **Ask first where the design departs from what the user asked for or is likely to expect.**
