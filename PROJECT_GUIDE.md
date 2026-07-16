# Project Guide: App De gestion des activites de controle

## 📋 Project Overview

This is a web application for managing control activities related to enterprise health and safety. It consists of a Laravel backend API and a React frontend.

**Status:** Under Development

---

## 🗂️ Project Structure

```
Root/
├── Backend/                    # Laravel 11 REST API
│   ├── app/                   # Application logic
│   │   ├── Http/Controllers/  # API endpoints
│   │   ├── Models/            # Database models
│   │   └── Providers/         # Service providers
│   ├── bootstrap/             # Application bootstrap
│   ├── config/                # Configuration files
│   ├── database/              # Database migrations and seeders
│   │   ├── migrations/        # Schema definitions
│   │   ├── factories/         # Test data factories
│   │   └── seeders/           # Seed scripts
│   ├── public/                # Public assets
│   ├── resources/             # Views and CSS
│   ├── routes/                # Route definitions (web.php, console.php)
│   ├── storage/               # Logs, cache, sessions
│   ├── tests/                 # Unit and feature tests
│   ├── vendor/                # Composer dependencies
│   ├── .env                   # Environment variables (configured for MySQL)
│   ├── artisan                # Laravel CLI
│   ├── composer.json          # PHP dependencies
│   ├── package.json           # NPM packages
│   ├── vite.config.js         # Vite bundler config
│   └── phpunit.xml            # Test configuration
│
├── Frontend/                  # React + Vite frontend
│   └── App GACE/
│       ├── src/
│       │   ├── App.jsx        # Main App component
│       │   ├── main.jsx       # Entry point
│       │   ├── App.css        # Global styles
│       │   ├── index.css      # Base styles
│       │   └── assets/        # Images and static files
│       ├── public/            # Static files
│       ├── index.html         # HTML template
│       ├── vite.config.js     # Vite config
│       ├── eslint.config.js   # Linting rules
│       ├── package.json       # Dependencies
│       └── README.md          # Frontend documentation
│
└── .git/                      # Git version control
```

---

## 🛠️ Technology Stack

### Backend

- **Framework:** Laravel 11
- **Language:** PHP
- **Database:** MySQL (via WAMP)
- **API Type:** REST
- **Build Tool:** Vite
- **Testing:** PHPUnit

### Frontend

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** CSS (with Tailwind utility classes suggested)
- **Language:** JavaScript/JSX
- **Linting:** ESLint

### Tools & Services

- **Package Manager (PHP):** Composer
- **Package Manager (Node):** NPM
- **Local Dev Environment:** WAMP (Apache + MySQL + PHP)
- **Version Control:** Git

---

## 🗄️ Database Configuration

### Current Setup

- **Connection Type:** MySQL
- **Host:** 127.0.0.1 (localhost)
- **Port:** 3306
- **Database Name:** laravel
- **Username:** root
- **Password:** (empty by default in WAMP)

**File:** `Backend/.env` (lines 23-28)

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

### Database Tables

Current migrations create:

- `users` - User authentication and data
- `cache` - Application cache storage
- `jobs` - Queue jobs storage

---

## 🚀 Getting Started

### Prerequisites

1. WAMP installed with:
   - Apache running on port 80
   - MySQL running on port 3306
   - PHP 8.2+ enabled
2. Composer installed globally
3. Node.js 18+ installed

### Backend Setup

```bash
cd Backend

# Install PHP dependencies
composer install

# Generate app key (already done in .env)
php artisan key:generate

# Create database "laravel" in MySQL

# Run migrations
php artisan migrate

# Start development server
php artisan serve
```

The backend will run on `http://localhost:8000`

### Frontend Setup

```bash
cd Frontend/App\ GACE

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

---

## 📝 Key Files Reference

### Backend

- `Backend/.env` - Environment variables and database config
- `Backend/routes/web.php` - Web routes
- `Backend/app/Models/User.php` - User model example
- `Backend/database/migrations/*` - Schema definitions
- `Backend/phpunit.xml` - Test configuration

### Frontend

- `Frontend/App GACE/src/App.jsx` - Main component
- `Frontend/App GACE/src/main.jsx` - React entry point
- `Frontend/App GACE/package.json` - Dependencies
- `Frontend/App GACE/vite.config.js` - Build configuration

---

## 🔗 Connecting Frontend to Backend

The React frontend will need to make API calls to the Laravel backend.

**Frontend should call:** `http://localhost:8000/api/{endpoint}`

Example in React:

```javascript
fetch("http://localhost:8000/api/users")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

**Important:** Configure CORS in Laravel if frontend and backend are on different ports.

---

## ✅ Database Connection Verification

To verify the MySQL connection is working:

**Option 1 - Run migrations:**

```bash
cd Backend
php artisan migrate
```

**Option 2 - Test connection in Tinker:**

```bash
cd Backend
php artisan tinker
DB::connection()->getPdo();
```

If connected, returns a PDO object. If failed, shows connection error.

---

## 📦 Available Commands

### Backend (Laravel)

```bash
php artisan serve              # Start dev server
php artisan migrate            # Run database migrations
php artisan migrate:rollback   # Rollback migrations
php artisan tinker             # Interactive shell
php artisan make:model         # Create new model
php artisan make:controller    # Create new controller
php artisan make:migration     # Create new migration
php vendor/bin/phpunit         # Run tests
```

### Frontend (React + Vite)

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🧪 Testing

### Backend Tests

```bash
cd Backend
php vendor/bin/phpunit
```

Tests are in `Backend/tests/` directory.

### Frontend Tests

Add Jest or Vitest as needed.

---

## 🌐 API Endpoints

(To be documented as endpoints are developed)

Key areas to document:

- Authentication endpoints
- User management
- Control activities CRUD
- Enterprise data

---

## 🔐 Important Notes

1. **Environment Variables:** Never commit `.env` file. Use `.env.example` as template.
2. **MySQL:** Ensure WAMP MySQL is running before starting the backend.
3. **Port Conflicts:** Backend runs on 8000, Frontend on 5173. Ensure these are free.
4. **CORS:** May need to configure if frontend/backend on different ports.
5. **Database:** The `laravel` database must exist and be empty before running migrations.

---

## 📞 Common Issues

### Backend won't connect to MySQL

- Check WAMP MySQL is running
- Verify credentials in `.env` match WAMP MySQL
- Ensure `laravel` database exists

### Frontend can't call backend API

- Verify backend server is running on port 8000
- Check for CORS errors in browser console
- Ensure API URLs in frontend code point to correct host

### Port already in use

- Change ports in `vite.config.js` (frontend) or use `--port` flag with `php artisan serve`

---

## 📄 Documentation Files

- **This file:** PROJECT_GUIDE.md - Overall project structure and setup
- **Backend:** `Backend/README.md` - Laravel-specific documentation
- **Frontend:** `Frontend/App GACE/README.md` - React-specific documentation

---

**Last Updated:** 2026-07-16
**Created For:** Cross-team collaboration and AI assistant context
