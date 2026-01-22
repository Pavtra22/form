import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { Builder } from './pages/Builder';
import { MyForms } from './pages/MyForms';
import { FormResponses } from './pages/FormResponses'; // NEW IMPORT

export const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// 1. Builder Route (Home)
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Builder,
});

// 2. My Forms Dashboard
export const myFormsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forms',
  component: MyForms,
});

// 3. Form Responses (NEW)
export const formResponsesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forms/$formId/responses',
  component: FormResponses,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  myFormsRoute,
  formResponsesRoute, // Add to route tree
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}