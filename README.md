# Iceberg Case Management Frontend

Modern, high-performance web interface for the Iceberg Case Management and Sales Progression platform.

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Server State**: [TanStack Query v5](https://tanstack.com/query)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
- **Linting & Formatting**: ESLint 9 + Prettier

---

## 📁 Project Structure

```text
src/
├── app/                  # Application routing, layout, and global providers
├── components/           # Reusable UI component library (Design System)
│   ├── ui/               # Button, Card, Badge, Modal, Tabs, Input, Table...
│   └── layout/           # Header, Sidebar, Shell, PageContainer
├── features/             # Feature modules by bounded context
│   ├── dashboard/        # Overview & analytics
│   ├── cases/            # Case list, detail, and timeline
│   └── templates/        # Template builder & draft editor
├── lib/                  # Utilities, API client (RFC 9457 compliant)
├── types/                # Strongly-typed API and Domain contracts
├── styles/               # Global CSS and design tokens
└── test/                 # Test setup and mocks
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js `^24.19.0` (or modern LTS)
- pnpm `^11.0.0`

### Installation

```bash
pnpm install
```

### Development Server

```bash
pnpm dev
```

The application runs locally at `http://localhost:3000`.

---

## 🧪 Quality Gates & Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts Vite development server |
| `pnpm build` | Builds the production bundle |
| `pnpm test` | Runs unit/integration tests with Vitest |
| `pnpm test:coverage` | Generates test coverage report |
| `pnpm typecheck` | Validates TypeScript types across the project |
| `pnpm lint` | Runs ESLint analysis |
| `pnpm format` | Formats code with Prettier |
