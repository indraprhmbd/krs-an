# KRSan (KRS Planner Application)

KRSan is a specialized course schedule optimization platform designed for Indonesian university students. It automates the complex process of semester schedule planning (KRS) using advanced algorithms and AI integration, transforming manual conflict checking into a seamless, automated workflow.

## 🚀 Overview

The application serves as an intelligent "Architect" for student schedules, offering a 3-stage visual workflow:

1.  **Configuration**: Setting academic parameters (University, Study Program, Semester).
2.  **Selection**: Choosing courses from a curated Master Data repository.
3.  **Visualization**: Viewing conflict-free schedule combinations generated automatically.

## 🛠️ Technology Stack

This project leverages a modern, type-safe stack optimized for performance and real-time capabilities.

### Core Ecosystem

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [React](https://react.dev/) (Vite)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)

### UI & Styling

- **CSS Framework**: [Tailwind CSS](https://tailwindcss.com/)
- **Component Library**: [Shadcn/UI](https://ui.shadcn.com/) (Radix UI primitives)
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Animations**: CSS Transitions & Tailwind Animate

### Backend & Infrastructure

- **BaaS (Backend-as-a-Service)**: [Convex](https://www.convex.dev/)
  - Real-time database subscriptions
  - Serverless functions (Queries/Mutations)
  - Cron jobs for maintenance
- **Authentication**: [Clerk](https://clerk.com/)
  - Secure user management
  - Session handling

### AI & Intelligence

- **Orchestration**: [LangChain](https://www.langchain.com/)
- **Inference Engine**: [Groq](https://groq.com/) / Gemini
  - Used for "Smart Generate" features
  - Unstructured data parsing (Intelligence Scraper)

---

## 📂 Project Structure

```bash
├── convex/                 # Backend logic (Serverless functions)
│   ├── schema.ts          # Database schema definitions
│   ├── users.ts           # User management mutations
│   ├── courses.ts         # Course data queries
│   └── ai.ts              # AI integration logic
├── src/
│   ├── assets/            # Static assets and external configs
│   ├── components/        # React components
│   │   ├── layout/        # Layout wrappers (Navbar, Footer)
│   │   ├── maker/         # Core Planner components (Selector, Viewer)
│   │   └── ui/            # Reusable UI primitives (Buttons, Dialogs)
│   ├── context/           # Global state (Language, etc.)
│   ├── hooks/             # Custom hooks (useTutorial, useLocalStorage)
│   ├── lib/               # Utilities and helper functions
│   └── App.tsx            # Application entry point
└── public/                # Public static files
```

## ⚡ Getting Started

### Prerequisites

- Node.js v18+
- NPM or Yarn
- Convex Account
- Clerk Account

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/indraprhmbd/krs-an.git
    cd krs-an
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory:

    ```env
    # Convex Configuration (Automated via npx convex dev)
    CONVEX_DEPLOYMENT=...
    NEXT_PUBLIC_CONVEX_URL=...

    # Clerk Authentication
    VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

    # Optional: AI Service Keys (if running AI features locally)
    GROQ_API_KEY=...
    ```

4.  **Run Development Server**
    You need to run both the frontend and the backend sync process.

    Terminal 1 (Frontend):

    ```bash
    npm run dev
    ```

    Terminal 2 (Backend):

    ```bash
    npx convex dev
    ```

## 🤝 Contribution Guidelines

We welcome contributions to improve the platform. Please follow these steps:

1.  **Fork** the repository.
2.  Create a **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes with clear messages.
4.  **Push** to the branch.
5.  Open a **Pull Request**.

> **Note**: Please ensure your code adheres to the project's linter and formatter settings (Prettier/ESLint) before submitting.

## 📄 License & Legal

This project is an independent educational tool. Course data is sourced from public university portals.

**Copyright © 2026 KRSan Production.**  
Built by [Indra Pradana](https://github.com/indraprhmbd).
