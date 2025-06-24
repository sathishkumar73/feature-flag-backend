# Canary Deployment System – Project Documentation

## Overview
This project implements a robust canary deployment backend and frontend system for feature flag management, with deep Google Cloud Platform (GCP) integration. It enables secure OAuth-based GCP account connection, project detection, and a beautiful UI for managing GCP projects and feature flags.

---

## Features
- **GCP OAuth Integration**: Securely connect user GCP accounts using OAuth 2.0
- **Project Detection**: List all accessible GCP projects for the authenticated user
- **Feature Flag Management**: (Pluggable) Manage feature flags per project
- **Secure Token Storage**: AES-256-GCM encryption for all OAuth tokens
- **Modern Frontend UI**: Responsive, beautiful dashboard for GCP projects
- **Comprehensive Error Handling**: User-friendly and developer-friendly errors
- **Audit Logging**: (Pluggable) Track all sensitive actions

---

## Architecture
- **Backend**: NestJS, Prisma ORM, TypeScript
- **Frontend**: Standalone HTML/JS (can be integrated into any SPA)
- **Database**: PostgreSQL (via Prisma)
- **GCP Integration**: `google-auth-library`, `googleapis`

### Key Backend Modules
- `gcp/`: Handles OAuth, project listing, and token management
- `feature-flag/`: (Pluggable) Feature flag CRUD and evaluation
- `api-key/`, `auth/`: Secure API access
- `utils/encryption.ts`: AES-256-GCM encryption for sensitive data

---

## Setup Instructions

### 1. Environment Variables
Create a `.env` file with:
```
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/canary-deployment/callback
ENCRYPTION_KEY=your-32-byte-random-key
```

### 2. GCP Setup
- Create a Google OAuth 2.0 Client (type: Web Application)
- Add your redirect URI to the OAuth client
- Enable the **Cloud Resource Manager API** in all GCP projects you want to list
- Add test users to the OAuth consent screen (if in testing mode)

### 3. Install Dependencies
```
npm install
```

### 4. Run Migrations
```
npx prisma migrate deploy
```

### 5. Start the Backend
```
npm run start:dev
```

### 6. Open the Frontend UI
Open `gcp-projects-ui.html` in your browser.

---

## API Endpoints

### GCP OAuth
- `POST /gcp/auth/initiate` – Initiate OAuth, returns `authUrl` and `state`
- `POST /gcp/auth/callback` – Exchange code for tokens, stores encrypted tokens
- `GET /gcp/projects` – List all accessible GCP projects for the user
- `DELETE /gcp/disconnect` – Disconnect GCP account

### Feature Flags (Pluggable)
- `GET /flags` – List feature flags
- `POST /flags` – Create flag
- `PUT /flags/:id` – Update flag
- `DELETE /flags/:id` – Delete flag

---

## Security
- **OAuth tokens** are encrypted at rest (AES-256-GCM)
- **API endpoints** require JWT or API key authentication
- **CSRF protection** via state tokens in OAuth
- **Error handling**: All errors are logged and user-friendly messages are returned

---

## Frontend UI
- **Connect GCP Account**: Initiates OAuth flow
- **Project Grid**: Beautiful, responsive cards for each GCP project
- **Stats Bar**: Shows total, active, and selected projects
- **Loading/Error States**: Modern UX patterns
- **Demo Mode**: Load sample projects for demo/testing

---

## Troubleshooting
- **403 on projects.list**: Ensure Cloud Resource Manager API is enabled in all projects
- **invalid_grant**: Use a fresh authorization code; codes expire quickly and can only be used once
- **Consent Screen Issues**: Add your user as a test user or publish the consent screen
- **API Errors**: Check backend logs for detailed error messages

---

## Extending the System
- Integrate feature flag evaluation and targeting per GCP project
- Add organization/team management
- Add audit log UI
- Integrate with CI/CD for automated canary rollouts

---

## Authors & Credits
- Backend & GCP Integration: [Your Name]
- Frontend UI: [Your Name]
- Architecture & Guidance: GPT-4.1

---

For more details, see `GCP_SETUP.md` and inline code comments. 