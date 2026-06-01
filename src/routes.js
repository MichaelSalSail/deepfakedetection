import { Navigate, useRoutes } from 'react-router-dom';
// layouts
import DashboardLayout from './layouts/dashboard';
import LogoOnlyLayout from './layouts/LogoOnlyLayout';
//
import DashboardApp from './pages/DashboardApp';
import NotFound from './pages/Page404';

// ----------------------------------------------------------------------

export default function Router() {
  return useRoutes([
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        { index: true, element: <DashboardApp /> }
      ]
    },
    { path: '/home', element: <Navigate to="/" replace /> },
    { path: '/home/app', element: <Navigate to="/" replace /> },
    {
      path: '/404',
      element: <LogoOnlyLayout />,
      children: [
        { index: true, element: <NotFound /> }
      ]
    },
    { path: '*', element: <Navigate to="/404" replace /> }
  ]);
}
