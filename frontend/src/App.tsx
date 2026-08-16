import type { FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './main-layout/MainLayout';
import { PrimaryLayout } from './main-layout/PrimaryLayout';
import LoginLayout from './main-layout/LoginLayout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CustomersPage } from './pages/CustomersPage';
import { AddCustomerPage } from './pages/AddCustomerPage';
import { CustomerDetailsPage } from './pages/CustomerDetailsPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/auth';
import { UserRole } from './services/authService';

export const App: FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LoginLayout />}>
          <Route path='/login' element={<LoginPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route element={<PrimaryLayout />}>
            <Route path='/' element={<HomePage />} />
            <Route path='/work-orders' element={<WorkOrdersPage />} />
            <Route path='/guide' element={<Navigate to='/' replace />} />

            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN_DISPATCHER]} />}>
              <Route path='/customers' element={<CustomersPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN_DISPATCHER]} />}>
            <Route path='/customers/add' element={<AddCustomerPage />} />
            <Route path='/customers/:id' element={<CustomerDetailsPage />} />
            <Route path='/customers/edit/:id' element={<AddCustomerPage />} />
          </Route>

          <Route path='*' element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
