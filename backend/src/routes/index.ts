import { Router } from "express";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "car-rental-api" });
});

// Module routers are mounted below as each module is implemented.
// Kept in one place so the overall API surface is easy to see at a glance.
import { authRouter } from "../modules/auth/auth.routes";
import { usersRouter } from "../modules/users/users.routes";
import { vehicleCategoriesRouter } from "../modules/vehicleCategories/vehicleCategories.routes";
import { vehiclesRouter } from "../modules/vehicles/vehicles.routes";
import { customersRouter } from "../modules/customers/customers.routes";
import { availabilityRouter } from "../modules/availability/availability.routes";
import { bookingsRouter } from "../modules/bookings/bookings.routes";
import { rentalsRouter } from "../modules/rentals/rentals.routes";
import { inspectionsRouter } from "../modules/inspections/inspections.routes";
import { damagesRouter } from "../modules/damages/damages.routes";
import { paymentsRouter } from "../modules/payments/payments.routes";
import { transactionsRouter } from "../modules/transactions/transactions.routes";
import { expensesRouter } from "../modules/expenses/expenses.routes";
import { maintenanceRouter } from "../modules/maintenance/maintenance.routes";
import { notificationsRouter } from "../modules/notifications/notifications.routes";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes";
import { reportsRouter } from "../modules/reports/reports.routes";
import { settingsRouter } from "../modules/settings/settings.routes";
import { activityRouter } from "../modules/activity/activity.routes";
import { searchRouter } from "../modules/search/search.routes";
import { publicRouter } from "../modules/public/public.routes";

// Customer-facing, unauthenticated website API (fleet browsing + guest booking).
apiRouter.use("/public", publicRouter);

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/vehicle-categories", vehicleCategoriesRouter);
apiRouter.use("/vehicles", vehiclesRouter);
apiRouter.use("/customers", customersRouter);
apiRouter.use("/availability", availabilityRouter);
apiRouter.use("/bookings", bookingsRouter);
apiRouter.use("/rentals", rentalsRouter);
apiRouter.use("/inspections", inspectionsRouter);
apiRouter.use("/damages", damagesRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/transactions", transactionsRouter);
apiRouter.use("/expenses", expensesRouter);
apiRouter.use("/maintenance", maintenanceRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/activity", activityRouter);
apiRouter.use("/search", searchRouter);
