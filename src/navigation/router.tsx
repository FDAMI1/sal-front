import { Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import NotFoundScreen from "@modules/system/screens/NotFoundScreen";
import RouteErrorScreen from "@modules/system/screens/RouteErrorScreen";
import { Skeleton } from "@shared/ui";
import { SALON_NAV, SALON_TABS, WORKER_NAV, WORKER_TABS } from "./navItems";
import {
  AdminLoginScreen,
  AdminPortal,
  AppointmentsScreen,
  FeaturesHubScreen,
  QrSettingsScreen,
  SettingsHubScreen,
  CustomersScreen,
  ExpensesScreen,
  NotificationsScreen,
  RemindersScreen,
  SalesReportScreen,
  ServiceReportScreen,
  SoundSettingsScreen,
  StaffPerformanceScreen,
  BookingsScreen,
  CatalogScreen,
  DashboardScreen,
  PlansScreen,
  RegisterSalonScreen,
  SalonDetailScreen,
  SalonSettingsScreen,
  SalonsScreen,
  ForgotPasswordScreen,
  LoginScreen,
  ProfileScreen,
  QrCodeScreen,
  QueueScreen,
  ResetPasswordScreen,
  SalonPageScreen,
  ServicesScreen,
  StaffDetailScreen,
  StaffScreen,
  TrackingScreen,
  UserDeviceScreen,
  StaffPortal,
  SystemStatusScreen,
} from "./lazyScreens";

/** Full-page fallback for lazily loaded pages outside a portal shell. */
const page = (element: ReactNode) => (
  <Suspense
    fallback={
      <div
        className="mx-auto max-w-sm px-4 py-24"
        aria-busy="true"
        aria-label="Loading"
      >
        <Skeleton className="h-72 w-full" />
      </div>
    }
  >
    {element}
  </Suspense>
);

/**
 * Every route sits under one parent whose errorElement catches a screen
 * that throws while rendering, so a bug shows a way back, not a blank page.
 */
export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorScreen />,
    children: routes(),
  },
]);

function routes() {
  return [
    // The sign-in page sends a signed-in user on to their own portal.
    { path: "/", element: <Navigate to="/login" replace /> },
    { path: "/login", element: page(<LoginScreen />) },
    { path: "/forgot-password", element: page(<ForgotPasswordScreen />) },
    { path: "/reset-password", element: page(<ResetPasswordScreen />) },
    {
      path: "/app",
      element: page(
        <StaffPortal role="salon_admin" items={SALON_NAV} tabs={SALON_TABS} />,
      ),
      children: [
        // Salon admins land on their business dashboard. System status is
        // the super admin's (/admin) and its API refuses salon tokens.
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: "dashboard", element: <DashboardScreen /> },
        { path: "staff", element: <StaffScreen /> },
        { path: "staff/:staffId", element: <StaffDetailScreen /> },
        { path: "services", element: <ServicesScreen /> },
        { path: "bookings", element: <BookingsScreen /> },
        { path: "queue", element: <QueueScreen /> },
        { path: "qr", element: <QrCodeScreen /> },
        { path: "qr/settings", element: <QrSettingsScreen /> },
        { path: "features", element: <FeaturesHubScreen /> },
        { path: "settings", element: <SettingsHubScreen /> },
        { path: "salon", element: <SalonSettingsScreen /> },
        { path: "customers", element: <CustomersScreen /> },
        { path: "appointments", element: <AppointmentsScreen /> },
        { path: "reports/sales", element: <SalesReportScreen /> },
        { path: "reports/staff", element: <StaffPerformanceScreen /> },
        { path: "reports/services", element: <ServiceReportScreen /> },
        { path: "expenses", element: <ExpensesScreen /> },
        { path: "notifications", element: <NotificationsScreen /> },
        { path: "reminders", element: <RemindersScreen /> },
        { path: "settings/access", element: <UserDeviceScreen /> },
        { path: "settings/sound", element: <SoundSettingsScreen /> },
        { path: "account", element: <ProfileScreen /> },
      ],
    },
    {
      path: "/worker",
      element: page(
        <StaffPortal role="worker" items={WORKER_NAV} tabs={WORKER_TABS} />,
      ),
      children: [
        { index: true, element: <QueueScreen /> },
        { path: "account", element: <ProfileScreen /> },
      ],
    },
    { path: "/admin/login", element: page(<AdminLoginScreen />) },
    {
      path: "/admin",
      element: page(<AdminPortal />),
      children: [
        { index: true, element: <SystemStatusScreen /> },
        { path: "salons", element: <SalonsScreen /> },
        { path: "salons/:salonId", element: <SalonDetailScreen /> },
        { path: "plans", element: <PlansScreen /> },
        { path: "catalog", element: <CatalogScreen /> },
      ],
    },
    { path: "/register", element: page(<RegisterSalonScreen />) },
    { path: "/s/:code", element: page(<SalonPageScreen />) },
    { path: "/t/:trackingCode", element: page(<TrackingScreen />) },
    { path: "*", element: <NotFoundScreen /> },
  ];
}
