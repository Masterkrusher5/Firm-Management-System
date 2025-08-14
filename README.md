# Firm Management System
# React + Vite
## 📖 About The Project

This project is a comprehensive solution designed to replace a HTML/JS application with a modern, scalable, and maintainable software architecture. It provides a centralized system for businesses to manage their inventory, track sales, log expenses with a multi-person approval workflow, and handle cash deposits.

The application is delivered as a secure, standalone desktop app using Electron, ensuring that it works seamlessly on Windows, macOS, and Linux.

### ✨ Key Features

*   **Dual User Roles:** Separate, secure login and dashboard interfaces for **Staff** and **Administrators**.
*   **Multi-Firm Architecture:** Designed from the ground up to support multiple independent firms, each with its own isolated data.
*   **Inventory Management:** Full CRUD (Create, Read, Update, Delete) functionality for inventory items, including the ability to import from Excel files.
*   **Comprehensive Sales Workflow:** Create detailed sales records, link them to customers, apply discounts, and track payments (full or partial).
*   **Advanced Expense Approval:** Staff can submit expenses for approval. A configurable number of admins must approve an expense before it is officially logged. A single rejection rejects the request, with a full audit trail of who voted.
*   **Cash Flow Management:** Track in-hand cash, log bank deposits, and view a complete history of all transactions.
*   **Secure Session Management:**
    *   **Concurrent Login Prevention:** Prevents the same user account from being logged in on multiple devices simultaneously.
    *   **Inactivity Logout:** Automatically logs users out after 5 minutes of inactivity for enhanced security.
    *   **Graceful Session Expiry:** Automatically handles expired tokens and redirects the user to the login screen.
*   **Cross-Platform Desktop App:** Packaged with Electron for a native desktop experience.

---

## 🛠️ Tech Stack

This project is built with a modern, reliable, and efficient technology stack.

*   **Backend:** [**PocketBase**](https://pocketbase.io/) - An open-source Go backend providing a realtime database, authentication, and file storage in a single executable.
*   **Frontend:** [**React**](https://react.dev/) with [**Vite**](https://vitejs.dev/) - A fast, modern, and powerful framework for building user interfaces.
*   **Desktop Shell:** [**Electron**](https://www.electronjs.org/) - For packaging the web application into a cross-platform desktop app.
*   **Styling:** [**Tailwind CSS**](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
*   **Routing:** [**React Router**](https://reactrouter.com/) - For handling navigation and different "pages" within the single-page application.
*   **State Management:** [**React Context**](https://react.dev/learn/passing-data-deeply-with-context) - For managing global application state like user authentication and firm data.

---

##  Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   **Node.js** (v18 or later recommended)
*   **npm** (comes with Node.js)
*   **Git** for version control

### 1. Backend Setup (PocketBase)

This application requires a running PocketBase backend instance.

1.  Download the [PocketBase executable](https://pocketbase.io/docs/) for your OS.
2.  Create a directory for your backend (e.g., `my-project-backend`).
3.  Place the executable inside and run it from your terminal:
    ```bash
    ./pocketbase serve
    ```
4.  Navigate to `http://127.0.0.1:8090/_/` in your browser.
5.  Create your first super-admin account.
6.  Using the Admin UI, create all the necessary collections (`users`, `admins`, `firms`, `items`, `sales`, etc.) and set their schema and API Rules according to the project's requirements.

### 2. Frontend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
2.  **Install NPM packages:**
    ```bash
    npm install
    ```
3.  **Create your Environment File:**
    Create a file named `.env.development` in the root of the project and add the URL of your local PocketBase instance:
    ```
    VITE_POCKETBASE_URL=http://127.0.0.1:8090
    ```

---

## ⚙️ Available Scripts

In the project directory, you can run:

### `npm run dev`
Runs the app in web development mode. Open [http://localhost:5173](http://localhost:5173) to view it in the browser. The page will reload if you make edits.

### `npm run electron:dev`
Runs the app in **desktop development mode**. This will start the web server and launch the Electron application window simultaneously.

### `npm run build`
Builds the app for web production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run electron:build`
Builds and packages the application into a distributable desktop installer (e.g., `.exe`, `.dmg`). The final files will be located in the `release` directory.

---

## 📦 Deployment

*   **Backend (PocketBase):** The backend can be hosted on any platform that supports Go executables and a persistent filesystem. Recommended free options that do not require a credit card include **Okteto** and **Patr.io**.
*   **Frontend (Web App):** The production build from `npm run build` can be deployed to any static site hosting service, such as **Cloudflare Pages**, **Vercel**, or **Netlify**.
*   **Desktop App:** The installers generated by `npm run electron:build` can be distributed directly to users or uploaded to a platform like **GitHub Releases** to enable auto-updates.

Note:
Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
