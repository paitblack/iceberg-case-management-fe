import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CasesPage } from '../features/cases/CasesPage';
import { CaseWorkspacePage } from '../features/cases/CaseWorkspacePage';
import { TemplatesPage } from '../features/templates/TemplatesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'cases',
        element: <CasesPage />,
      },
      {
        path: 'cases/:caseId',
        element: <CaseWorkspacePage />,
      },
      {
        path: 'sales-progression',
        element: <CasesPage />,
      },
      {
        path: 'templates',
        element: <TemplatesPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
