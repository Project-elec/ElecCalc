# ใช้ Claude Code แบบ Senior Dev

## ไม่ใช่แค่ให้ AI เขียนโค้ด แต่คือการออกแบบ Workflow ให้ AI ทำงานอย่างมีคุณภาพ

หลายคนใช้ Claude Code แบบนี้:

> “ช่วยสร้างหน้า Login ให้หน่อย”
> “ช่วยแก้ Bug ให้หน่อย”
> “ช่วย Refactor โค้ดให้หน่อย”

มันใช้ได้ครับ แต่ยังไม่ใช่วิธีคิดแบบ Senior Dev

Senior Dev ไม่ได้วัดกันที่ “ใครเขียนโค้ดเยอะกว่า”
แต่วัดกันที่ “ใครออกแบบงานให้ถูกทาง ตรวจงานได้ และลดความเสี่ยงได้ดีกว่า”

Claude Code เก่งมาก เพราะมันสามารถอ่าน codebase, แก้หลายไฟล์, รันคำสั่ง, รัน test และทำงานเหมือน coding agent ได้ แต่ถ้าเราโยนงานแบบกว้าง ๆ โดยไม่มี context ไม่มีเกณฑ์ตรวจสอบ และไม่มี workflow ผลลัพธ์ก็อาจออกมาดูดี แต่พังตอนใช้งานจริงได้

## แนวคิดหลัก: Senior Dev ไม่ได้ใช้ Claude Code เป็นคนเขียนโค้ด แต่ใช้เป็น Engineering Agent

ให้มอง Claude Code เป็น “developer อีกคนหนึ่งในทีม” ไม่ใช่เครื่องมือวิเศษ

หน้าที่ของเราไม่ใช่แค่สั่งว่าอยากได้อะไร
แต่ต้องกำหนดให้ชัดว่า:

* เป้าหมายของงานคืออะไร
* ขอบเขตอยู่ตรงไหน
* ห้ามแตะไฟล์อะไร
* ต้อง follow pattern เดิมตรงไหน
* ต้องมี test หรือ verification อะไร
* ก่อนจบงานต้องแสดงหลักฐานอะไรว่าใช้งานได้จริง

นี่คือจุดที่ต่างระหว่าง beginner กับ senior

Beginner ใช้ AI เพื่อ “เขียนโค้ดแทน”
Senior ใช้ AI เพื่อ “ขยายความสามารถในการทำงาน” แต่ยังคุม architecture, quality และ decision เอง

## Workflow ที่ควรใช้: Explore → Plan → Implement → Verify → Review → Commit

เอกสาร best practices ของ Claude Code แนะนำแนวคิดสำคัญคือ “Explore first, then plan, then code” เพื่อหลีกเลี่ยงการแก้ผิดจุดหรือสร้าง solution ผิดทาง โดยเฉพาะงานที่เกี่ยวข้องหลายไฟล์หรือ codebase ที่เราไม่คุ้น

### 1. Explore — ให้ Claude เข้าใจระบบก่อน

อย่าเพิ่งสั่งให้แก้ทันที
ให้เริ่มจากการสำรวจ codebase ก่อน เช่น:

```text
Explore this codebase first.
Focus on the authentication flow, session handling, and API structure.
Do not modify any files yet.
Summarize:
1. Key files involved
2. Current architecture
3. Existing patterns
4. Potential risks
```

นี่คือการทำงานแบบ senior เพราะเราไม่รีบเขียนโค้ดก่อนเข้าใจระบบ

### 2. Plan — ขอแผนก่อนลงมือ

หลังจาก Claude เข้าใจ codebase แล้ว ให้มันเสนอแผนก่อน

```text
Create an implementation plan before editing files.

Goal:
Add password reset feature.

Requirements:
- Use existing auth pattern
- Do not introduce a new framework
- Keep database changes minimal
- Add validation
- Add tests if test setup exists

Return:
1. Files to modify
2. New files to create
3. Database changes
4. Edge cases
5. Verification steps
```

Senior Dev ต้อง review plan ก่อนเสมอ
เพราะถ้า plan ผิด ต่อให้ code ถูก syntax งานก็ผิดอยู่ดี

### 3. Implement — ให้ทำตามแผน ไม่ใช่เดาสุ่ม

หลังจากแผนโอเค ค่อยให้เริ่ม implement

```text
Implement the plan.
Follow the existing code style.
Make small, focused changes.
After each major change, explain what changed and why.
Do not rewrite unrelated files.
```

ประเด็นสำคัญคือ “small focused changes”
อย่าให้ AI refactor ทั้ง project ทั้งที่เราขอแค่ feature เดียว

### 4. Verify — ต้องมีวิธีพิสูจน์ว่างานใช้ได้

Claude Code docs แนะนำชัดว่าเราควรให้ Claude มีสิ่งที่ใช้ตรวจงานได้ เช่น test, build, lint, screenshot หรือ command ที่ให้ผล pass/fail เพราะถ้าไม่มี verification Claude จะหยุดเมื่อ “ดูเหมือนเสร็จ” ไม่ใช่ “พิสูจน์แล้วว่าเสร็จ”

ใช้ prompt แบบนี้:

```text
Now verify the implementation.

Run:
- npm run lint
- npm run test
- npm run build

If anything fails:
1. Explain the root cause
2. Fix it
3. Re-run the command
4. Show the final output
```

สำหรับโปรเจกต์ PHP/Laravel อาจใช้:

```text
Run the relevant verification steps:
- php -l changed PHP files
- composer test if available
- php artisan test if this is Laravel
- Check route/controller/view consistency
- Verify validation and security edge cases
```

Senior Dev ไม่เชื่อคำว่า “เสร็จแล้วครับ”
Senior Dev ต้องการ evidence

## ใช้ CLAUDE.md ให้เป็น เหมือน onboarding document ของ AI

Claude Code สามารถอ่าน `CLAUDE.md` เพื่อรับ project instructions ทุก session ได้ เช่น coding standards, test commands, architecture notes และ workflow rules

ตัวอย่าง `CLAUDE.md` ที่เหมาะกับโปรเจกต์ web dev:

```md
# Project Context

This is a Next.js application using:
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL

# Commands

- Run dev server: npm run dev
- Run lint: npm run lint
- Run tests: npm run test
- Build: npm run build

# Coding Rules

- Use existing components before creating new ones
- Do not introduce new dependencies without asking
- Keep changes small and focused
- Follow existing folder structure
- Prefer server actions for mutations if the project already uses them

# Security Rules

- Never expose secrets
- Do not log tokens, passwords, or private user data
- Validate all user input
- Handle auth/session edge cases

# Before Finishing

Always run:
- npm run lint
- npm run build

Show the command output before saying the task is complete.
```

หลักการคืออย่าเขียน `CLAUDE.md` ยาวเกินไป
ใส่เฉพาะสิ่งที่ Claude เดาเองไม่ได้ เช่น command, convention, architecture decision, gotcha และ security rule

## ใช้ Permission / Hooks เพื่อคุมความปลอดภัย

Senior Dev ไม่ควรปล่อยให้ AI ทำทุกอย่างแบบไม่มี guardrail

Claude Code มี permission system ที่ใช้ควบคุมว่า agent อ่านไฟล์ แก้ไฟล์ หรือรัน command อะไรได้บ้าง และสามารถจัดการผ่าน `/permissions` ได้

ตัวอย่างแนวคิด:

```text
Allow:
- npm run lint
- npm run test
- npm run build
- git status
- git diff

Ask before:
- git commit
- package install
- database migration

Deny:
- rm -rf
- reading .env
- pushing to production branch
```

ถ้างานไหนต้องเกิดทุกครั้ง เช่น format code หลังแก้ไฟล์ หรือ block การแก้ไฟล์สำคัญ ให้ใช้ hooks เพราะ hooks ทำงานแบบ deterministic มากกว่าการเขียนเป็น instruction ใน prompt อย่างเดียว

ตัวอย่างสิ่งที่ควรทำเป็น hook:

* รัน formatter หลังแก้ไฟล์
* block การแก้ `.env`
* block การแก้ migration เก่า
* แจ้งเตือนเมื่อ Claude ต้องการ input
* รัน security check ก่อนจบงาน

## ใช้ Subagents เมื่องานเริ่มใหญ่

ถ้าให้ Claude สำรวจไฟล์เยอะ ๆ ใน conversation หลัก context จะรกเร็ว และคุณภาพอาจตก

Claude Code มี subagents สำหรับแยกงานเฉพาะ เช่น research, code review, debugging หรือ verification โดย subagent จะทำงานใน context แยก แล้วส่ง summary กลับมา ช่วยประหยัด context ของ session หลัก

ตัวอย่าง prompt:

```text
Use a subagent to investigate the current authentication flow.
The subagent should only read files and summarize:
1. Login flow
2. Session/token handling
3. Security risks
4. Files that should be changed for password reset

Do not modify files yet.
```

หรือหลัง implement:

```text
Use a code review subagent to review the changes.
Focus on:
- Security issues
- Edge cases
- Regression risk
- Inconsistent patterns
- Missing tests
```

นี่คือวิธีคิดแบบ senior: ให้ agent หนึ่งทำงาน อีก agent หนึ่งตรวจงาน และเราเป็นคนตัดสินใจสุดท้าย

## Prompt Template แบบ Senior Dev

ใช้ template นี้ได้เลยเวลาจะเริ่มงานจริง:

```text
You are working as a senior software engineer in this codebase.

Task:
[อธิบายงานที่ต้องการ]

Before coding:
1. Explore the relevant files
2. Explain the current architecture
3. Identify existing patterns
4. Create a step-by-step implementation plan
5. Wait for confirmation before editing files

Constraints:
- Do not rewrite unrelated files
- Do not introduce new dependencies unless necessary
- Follow existing style and folder structure
- Keep changes small and reviewable
- Prioritize maintainability and security

Verification:
- Add or update tests if appropriate
- Run the relevant test/build/lint commands
- Fix any failures
- Show the final verification output

Final response:
- Summary of changes
- Files changed
- Why this approach was chosen
- Verification results
- Any risks or follow-up work
```

## ตัวอย่าง Demo สอนในคลิป

โจทย์: เพิ่มระบบ “Forgot Password” ในโปรเจกต์ Next.js

### Prompt 1: สำรวจก่อน

```text
Explore this codebase.
Focus on authentication, user model, email utilities, and API route structure.
Do not modify files.
Summarize the current auth architecture and suggest where password reset should fit.
```

### Prompt 2: วางแผน

```text
Create a detailed plan to add forgot password and reset password flow.

Requirements:
- Generate secure reset token
- Token must expire
- Do not expose whether email exists
- Use existing validation style
- Add tests if possible
- Follow existing UI patterns

Return files to modify, database changes, and verification steps.
```

### Prompt 3: ลงมือทำ

```text
Implement the approved plan.
Make small commits mentally, but do not commit yet.
After implementation, run lint/build/tests and fix failures.
```

### Prompt 4: ตรวจงาน

```text
Review your own changes critically.
Look for:
- Security vulnerabilities
- Token leakage
- Race conditions
- Missing validation
- Poor UX
- Inconsistent patterns

Then use a subagent to review the diff for edge cases.
```

### Prompt 5: สรุปงาน

```text
Summarize the final implementation:
1. What changed
2. Files changed
3. Security considerations
4. Commands run
5. Final verification result
6. What should be reviewed by a human before merge
```

## สรุป

การใช้ Claude Code แบบ Senior Dev ไม่ใช่การพิมพ์ prompt ยาวที่สุด
แต่คือการออกแบบ workflow ที่ทำให้ AI ทำงานอย่างมีทิศทาง

ให้จำ framework นี้ไว้:

```text
Context ก่อน Code
Plan ก่อน Implement
Verify ก่อนเชื่อ
Review ก่อน Commit
Human ตัดสินใจสุดท้าย
```

Claude Code ช่วยให้เราเขียนโค้ดเร็วขึ้นได้มาก
แต่ความเร็วที่ไม่มี quality control จะกลายเป็น technical debt

ดังนั้น skill ที่สำคัญในยุคนี้ไม่ใช่แค่ “เขียนโค้ดเองได้”
แต่คือ “สั่งงาน AI ให้ถูก ตรวจงาน AI ให้เป็น และออกแบบระบบให้ AI ทำงานซ้ำได้อย่างปลอดภัย”

นี่แหละคือการใช้ Claude Code แบบ Senior Dev
