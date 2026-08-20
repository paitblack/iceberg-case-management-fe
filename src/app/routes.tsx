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
        path: 'settings',
        element: (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-500 text-sm">
              Lifesycle integration, organization tenant mapping, and webhook
              triggers.
            </p>
          </div>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
