# LicenseHub - React + Laravel Compliance Management Platform

A modern compliance management system built with **React 19**, **Laravel 11**, **Tailwind CSS**, and **MySQL**. Track business licenses, tax filings, and regulatory requirements from a single command center.

## 🎯 Features

- **📊 Compliance Dashboard** - Real-time overview of all compliance obligations and filings
- **🏢 Companies Management** - Manage unlimited companies with multiple branches and directors
- **📅 Compliance Calendar** - Month view of all upcoming deadlines
- **📝 Reminders** - Automated compliance reminders and notifications
- **🔐 Document Vault** - Secure storage for all company documents
- **📧 Share by Email** - Distribute documents to stakeholders
- **💰 Tax & VAT Management** - Track tax filings and VAT returns
- **👨‍⚖️ Multi-Portal System** - Separate workspaces for lawyers, accountants, and clients
- **🔐 Role-Based Access Control** - 7 different user roles with granular permissions
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router DOM, Tailwind CSS v4 |
| **UI Components** | Custom Radix UI-inspired components, Lucide Icons |
| **State** | React Context API, React Query |
| **Backend** | Laravel 11, MySQL |
| **Build Tool** | Vite 7 with Laravel Vite Plugin |
| **Forms** | React Hook Form (ready to integrate) |
| **Charts** | Recharts (ready to integrate) |

## 📦 Project Structure

```
licensehub/
├── app/                          # Laravel backend
│   ├── Http/Controllers/         # API endpoints
│   └── Models/                   # Database models
├── resources/                    # Frontend assets
│   ├── js/
│   │   ├── app.jsx              # React entry point
│   │   ├── components/          # React components
│   │   │   ├── ui/              # Reusable UI components
│   │   │   └── layout/          # Layout components
│   │   ├── pages/               # Page components (14 routes)
│   │   ├── context/             # React contexts (Auth, etc)
│   │   ├── hooks/               # Custom React hooks
│   │   └── lib/                 # Utilities & mock data
│   ├── views/
│   │   └── app.blade.php        # React root template
│   └── css/
│       └── app.css              # Tailwind config + design tokens
├── routes/
│   ├── web.php                  # SPA routing
│   └── api.php                  # API routes (to create)
├── database/
│   ├── migrations/              # DB migrations
│   └── seeders/                 # DB seeders
├── public/                      # Static assets
├── storage/                     # Laravel storage
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
└── package.json                # Node dependencies
```

## 🚀 Getting Started

### Prerequisites
- PHP 8.2+
- Node.js 18+
- MySQL 8.0+
- Composer
- npm or yarn

### Installation

1. **Clone and setup**
   ```bash
   cd Licensehub
   composer install
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Database setup**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Laravel server
   php artisan serve
   
   # Terminal 2: Vite dev server
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:8000 in your browser
   - Default login: super_admin role

## 🔐 User Roles & Permissions

### 7 User Roles

| Role | Permissions | Use Case |
|------|-----------|----------|
| **Super Admin** | All modules + management | Full platform control |
| **Admin** | All modules except settings | Day-to-day management |
| **Compliance Officer** | Calendar, Reminders, Tasks, Reports | Compliance tracking |
| **Lawyer** | Lawyer Portal, Legal filings | Legal workspace |
| **CA / Accountant** | Tax, VAT, Billing, Accounting | Financial workspace |
| **Client** | Own company workspace | Client self-service |
| **Viewer** | Read-only access to all | Stakeholder reports |

### Testing Different Roles

To test different roles, modify the default user in `resources/js/context/AuthContext.jsx`:

```jsx
const DEFAULT_USER = {
    name: 'Test User',
    email: 'test@licensehub.io',
    role: 'super_admin', // Change this to test different roles
};
```

## 📝 Mock Data

The application includes 10 sample companies with:
- Complete company information (TIN, BIN, RJSC)
- Multiple branches and directors
- Compliance deadlines and status
- Realistic compliance scenarios

Edit `resources/js/lib/mock-data.js` to modify sample data.

## 🎨 Component Library

### UI Components

All components are in `resources/js/components/ui/`:

```jsx
// Button
<Button variant="default|outline|ghost|destructive" size="sm|md|lg|icon">
  Click me
</Button>

// Card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>

// Badge
<Badge variant="default|outline|success|warning|destructive">
  Status
</Badge>

// Input
<Input placeholder="Type here..." />

// Label
<Label>Form Label</Label>
```

### Layout Components

```jsx
// AdminShell - Main layout wrapper
<AdminShell
  title="Page Title"
  subtitle="Optional subtitle"
  requirePermission="dashboard.view"
  actions={<Button>Action</Button>}
>
  Content here
</AdminShell>

// Sidebar - Navigation
<Sidebar collapsed={false} onCollapse={toggleSidebar} />

// Header - Top bar
<Header />
```

## 🔐 Authentication & Authorization

### Using Auth Context

```jsx
import { useAuth, Can } from '@/context/AuthContext';

function MyComponent() {
  const { user, can, setRole } = useAuth();
  
  // Check permission
  if (!can('companies.manage')) {
    return <div>Access Denied</div>;
  }
  
  // Conditional rendering
  return (
    <>
      <p>Welcome {user.name}</p>
      
      <Can permission="companies.manage">
        <button>Manage Companies</button>
      </Can>
    </>
  );
}
```

## 📊 Dashboard

The dashboard includes:
- 4 key metrics (Companies, Upcoming, Overdue, Completed)
- Filings vs. Obligations chart
- Compliance type breakdown chart
- Upcoming deadlines (next 6)
- Quick action cards

## 🔄 API Integration

### Setting up API Calls

Use axios with React Query for data fetching:

```jsx
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const { data, isLoading, error } = useQuery({
  queryKey: ['companies'],
  queryFn: () => axios.get('/api/companies').then(res => res.data),
});
```

### Example API Endpoints (to create)

```
GET    /api/companies
POST   /api/companies
PUT    /api/companies/:id
DELETE /api/companies/:id

GET    /api/compliance-filings
POST   /api/compliance-filings
// ... and more
```

## 🚢 Building for Production

```bash
# Build frontend
npm run build

# Optimize Laravel
php artisan optimize
php artisan view:cache
php artisan config:cache
php artisan route:cache

# Run migrations on production
php artisan migrate --force
```

## 📱 Responsive Design

The application is fully responsive:
- **Desktop**: Full sidebar + content
- **Tablet**: Collapsible sidebar
- **Mobile**: Mobile-optimized layout

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## 🎯 Customization

### Changing Colors

Edit `resources/css/app.css` to modify CSS variables:

```css
:root {
    --color-primary: 0 0% 0%;        /* Change primary color */
    --color-accent: 0 0% 0%;         /* Change accent color */
    --color-background: 0 0% 100%;   /* Change background */
    /* ... more colors ... */
}
```

### Adding New Pages

1. Create page component in `resources/js/pages/YourPage.jsx`
2. Add route in `resources/js/app.jsx`
3. Add sidebar navigation item in `resources/js/components/layout/AdminShell.jsx`
4. Add permission check in auth context

### Adding New Components

Create components in appropriate folders:
- UI components → `resources/js/components/ui/`
- Layout components → `resources/js/components/layout/`
- Page-specific → keep within page folder

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change Vite port
npm run dev -- --port 5174

# Change Laravel port
php artisan serve --port 8001
```

### CSRF Token Missing
Ensure meta tag is in `app.blade.php`:
```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

### React Not Rendering
Check browser console for errors. Ensure:
- `<div id="root"></div>` exists in template
- Vite dev server is running
- No JavaScript errors in console

## 📚 Learning Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Laravel Documentation](https://laravel.com/docs)
- [React Router](https://reactrouter.com)
- [React Query](https://tanstack.com/query/latest)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 📞 Support

For questions or issues:
- Check existing documentation
- Review the code comments
- Check Laravel and React documentation

---

**Built with ❤️ using React + Laravel**
