import './bootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/rbac';
import { Toaster } from 'sonner';
import Dashboard from '@/pages/Dashboard';
import Companies from '@/pages/Companies';
import Calendar from '@/pages/Calendar';
import Reminders from '@/pages/Reminders';
import Vault from '@/pages/Vault';
import Share from '@/pages/Share';
import Tax from '@/pages/Tax';
import Lawyer from '@/pages/Lawyer';
import Accountant from '@/pages/Accountant';
import Clients from '@/pages/Clients';
import Tasks from '@/pages/Tasks';
import Workflows from '@/pages/Workflows';
import Billing from '@/pages/Billing';
import Reports from '@/pages/Reports';
import UsersPage from '@/pages/Users';
import RolesPage from '@/pages/Roles';
import Profile from '@/pages/Profile';
import SettingsPage from '@/pages/Settings';
import { LoginScreen } from '@/components/LoginScreen';
import '../css/app.css';

const queryClient = new QueryClient();

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/reminders" element={<Reminders />} />
                <Route path="/vault" element={<Vault />} />
                <Route path="/share" element={<Share />} />
                <Route path="/tax" element={<Tax />} />
                <Route path="/lawyer" element={<Lawyer />} />
                <Route path="/accountant" element={<Accountant />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="*" element={<Dashboard />} />
            </Routes>
            <Toaster position="top-right" richColors visibleToasts={1} duration={2500} closeButton />
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <App />
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
