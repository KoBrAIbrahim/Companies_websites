import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import RoleRoute from './RoleRoute'
import Layout from '../components/Layout'
import Login from '../pages/Login'

// Route-level code splitting: each page ships as its own chunk, so a sales
// account never downloads admin-only page code (and vice versa).
const Orders = lazy(() => import('../pages/Orders'))
const OrderForm = lazy(() => import('../pages/OrderForm'))
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'))
const Users = lazy(() => import('../pages/admin/Users'))
const UserForm = lazy(() => import('../pages/admin/UserForm'))
const Companies = lazy(() => import('../pages/admin/Companies'))
const CompanyForm = lazy(() => import('../pages/admin/CompanyForm'))
const AdminSalary = lazy(() => import('../pages/admin/Salary'))
const AdminAnalysis = lazy(() => import('../pages/admin/Analysis'))
const SalesDashboard = lazy(() => import('../pages/sales/Dashboard'))
const SalesSalary = lazy(() => import('../pages/sales/Salary'))

function RouteFallback() {
  return <div className="full-page-loading">Loading…</div>
}

function Home() {
  const { profile } = useAuth()
  return <Navigate to={profile.role === 'admin' ? '/admin' : '/sales'} replace />
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />

          <Route element={<RoleRoute allow={['admin']} />}>
            <Route element={<Layout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/users/new" element={<UserForm />} />
              <Route path="/admin/users/:id/edit" element={<UserForm />} />
              <Route path="/admin/companies" element={<Companies />} />
              <Route path="/admin/companies/new" element={<CompanyForm />} />
              <Route path="/admin/companies/:id/edit" element={<CompanyForm />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/orders/new" element={<OrderForm />} />
              <Route path="/admin/orders/:id/edit" element={<OrderForm />} />
              <Route path="/admin/salary" element={<AdminSalary />} />
              <Route path="/admin/analysis" element={<AdminAnalysis />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allow={['sales']} />}>
            <Route element={<Layout />}>
              <Route path="/sales" element={<SalesDashboard />} />
              <Route path="/sales/orders" element={<Orders />} />
              <Route path="/sales/orders/new" element={<OrderForm />} />
              <Route path="/sales/orders/:id/edit" element={<OrderForm />} />
              <Route path="/sales/salary" element={<SalesSalary />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
