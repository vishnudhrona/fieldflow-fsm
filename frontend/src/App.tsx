import { lazy, Suspense, type FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { MainLayout } from './main-layout/MainLayout';
import { PrimaryLayout } from './main-layout/PrimaryLayout';
import LoginLayout from './main-layout/LoginLayout';
import { ProtectedRoute } from './components/auth';
import { UserRole } from './services/authService';
import { useNetwork } from './context/NetworkContext';
import ErrorBoundary from './components/common/ErrorBoundary';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const AddCustomerPage = lazy(() => import('./pages/AddCustomerPage'));
const CustomerDetailsPage = lazy(() => import('./pages/CustomerDetailsPage'));
const AddAssetPage = lazy(() => import('./pages/AddAssetPage'));
const WorkOrdersPage = lazy(() => import('./pages/WorkOrdersPage'));
const WorkOrderDetailsPage = lazy(() => import('./pages/WorkOrderDetailsPage'));
const CreateWorkOrderPage = lazy(() => import('./pages/CreateWorkOrderPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader: FC = () => (
  <div className='min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500 py-16 animate-fade-in'>
    <div className='w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#D12026] shadow-xs'>
      <Loader2 className='w-5 h-5 animate-spin stroke-[2.5]' />
    </div>
    <span className='text-xs font-semibold text-slate-400'>Loading workspace...</span>
  </div>
);

const AppRoutes: FC = () => {
  const { reconnectCount } = useNetwork();

  return (
    <Suspense fallback={<PageLoader />}>
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
            <Route path='/profile' element={<ProfilePage />} />
            <Route path='/guide' element={<Navigate to='/' replace />} />

            <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN_DISPATCHER]} />}>
              <Route path='/customers' element={<CustomersPage />} />
            </Route>
          </Route>

          <Route path='/work-orders/:id' element={<WorkOrderDetailsPage />} />

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
    </Suspense>
  );
};

export const App: FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
