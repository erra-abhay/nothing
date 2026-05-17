# PaperVault by BRIKIEN LABS

The ultimate college question paper repository migrated to Next.js 14+.

## Project Information
- **Name:** PaperVault
- **Description:** A secure, high-performance repository for accessing and managing college question papers.
- **Folder:** `/home/abhay/Devops/papervault-nextjs`
- **Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, MySQL, JWT, Docker.

## Getting Started (Docker)

To run the application using Docker (as requested):

1.  **Environment Setup**:
    Copy `.env.example` to `.env` and fill in your database credentials and `JWT_SECRET`.
    ```bash
    cp .env.example .env
    ```

2.  **Start with Docker Compose**:
    ```bash
    docker-compose up --build
    ```
    The application will be available at `http://localhost:3000`.

## Production Build

To build the production image:
```bash
docker build -t papervault-nextjs .
docker run -p 3000:3000 papervault-nextjs
```

## Features
- **Public Browsing**: Advanced search and filtering for question papers.
- **Faculty Portal**: Secure upload and management of departmental resources.
- **Admin Panel**: Comprehensive oversight of users, subjects, and papers.
- **SEO Optimized**: Dynamic metadata, sitemaps, and robots.txt.
- **Premium Design**: Modern, responsive UI with dark mode support.
- **Security**: HttpOnly JWT cookies, CSRF protection, and file validation.

## Directory Structure
- `src/app`: Page routes and API handlers.
- `src/components`: Reusable UI components.
- `src/lib`: Database and utility functions.
- `uploads`: Local storage for paper files.
