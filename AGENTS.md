# Frontend Agent Working Agreement

## Rules & Principles

1. **TypeScript Strictness**:
   - Always maintain strict TypeScript. Never use `any`, `@ts-ignore`, non-null assertions (`!`), or unchecked type assertions (`as unknown as ...`).
   - Parse untrusted data and responses at API/BFF boundaries into strongly typed contracts.

2. **Architecture & Directory Structure**:
   - `src/app/`: Application routing, top-level layout, and global providers.
   - `src/components/`: Reusable UI design system elements (`ui/`) and layout components (`layout/`).
   - `src/features/`: Domain-oriented feature modules (e.g. `cases`, `templates`, `sales-progression`).
   - `src/lib/`: HTTP API client, utilities, and integrations.
   - `src/types/`: Shared contract definitions matching API and BFF models.

3. **API & Error Handling**:
   - Backend errors conform to RFC 9457 Problem Details (`type`, `title`, `status`, `detail`, `instance`, `traceId`, `field`).
   - Frontend API client must translate RFC 9457 responses into structured client exceptions.
   - Mutations return identifiers and resource versions; do not invent local mock state transitions when the backend owns the authoritative snapshot.

4. **Styling & Aesthetics**:
   - Use modern Tailwind CSS and design tokens.
   - Create clean, accessible, and responsive interfaces with deliberate typography, consistent spacing, and subtle micro-animations.

5. **Testing & Quality**:
   - Write unit and component tests with Vitest and React Testing Library.
   - Ensure all lints, formatting, type checks, and tests pass before committing.

6. **Git Discipline**:
   - Follow conventional commit conventions (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
