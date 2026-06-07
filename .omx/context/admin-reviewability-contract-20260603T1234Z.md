# Admin page reviewability contract

## Purpose

Keep the Lolaum admin-page implementation reviewable while worker lanes build and verify the feature.

## Review slices

Review the admin work as small, independent slices in this order:

1. **Dependency/design-system slice**
   - `package.json`, `package-lock.json`
   - MUI dependencies only; no unrelated package upgrades.
2. **Admin shell/auth slice**
   - `src/app/admin/**`
   - Signup/login UI, route boundaries, admin session handling, and Lolaum branding.
3. **Admin API/data slice**
   - `src/app/api/admin/**`, `src/lib/supabase/**`
   - Server-only Supabase access, authorization checks, and typed request/response contracts.
4. **Feature panels slice**
   - Ritual period adjustment, deactivated accounts, review question editing, error logs, exports.
   - Each panel should be diff-reviewable on its own and avoid coupling UI state across panels.
5. **Verification slice**
   - Lint, TypeScript, focused tests, build, and manual smoke notes.

## Guardrails

- Keep admin-only code under `src/app/admin/**`, `src/app/api/admin/**`, or clearly named `src/lib/admin/**` helpers.
- Do not modify public ritual/user flows unless required to enforce a documented admin contract.
- Put all admin write operations behind server-side authorization checks.
- Prefer CSV export from existing platform APIs before adding heavy Excel-only dependencies.
- Avoid broad schema assumptions; document any required Supabase tables, columns, or policies near the API that uses them.
- Keep commits scoped to one review slice when possible.

## Completion checklist

- [ ] Admin route renders without affecting existing app routes.
- [ ] Admin-only APIs reject unauthenticated or non-admin callers.
- [ ] Deactivated users are prevented from adding rituals at the server boundary.
- [ ] Review-question edits have a clear persistence source and fallback behavior.
- [ ] Error-log and export features fail safely when optional backing tables are missing.
- [ ] `npm run lint` passes.
- [ ] `npx tsc --noEmit` passes.
- [ ] Focused regression tests pass.
- [ ] `npm run build` passes or the blocker is recorded with command output.
