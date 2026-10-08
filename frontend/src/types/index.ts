export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export type VehicleStatus = "AVAILABLE" | "RESERVED" | "RENTED" | "MAINTENANCE" | "INACTIVE";
export type TransmissionType = "AUTOMATIC" | "MANUAL";
export type FuelType = "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC" | "LPG";
export type BookingStatus = "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type RentalStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "OVERDUE" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type PaymentType = "PAYMENT" | "DEPOSIT" | "DEPOSIT_REFUND" | "REFUND";
export type ExpenseCategory =
  | "MAINTENANCE"
  | "REPAIRS"
  | "FUEL"
  | "INSURANCE"
  | "REGISTRATION"
  | "CLEANING"
  | "SALARIES"
  | "RENT"
  | "UTILITIES"
  | "MARKETING"
  | "OPERATIONAL"
  | "OTHER";
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type ConditionRating = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
export type DamageStatus = "REPORTED" | "UNDER_REVIEW" | "REPAIR_SCHEDULED" | "REPAIRED" | "CLOSED";
export type NotificationType =
  | "BOOKING_PENDING"
  | "RENTAL_OVERDUE"
  | "UPCOMING_RETURN"
  | "UNPAID_BALANCE"
  | "INSURANCE_EXPIRING"
  | "REGISTRATION_EXPIRING"
  | "MAINTENANCE_DUE"
  | "VEHICLE_UNAVAILABLE"
  | "DAMAGE_REPORTED"
  | "SYSTEM";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface VehicleCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  vehicleCount?: number;
  createdAt: string;
}

export interface VehicleImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  categoryId: string;
  category?: VehicleCategory;
  transmission: TransmissionType;
  fuelType: FuelType;
  seats: number;
  doors: number;
  color: string;
  mileage: number;
  dailyRate: string | number;
  weeklyRate?: string | number | null;
  securityDeposit: string | number;
  status: VehicleStatus;
  currentLocation?: string | null;
  insuranceExpiry?: string | null;
  registrationExpiry?: string | null;
  lastServiceDate?: string | null;
  nextServiceDate?: string | null;
  notes?: string | null;
  isActive: boolean;
  images: VehicleImage[];
  createdAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  dateOfBirth?: string | null;
  driverLicenseNumber?: string | null;
  driverLicenseIssueCountry?: string | null;
  driverLicenseExpiry?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customer?: Pick<Customer, "id" | "firstName" | "lastName" | "email" | "phone">;
  vehicleId: string;
  vehicle?: Pick<Vehicle, "id" | "plateNumber" | "brand" | "model" | "year" | "dailyRate" | "status">;
  pickupAt: string;
  returnAt: string;
  pickupLocation: string;
  returnLocation: string;
  dailyRate: string | number;
  rentalDays: number;
  subtotal: string | number;
  tax: string | number;
  discount: string | number;
  additionalFees: string | number;
  securityDeposit: string | number;
  totalAmount: string | number;
  amountPaid: string | number;
  remainingBalance: string | number;
  notes?: string | null;
  status: BookingStatus;
  createdAt: string;
}

export interface Rental {
  id: string;
  rentalNumber: string;
  bookingId?: string | null;
  booking?: { id: string; bookingNumber: string; status: BookingStatus } | null;
  customerId: string;
  customer?: Pick<Customer, "id" | "firstName" | "lastName" | "email" | "phone">;
  vehicleId: string;
  vehicle?: Pick<Vehicle, "id" | "plateNumber" | "brand" | "model" | "year" | "status">;
  checkoutAt: string;
  expectedReturnAt: string;
  actualReturnAt?: string | null;
  startMileage: number;
  returnMileage?: number | null;
  startFuelLevel: number;
  returnFuelLevel?: number | null;
  dailyRate: string | number;
  securityDeposit: string | number;
  additionalCharges: string | number;
  lateFee: string | number;
  mileageFee: string | number;
  fuelFee: string | number;
  damageFee: string | number;
  discount: string | number;
  tax: string | number;
  finalAmount: string | number;
  paymentStatus: PaymentStatus;
  status: RentalStatus;
  notes?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  bookingId?: string | null;
  rentalId?: string | null;
  customerId: string;
  customer?: Pick<Customer, "id" | "firstName" | "lastName">;
  amount: string | number;
  method: PaymentMethod;
  type: PaymentType;
  status: PaymentStatus;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: string | number;
  category: ExpenseCategory;
  description: string;
  vendor?: string | null;
  vehicleId?: string | null;
  vehicle?: Pick<Vehicle, "id" | "plateNumber" | "brand" | "model"> | null;
  isArchived: boolean;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicle?: Pick<Vehicle, "id" | "plateNumber" | "brand" | "model" | "status">;
  serviceType: string;
  serviceDate: string;
  mileage: number;
  cost: string | number;
  provider?: string | null;
  description?: string | null;
  nextServiceDate?: string | null;
  nextServiceMileage?: number | null;
  status: MaintenanceStatus;
}

export interface DamageReport {
  id: string;
  vehicleId: string;
  vehicle?: Pick<Vehicle, "id" | "plateNumber" | "brand" | "model">;
  rentalId?: string | null;
  customerId?: string | null;
  customer?: Pick<Customer, "id" | "firstName" | "lastName"> | null;
  description: string;
  location: string;
  photos?: string[] | null;
  dateReported: string;
  estimatedRepairCost?: string | number | null;
  actualRepairCost?: string | number | null;
  customerResponsible: boolean;
  insuranceInvolved: boolean;
  status: DamageStatus;
}

export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: string | number;
  description?: string | null;
  occurredAt: string;
  relatedPaymentId?: string | null;
  relatedPayment?: { id: string; paymentNumber: string } | null;
  relatedExpenseId?: string | null;
  relatedExpense?: { id: string; description: string } | null;
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  userId?: string | null;
  user?: { id: string; firstName: string; lastName: string; email: string } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxNumber?: string | null;
  currency: string;
  taxPercentage: string | number;
  defaultSecurityDeposit: string | number;
  lateFeePerDay: string | number;
  mileageFeePerUnit: string | number;
  freeMileagePerDay: number;
  fuelChargePerUnit: string | number;
  cancellationPolicy?: string | null;
  rentalTerms?: string | null;
  invoiceFooter?: string | null;
}
