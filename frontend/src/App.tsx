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
import { AddAssetPage } from './pages/AddAssetPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { CreateWorkOrderPage } from './pages/CreateWorkOrderPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './components/auth';
import { UserRole } from './services/authService';
import { useNetwork } from './context/NetworkContext';

const AppRoutes: FC = () => {
  const { reconnectCount } = useNetwork();

  return (
    <Routes key={`routes-reconnect-${reconnectCount}`}>
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
          <Route path='/customers/:customerId/assets/add' element={<AddAssetPage />} />
          <Route path='/customers/:customerId/assets/edit/:id' element={<AddAssetPage />} />
          <Route path='/work-orders/add' element={<CreateWorkOrderPage />} />
          <Route path='/work-orders/edit/:id' element={<CreateWorkOrderPage />} />
        </Route>

        <Route path='*' element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export const App: FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
