# Quick Start Guide - LicenseHub

## ⚡ 30-Second Setup

### 1. Install Dependencies
```bash
cd e:\xampp\htdocs\Licensehub
npm install
composer install
```

### 2. Setup Environment
```bash
copy .env.example .env
php artisan key:generate
```

### 3. Database
```bash
php artisan migrate
php artisan db:seed
```

### 4. Start Development
```bash
# Terminal 1
php artisan serve

# Terminal 2
npm run dev
```

### 5. Open Browser
Visit: **http://localhost:8000**

---

## 🎮 Try It Out

### Test Different Roles

Edit `resources/js/context/AuthContext.jsx`, line 152:

```jsx
const DEFAULT_USER = {
    name: 'Test User',
    email: 'test@licensehub.io',
    role: 'super_admin', // ← Change this to test roles
};
```

Available roles:
- `super_admin` - Full access
- `admin` - All except settings
- `compliance_officer` - Compliance focused
- `lawyer` - Legal workspace
- `accountant` - Financial workspace
- `client` - Own company view
- `viewer` - Read-only

### Navigate the App

1. **Dashboard** - See compliance overview
2. **Companies** - Browse 10 sample companies
3. **Other Pages** - Placeholder pages ready for features

---

## 🔧 Useful Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run build            # Build for production

# Laravel
php artisan serve        # Start Laravel server
php artisan tinker       # Interactive shell
php artisan migrate      # Run migrations
php artisan db:seed      # Seed database

# Database
mysql -u root Licensehub # Access MySQL
```

---

## 📁 Key Files to Edit

| File | Purpose |
|------|---------|
| `resources/js/pages/*` | Add new pages |
| `resources/js/components/ui/*` | Add UI components |
| `routes/web.php` | Add routes |
| `app/Http/Controllers/*` | Add API endpoints |
| `resources/css/app.css` | Customize design |

---

## ✨ What's Already Built

✅ React + Router setup  
✅ Tailwind CSS integration  
✅ 14 page routes  
✅ RBAC system (7 roles)  
✅ 10 sample companies  
✅ Dashboard with stats  
✅ Companies management  
✅ Sidebar navigation  
✅ Admin shell layout  
✅ UI component library  

---

## 🚀 Next Steps

1. **Connect to Database**
   - Create API endpoints in `app/Http/Controllers/`
   - Replace mock data with real data

2. **Add Features**
   - Calendar integration
   - Document upload
   - Email notifications

3. **Enhance UI**
   - Add charts with Recharts
   - Add forms with React Hook Form
   - Add modals and dialogs

4. **Deploy**
   - Build frontend: `npm run build`
   - Deploy to your server

---

## 🐛 Common Issues

**Port 8000 in use?**
```bash
php artisan serve --port 8001
```

**Vite not hot-reloading?**
Check that `npm run dev` is running in another terminal.

**Database errors?**
```bash
php artisan migrate:fresh --seed
```

---

**You're ready to go! Happy coding! 🚀**
