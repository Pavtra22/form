import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Builder } from './pages/Builder';
import { MyForms } from './pages/MyForms';
import { FormResponses } from './pages/FormResponses';

// 1. Create a root route
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// 2. Define routes using createRoute
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Builder, 
});

export const formsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forms',
  component: MyForms,
});

export const builderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/builder',
  component: Builder,
});

// NEW: Edit Route
export const editBuilderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/builder/$formId',
  component: Builder,
});

export const formResponsesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forms/$formId/responses',
  component: FormResponses,
});

// 3. Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute, 
  formsRoute, 
  builderRoute, 
  editBuilderRoute, 
  formResponsesRoute
]);

// 4. Create the router
export const router = createRouter({ routeTree });

// 5. Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}