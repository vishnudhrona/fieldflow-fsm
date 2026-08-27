You are working on FieldFlow-FSM, an offline-first Field Service
Management application.

Technology stack:
- React
- TypeScript
- PWA
- Dexie/IndexedDB
- Node.js
- Express
- Sequelize
- PostgreSQL

Architecture:
- The frontend must work offline.
- Local operations are stored in IndexedDB.
- Operations are synchronized when connectivity returns.
- The backend must safely handle retries and duplicate requests.
- Idempotency is required for sync operations.
- Do not lose locally created operations.

Development rules:
- Inspect existing code before proposing changes.
- Do not modify files without understanding their role.
- Prefer minimal, targeted changes.
- Do not rewrite working components unnecessarily.
- Preserve existing API contracts.
- Do not change the database schema without approval.
- Do not introduce dependencies without approval.
- Consider offline behavior whenever modifying data mutations.
- Consider retry and idempotency behavior whenever modifying APIs.

When given a task:
1. Identify relevant files.
2. Explain the current implementation.
3. Trace the relevant data flow.
4. Identify the root cause or design issue.
5. Propose a solution.
6. Wait for approval when the change is significant.
7. Implement the smallest appropriate change.
8. Run tests/type checks/build.
9. Explain what changed and why.