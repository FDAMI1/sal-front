import { lazy } from "react";

/**
 * Route-level screens and portal shells, each loaded on first visit. Kept in
 * one place so the router stays a plain route table, and so the customer QR
 * pages never pull in dashboard code.
 */
export const StaffPortal = lazy(() => import("./StaffPortal"));
export const AdminPortal = lazy(() => import("./AdminPortal"));

export const SystemStatusScreen = lazy(
  () => import("@modules/system/screens/SystemStatusScreen"),
);
export const LoginScreen = lazy(
  () => import("@modules/auth/screens/LoginScreen"),
);
export const ForgotPasswordScreen = lazy(
  () => import("@modules/auth/screens/ForgotPasswordScreen"),
);
export const ResetPasswordScreen = lazy(
  () => import("@modules/auth/screens/ResetPasswordScreen"),
);
export const ProfileScreen = lazy(
  () => import("@modules/auth/screens/ProfileScreen"),
);
export const AdminLoginScreen = lazy(
  () => import("@modules/admin/screens/AdminLoginScreen"),
);
export const RegisterSalonScreen = lazy(
  () => import("@modules/salon/screens/RegisterSalonScreen"),
);
export const SalonSettingsScreen = lazy(
  () => import("@modules/salon/screens/SalonSettingsScreen"),
);
export const ServicesScreen = lazy(
  () => import("@modules/salon/screens/ServicesScreen"),
);
export const DashboardScreen = lazy(
  () => import("@modules/dashboard/screens/DashboardScreen"),
);
export const QrCodeScreen = lazy(
  () => import("@modules/qr/screens/QrCodeScreen"),
);
export const StaffScreen = lazy(
  () => import("@modules/staff/screens/StaffScreen"),
);
export const StaffDetailScreen = lazy(
  () => import("@modules/staff/screens/StaffDetailScreen"),
);
export const UserDeviceScreen = lazy(
  () => import("@modules/staff/screens/UserDeviceScreen"),
);
export const SalonsScreen = lazy(
  () => import("@modules/admin/screens/SalonsScreen"),
);
export const SalonDetailScreen = lazy(
  () => import("@modules/admin/screens/SalonDetailScreen"),
);
export const PlansScreen = lazy(
  () => import("@modules/admin/screens/PlansScreen"),
);
export const CatalogScreen = lazy(
  () => import("@modules/admin/screens/CatalogScreen"),
);
export const TrackingScreen = lazy(
  () => import("@modules/public/screens/TrackingScreen"),
);
export const QueueScreen = lazy(
  () => import("@modules/queue/screens/QueueScreen"),
);
export const BookingsScreen = lazy(
  () => import("@modules/bookings/screens/BookingsScreen"),
);
export const SalonPageScreen = lazy(
  () => import("@modules/public/screens/SalonPageScreen"),
);
export const CustomersScreen = lazy(
  () => import("@modules/customers/screens/CustomersScreen"),
);
export const AppointmentsScreen = lazy(
  () => import("@modules/bookings/screens/AppointmentsScreen"),
);
export const RemindersScreen = lazy(() =>
  import("@modules/bookings/screens/AppointmentsScreen").then((m) => ({
    default: m.RemindersScreen,
  })),
);
export const SalesReportScreen = lazy(
  () => import("@modules/reports/screens/SalesReportScreen"),
);
export const StaffPerformanceScreen = lazy(() =>
  import("@modules/reports/screens/PerformanceScreens").then((m) => ({
    default: m.StaffPerformanceScreen,
  })),
);
export const ServiceReportScreen = lazy(() =>
  import("@modules/reports/screens/PerformanceScreens").then((m) => ({
    default: m.ServiceReportScreen,
  })),
);
export const ExpensesScreen = lazy(
  () => import("@modules/billing/screens/ExpensesScreen"),
);
export const NotificationsScreen = lazy(
  () => import("@modules/notifications/screens/NotificationScreens"),
);
export const SoundSettingsScreen = lazy(() =>
  import("@modules/notifications/screens/NotificationScreens").then((m) => ({
    default: m.SoundSettingsScreen,
  })),
);
export const FeaturesHubScreen = lazy(() =>
  import("./MenuHubScreens").then((m) => ({ default: m.FeaturesHubScreen })),
);
export const SettingsHubScreen = lazy(() =>
  import("./MenuHubScreens").then((m) => ({ default: m.SettingsHubScreen })),
);
export const QrSettingsScreen = lazy(() =>
  import("@modules/qr/screens/QrCodeScreen").then((m) => ({
    default: m.QrSettingsScreen,
  })),
);
