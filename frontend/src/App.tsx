import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { authApi } from "./features/auth/api";
import { ProtectedRoute, RoleGuard } from "./routes/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";

import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

import DashboardPage from "./pages/dashboard/DashboardPage";

import VehiclesListPage from "./pages/vehicles/VehiclesListPage";
import VehicleFormPage from "./pages/vehicles/VehicleFormPage";
import VehicleDetailPage from "./pages/vehicles/VehicleDetailPage";
import CategoriesPage from "./pages/categories/CategoriesPage";
import MaintenancePage from "./pages/maintenance/MaintenancePage";
import InspectionsPage from "./pages/inspections/InspectionsPage";
import DamagesPage from "./pages/damages/DamagesPage";

import CustomersListPage from "./pages/customers/CustomersListPage";
import CustomerFormPage from "./pages/customers/CustomerFormPage";
import CustomerDetailPage from "./pages/customers/CustomerDetailPage";

import BookingsListPage from "./pages/bookings/BookingsListPage";
import BookingFormPage from "./pages/bookings/BookingFormPage";
import BookingDetailPage from "./pages/bookings/BookingDetailPage";

import AvailabilityPage from "./pages/availability/AvailabilityPage";

import RentalsListPage from "./pages/rentals/RentalsListPage";
import RentalDetailPage from "./pages/rentals/RentalDetailPage";
import RentalCheckoutPage from "./pages/rentals/RentalCheckoutPage";

import PaymentsPage from "./pages/payments/PaymentsPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import ExpensesPage from "./pages/expenses/ExpensesPage";

import ReportsPage from "./pages/reports/ReportsPage";

import UsersPage from "./pages/admin/UsersPage";
import NotificationsPage from "./pages/admin/NotificationsPage";
import ActivityLogPage from "./pages/admin/ActivityLogPage";
import SettingsPage from "./pages/admin/SettingsPage";
import ProfilePage from "./pages/profile/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

import { PublicLayout } from "./public/PublicLayout";
import { HomePage } from "./public/HomePage";
import { FleetPage } from "./public/FleetPage";
import { CarDetailPage } from "./public/CarDetailPage";
import { BookingPage } from "./public/BookingPage";
import { AboutPage } from "./public/AboutPage";
import { ContactPage } from "./public/ContactPage";

export default function App() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setInitializing = useAuthStore((s) => s.setInitializing);

  useEffect(() => {
    // Silently restore the session on hard reload using the httpOnly refresh cookie.
    authApi
      .refresh()
      .then((data) => setAuth(data.user, data.accessToken))
      .catch(() => {})
      .finally(() => setInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      {/* Public customer-facing website */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/fleet/:id" element={<CarDetailPage />} />
        <Route path="/book/:vehicleId" element={<BookingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/vehicles" element={<VehiclesListPage />} />
          <Route path="/vehicles/new" element={<VehicleFormPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/inspections" element={<InspectionsPage />} />
          <Route path="/damages" element={<DamagesPage />} />

          <Route path="/customers" element={<CustomersListPage />} />
          <Route path="/customers/new" element={<CustomerFormPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/customers/:id/edit" element={<CustomerFormPage />} />

          <Route path="/bookings" element={<BookingsListPage />} />
          <Route path="/bookings/new" element={<BookingFormPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/bookings/:id/edit" element={<BookingFormPage />} />

          <Route path="/availability" element={<AvailabilityPage />} />

          <Route path="/rentals" element={<RentalsListPage />} />
          <Route path="/rentals/checkout" element={<RentalCheckoutPage />} />
          <Route path="/rentals/:id" element={<RentalDetailPage />} />

          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />

          <Route path="/reports" element={<ReportsPage />} />

          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<RoleGuard allow={["ADMIN"]} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route element={<RoleGuard allow={["ADMIN", "MANAGER"]} />}>
            <Route path="/activity" element={<ActivityLogPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
