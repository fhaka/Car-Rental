/* eslint-disable no-console */
import { PrismaClient, Role, TransmissionType, FuelType, VehicleStatus, BookingStatus, RentalStatus, PaymentMethod, PaymentType, ExpenseCategory, MaintenanceStatus, ConditionRating } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { generateBookingNumber, generateRentalNumber, generatePaymentNumber } from "../src/utils/idGenerators";
import { computeBookingTotals, computeRentalDays } from "../src/utils/pricing";

const prisma = new PrismaClient();

function daysFromNow(days: number, hours = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding database...");

  // ---------------------------------------------------------------------
  // Company settings
  // ---------------------------------------------------------------------
  const settingsExisting = await prisma.companySettings.findFirst();
  const settings =
    settingsExisting ??
    (await prisma.companySettings.create({
      data: {
        companyName: "V Car Rent",
        address: "Rruga Myslym Shyri, Tirana, Albania",
        phone: "+355 69 000 0000",
        email: "info@vcarrent.al",
        website: "https://vcarrent.al",
        currency: "USD",
        taxPercentage: 10,
        defaultSecurityDeposit: 200,
        lateFeePerDay: 25,
        mileageFeePerUnit: 0.35,
        freeMileagePerDay: 200,
        fuelChargePerUnit: 2.5,
        cancellationPolicy: "Free cancellation up to 24 hours before pickup. Cancellations within 24 hours forfeit 20% of the total.",
        rentalTerms: "Renter must be 21+ with a valid driver's license held for at least 1 year. Vehicle must be returned with the same fuel level as at pickup.",
        invoiceFooter: "Thank you for renting with V Car Rent.",
      },
    }));

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------
  const password = await hashPassword("Password123!");
  const [admin, manager, employee1, employee2] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@vcarrent.al" },
      update: {},
      create: { email: "admin@vcarrent.al", passwordHash: password, firstName: "Ardit", lastName: "Hoxha", role: Role.ADMIN, phone: "+355691112223" },
    }),
    prisma.user.upsert({
      where: { email: "manager@vcarrent.al" },
      update: {},
      create: { email: "manager@vcarrent.al", passwordHash: password, firstName: "Elira", lastName: "Krasniqi", role: Role.MANAGER, phone: "+355691112224" },
    }),
    prisma.user.upsert({
      where: { email: "employee1@vcarrent.al" },
      update: {},
      create: { email: "employee1@vcarrent.al", passwordHash: password, firstName: "Dritan", lastName: "Berisha", role: Role.EMPLOYEE, phone: "+355691112225" },
    }),
    prisma.user.upsert({
      where: { email: "employee2@vcarrent.al" },
      update: {},
      create: { email: "employee2@vcarrent.al", passwordHash: password, firstName: "Sara", lastName: "Marku", role: Role.EMPLOYEE, phone: "+355691112226" },
    }),
  ]);
  console.log("Users ready:", [admin, manager, employee1, employee2].map((u) => u.email).join(", "));

  // ---------------------------------------------------------------------
  // Vehicle categories
  // ---------------------------------------------------------------------
  const categoryNames = ["Economy", "Compact", "SUV", "Luxury", "Van", "Sports"];
  const categories: Record<string, Awaited<ReturnType<typeof prisma.vehicleCategory.upsert>>> = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.vehicleCategory.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} class vehicles` },
    });
  }

  // ---------------------------------------------------------------------
  // Vehicles
  // ---------------------------------------------------------------------
  const vehicleSeeds = [
    { plate: "AA123BC", vin: "1HGCM82633A004352", brand: "Toyota", model: "Corolla", year: 2023, cat: "Economy", trans: TransmissionType.AUTOMATIC, fuel: FuelType.PETROL, seats: 5, doors: 4, color: "White", rate: 32, status: VehicleStatus.AVAILABLE },
    { plate: "AA124BC", vin: "1HGCM82633A004353", brand: "Hyundai", model: "Elantra", year: 2022, cat: "Economy", trans: TransmissionType.MANUAL, fuel: FuelType.PETROL, seats: 5, doors: 4, color: "Silver", rate: 30, status: VehicleStatus.AVAILABLE },
    { plate: "AA200CD", vin: "2HGCM82633A004354", brand: "Volkswagen", model: "Golf", year: 2023, cat: "Compact", trans: TransmissionType.AUTOMATIC, fuel: FuelType.PETROL, seats: 5, doors: 4, color: "Blue", rate: 38, status: VehicleStatus.AVAILABLE },
    { plate: "AA201CD", vin: "2HGCM82633A004355", brand: "Ford", model: "Focus", year: 2021, cat: "Compact", trans: TransmissionType.MANUAL, fuel: FuelType.DIESEL, seats: 5, doors: 4, color: "Grey", rate: 34, status: VehicleStatus.AVAILABLE },
    { plate: "AA300EF", vin: "3HGCM82633A004356", brand: "Toyota", model: "RAV4", year: 2023, cat: "SUV", trans: TransmissionType.AUTOMATIC, fuel: FuelType.HYBRID, seats: 5, doors: 5, color: "Black", rate: 62, status: VehicleStatus.AVAILABLE },
    { plate: "AA301EF", vin: "3HGCM82633A004357", brand: "Nissan", model: "X-Trail", year: 2022, cat: "SUV", trans: TransmissionType.AUTOMATIC, fuel: FuelType.PETROL, seats: 7, doors: 5, color: "White", rate: 58, status: VehicleStatus.RESERVED },
    { plate: "AA400GH", vin: "4HGCM82633A004358", brand: "Mercedes-Benz", model: "E-Class", year: 2023, cat: "Luxury", trans: TransmissionType.AUTOMATIC, fuel: FuelType.DIESEL, seats: 5, doors: 4, color: "Black", rate: 110, status: VehicleStatus.AVAILABLE },
    { plate: "AA401GH", vin: "4HGCM82633A004359", brand: "BMW", model: "5 Series", year: 2022, cat: "Luxury", trans: TransmissionType.AUTOMATIC, fuel: FuelType.PETROL, seats: 5, doors: 4, color: "Grey", rate: 105, status: VehicleStatus.MAINTENANCE },
    { plate: "AA500IJ", vin: "5HGCM82633A004360", brand: "Mercedes-Benz", model: "Vito", year: 2021, cat: "Van", trans: TransmissionType.MANUAL, fuel: FuelType.DIESEL, seats: 8, doors: 4, color: "White", rate: 75, status: VehicleStatus.AVAILABLE },
    { plate: "AA501IJ", vin: "5HGCM82633A004361", brand: "Ford", model: "Transit", year: 2020, cat: "Van", trans: TransmissionType.MANUAL, fuel: FuelType.DIESEL, seats: 9, doors: 4, color: "Silver", rate: 70, status: VehicleStatus.AVAILABLE },
    { plate: "AA600KL", vin: "6HGCM82633A004362", brand: "Porsche", model: "718 Cayman", year: 2023, cat: "Sports", trans: TransmissionType.AUTOMATIC, fuel: FuelType.PETROL, seats: 2, doors: 2, color: "Red", rate: 180, status: VehicleStatus.AVAILABLE },
    { plate: "AA601KL", vin: "6HGCM82633A004363", brand: "Ford", model: "Mustang", year: 2022, cat: "Sports", trans: TransmissionType.AUTOMATIC, fuel: FuelType.PETROL, seats: 4, doors: 2, color: "Yellow", rate: 150, status: VehicleStatus.RENTED },
  ];

  const vehicles: Record<string, Awaited<ReturnType<typeof prisma.vehicle.upsert>>> = {};
  for (const v of vehicleSeeds) {
    vehicles[v.plate] = await prisma.vehicle.upsert({
      where: { plateNumber: v.plate },
      update: {},
      create: {
        plateNumber: v.plate,
        vin: v.vin,
        brand: v.brand,
        model: v.model,
        year: v.year,
        categoryId: categories[v.cat].id,
        transmission: v.trans,
        fuelType: v.fuel,
        seats: v.seats,
        doors: v.doors,
        color: v.color,
        mileage: 5000 + Math.floor(Math.random() * 40000),
        dailyRate: v.rate,
        weeklyRate: v.rate * 6.5,
        securityDeposit: v.rate * 5,
        status: v.status,
        currentLocation: "Tirana Main Office",
        insuranceExpiry: daysFromNow(120),
        registrationExpiry: daysFromNow(20), // intentionally soon, to exercise the expiry notification rule
        lastServiceDate: daysFromNow(-40),
        nextServiceDate: daysFromNow(5), // intentionally soon, to exercise the maintenance-due notification rule
      },
    });
  }
  console.log(`Seeded ${Object.keys(vehicles).length} vehicles`);

  // ---------------------------------------------------------------------
  // Customers
  // ---------------------------------------------------------------------
  const customerSeeds = [
    { first: "Andi", last: "Kola", email: "andi.kola@example.com", phone: "+355672000001" },
    { first: "Blerta", last: "Shehu", email: "blerta.shehu@example.com", phone: "+355672000002" },
    { first: "Gentian", last: "Meta", email: "gentian.meta@example.com", phone: "+355672000003" },
    { first: "Klea", last: "Domi", email: "klea.domi@example.com", phone: "+355672000004" },
    { first: "Erind", last: "Bushi", email: "erind.bushi@example.com", phone: "+355672000005" },
    { first: "Fjona", last: "Cara", email: "fjona.cara@example.com", phone: "+355672000006" },
    { first: "Marsel", last: "Gega", email: "marsel.gega@example.com", phone: "+355672000007" },
    { first: "Vera", last: "Nika", email: "vera.nika@example.com", phone: "+355672000008" },
  ];
  const customers: Record<string, Awaited<ReturnType<typeof prisma.customer.upsert>>> = {};
  for (const c of customerSeeds) {
    customers[c.email] = await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: {
        firstName: c.first,
        lastName: c.last,
        email: c.email,
        phone: c.phone,
        address: "Rruga e Kavajes",
        city: "Tirana",
        country: "Albania",
        dateOfBirth: new Date(1990, 3, 12),
        driverLicenseNumber: `AL-DL-${Math.floor(100000 + Math.random() * 899999)}`,
        driverLicenseIssueCountry: "Albania",
        driverLicenseExpiry: daysFromNow(365 * 2),
        idType: "Passport",
        idNumber: `P${Math.floor(1000000 + Math.random() * 8999999)}`,
        emergencyContactName: "Family Contact",
        emergencyContactPhone: "+355672099999",
      },
    });
  }
  console.log(`Seeded ${Object.keys(customers).length} customers`);

  const custList = Object.values(customers);
  const taxPct = Number(settings.taxPercentage);

  // ---------------------------------------------------------------------
  // Helper to create a booking with correctly computed totals
  // ---------------------------------------------------------------------
  async function seedBooking(opts: {
    customerId: string;
    vehicle: typeof vehicles[string];
    pickupAt: Date;
    returnAt: Date;
    status: BookingStatus;
    createdById: string;
    amountPaidRatio?: number;
  }) {
    const rentalDays = computeRentalDays(opts.pickupAt, opts.returnAt);
    const dailyRate = Number(opts.vehicle.dailyRate);
    const { subtotal, tax, totalAmount } = computeBookingTotals({ dailyRate, rentalDays, taxPercentage: taxPct, discount: 0, additionalFees: 0 });
    const amountPaid = Math.round(totalAmount * (opts.amountPaidRatio ?? 0) * 100) / 100;
    return prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        customerId: opts.customerId,
        vehicleId: opts.vehicle.id,
        categoryId: opts.vehicle.categoryId,
        pickupAt: opts.pickupAt,
        returnAt: opts.returnAt,
        pickupLocation: "Tirana Main Office",
        returnLocation: "Tirana Main Office",
        dailyRate,
        rentalDays,
        subtotal,
        tax,
        discount: 0,
        additionalFees: 0,
        securityDeposit: Number(opts.vehicle.securityDeposit),
        totalAmount,
        amountPaid,
        remainingBalance: Math.max(0, totalAmount - amountPaid),
        status: opts.status,
        createdById: opts.createdById,
      },
    });
  }

  // Pending booking (awaiting confirmation)
  await seedBooking({
    customerId: custList[0].id,
    vehicle: vehicles["AA123BC"],
    pickupAt: daysFromNow(3),
    returnAt: daysFromNow(6),
    status: BookingStatus.PENDING,
    createdById: employee1.id,
  });

  // Confirmed booking (reserved vehicle already reflects RESERVED status above)
  const confirmedBooking = await seedBooking({
    customerId: custList[1].id,
    vehicle: vehicles["AA301EF"],
    pickupAt: daysFromNow(2),
    returnAt: daysFromNow(5),
    status: BookingStatus.CONFIRMED,
    createdById: employee1.id,
    amountPaidRatio: 0.3,
  });

  // Cancelled booking
  await seedBooking({
    customerId: custList[2].id,
    vehicle: vehicles["AA400GH"],
    pickupAt: daysFromNow(10),
    returnAt: daysFromNow(13),
    status: BookingStatus.CANCELLED,
    createdById: employee2.id,
  });

  // ---------------------------------------------------------------------
  // Active rental (currently out, matches AA601KL RENTED status)
  // ---------------------------------------------------------------------
  const activeVehicle = vehicles["AA601KL"];
  const activeRentalDays = 3;
  await prisma.rental.create({
    data: {
      rentalNumber: generateRentalNumber(),
      customerId: custList[3].id,
      vehicleId: activeVehicle.id,
      checkoutAt: daysFromNow(-1),
      expectedReturnAt: daysFromNow(2),
      startMileage: activeVehicle.mileage,
      startFuelLevel: 100,
      initialCondition: { cleanliness: ConditionRating.EXCELLENT, exteriorCondition: ConditionRating.EXCELLENT, interiorCondition: ConditionRating.EXCELLENT, tireCondition: ConditionRating.GOOD, windshieldCondition: ConditionRating.EXCELLENT },
      dailyRate: Number(activeVehicle.dailyRate),
      securityDeposit: Number(activeVehicle.securityDeposit),
      status: RentalStatus.ACTIVE,
      checkedOutById: employee1.id,
    },
  });

  // Overdue rental
  const overdueVehicleSeed = vehicles["AA500IJ"];
  await prisma.vehicle.update({ where: { id: overdueVehicleSeed.id }, data: { status: VehicleStatus.RENTED } });
  await prisma.rental.create({
    data: {
      rentalNumber: generateRentalNumber(),
      customerId: custList[4].id,
      vehicleId: overdueVehicleSeed.id,
      checkoutAt: daysFromNow(-5),
      expectedReturnAt: daysFromNow(-1),
      startMileage: overdueVehicleSeed.mileage,
      startFuelLevel: 90,
      initialCondition: { cleanliness: ConditionRating.GOOD, exteriorCondition: ConditionRating.GOOD, interiorCondition: ConditionRating.GOOD, tireCondition: ConditionRating.GOOD, windshieldCondition: ConditionRating.GOOD },
      dailyRate: Number(overdueVehicleSeed.dailyRate),
      securityDeposit: Number(overdueVehicleSeed.securityDeposit),
      status: RentalStatus.OVERDUE,
      checkedOutById: employee2.id,
    },
  });

  // ---------------------------------------------------------------------
  // Completed rental with full financial trail (historical, for reports/dashboard)
  // ---------------------------------------------------------------------
  const completedVehicle = vehicles["AA124BC"];
  const completedBooking = await seedBooking({
    customerId: custList[5].id,
    vehicle: completedVehicle,
    pickupAt: daysFromNow(-10),
    returnAt: daysFromNow(-7),
    status: BookingStatus.COMPLETED,
    createdById: employee1.id,
    amountPaidRatio: 1,
  });
  const completedRental = await prisma.rental.create({
    data: {
      rentalNumber: generateRentalNumber(),
      bookingId: completedBooking.id,
      customerId: custList[5].id,
      vehicleId: completedVehicle.id,
      checkoutAt: daysFromNow(-10),
      expectedReturnAt: daysFromNow(-7),
      actualReturnAt: daysFromNow(-7, 11),
      startMileage: completedVehicle.mileage,
      returnMileage: completedVehicle.mileage + 340,
      startFuelLevel: 100,
      returnFuelLevel: 85,
      initialCondition: { cleanliness: ConditionRating.EXCELLENT, exteriorCondition: ConditionRating.EXCELLENT, interiorCondition: ConditionRating.EXCELLENT, tireCondition: ConditionRating.EXCELLENT, windshieldCondition: ConditionRating.EXCELLENT },
      returnedCondition: { cleanliness: ConditionRating.GOOD, exteriorCondition: ConditionRating.GOOD, interiorCondition: ConditionRating.GOOD, tireCondition: ConditionRating.GOOD, windshieldCondition: ConditionRating.GOOD },
      dailyRate: Number(completedVehicle.dailyRate),
      securityDeposit: Number(completedVehicle.securityDeposit),
      lateFee: 0,
      mileageFee: 0,
      fuelFee: 37.5,
      damageFee: 0,
      finalAmount: Number(completedBooking.totalAmount) + 37.5,
      paymentStatus: "COMPLETED",
      status: RentalStatus.COMPLETED,
      checkedOutById: employee1.id,
      checkedInById: employee2.id,
    },
  });

  // Payments for the completed rental/booking
  await prisma.$transaction([
    prisma.payment.create({
      data: {
        paymentNumber: generatePaymentNumber(),
        bookingId: completedBooking.id,
        rentalId: completedRental.id,
        customerId: custList[5].id,
        amount: Number(completedBooking.totalAmount),
        method: PaymentMethod.CARD,
        type: PaymentType.PAYMENT,
        status: "COMPLETED",
        receivedById: employee1.id,
      },
    }),
    prisma.transaction.create({
      data: { type: "INCOME", category: "PAYMENT", amount: Number(completedBooking.totalAmount), description: `Booking ${completedBooking.bookingNumber} payment`, occurredAt: daysFromNow(-10) },
    }),
    prisma.payment.create({
      data: {
        paymentNumber: generatePaymentNumber(),
        rentalId: completedRental.id,
        customerId: custList[5].id,
        amount: 37.5,
        method: PaymentMethod.CASH,
        type: PaymentType.PAYMENT,
        status: "COMPLETED",
        receivedById: employee2.id,
        notes: "Fuel top-up charge",
      },
    }),
    prisma.transaction.create({
      data: { type: "INCOME", category: "PAYMENT", amount: 37.5, description: "Fuel charge on return", occurredAt: daysFromNow(-7) },
    }),
  ]);

  // Deposit payment for the confirmed (upcoming) booking
  await prisma.payment.create({
    data: {
      paymentNumber: generatePaymentNumber(),
      bookingId: confirmedBooking.id,
      customerId: custList[1].id,
      amount: Number(confirmedBooking.securityDeposit),
      method: PaymentMethod.CARD,
      type: PaymentType.DEPOSIT,
      status: "COMPLETED",
      receivedById: employee1.id,
    },
  });

  // ---------------------------------------------------------------------
  // Expenses (with linked transactions)
  // ---------------------------------------------------------------------
  const expenseSeeds: { category: ExpenseCategory; amount: number; description: string; vendor: string; daysAgo: number; vehiclePlate?: string }[] = [
    { category: ExpenseCategory.FUEL, amount: 120, description: "Fleet refueling", vendor: "Kastrati Fuel", daysAgo: 1 },
    { category: ExpenseCategory.MAINTENANCE, amount: 340, description: "Brake pad replacement", vendor: "AutoTech Tirana", daysAgo: 6, vehiclePlate: "AA401GH" },
    { category: ExpenseCategory.INSURANCE, amount: 890, description: "Quarterly fleet insurance premium", vendor: "SIGAL Uniqa", daysAgo: 15 },
    { category: ExpenseCategory.CLEANING, amount: 45, description: "Detailing service", vendor: "CleanCar", daysAgo: 2 },
    { category: ExpenseCategory.SALARIES, amount: 2200, description: "Staff salaries - this month", vendor: "Payroll", daysAgo: 3 },
    { category: ExpenseCategory.MARKETING, amount: 150, description: "Social media ad campaign", vendor: "Meta Ads", daysAgo: 8 },
    { category: ExpenseCategory.RENT, amount: 900, description: "Office & lot rent", vendor: "Landlord", daysAgo: 20 },
    { category: ExpenseCategory.UTILITIES, amount: 130, description: "Electricity & water", vendor: "OSHEE", daysAgo: 12 },
  ];
  for (const e of expenseSeeds) {
    const expense = await prisma.expense.create({
      data: {
        date: daysFromNow(-e.daysAgo),
        amount: e.amount,
        category: e.category,
        description: e.description,
        vendor: e.vendor,
        vehicleId: e.vehiclePlate ? vehicles[e.vehiclePlate].id : undefined,
        createdById: manager.id,
      },
    });
    await prisma.transaction.create({
      data: { type: "EXPENSE", category: e.category, amount: e.amount, description: e.description, occurredAt: expense.date, relatedExpenseId: expense.id },
    });
  }
  console.log("Seeded expenses & transactions");

  // ---------------------------------------------------------------------
  // Maintenance records
  // ---------------------------------------------------------------------
  await prisma.maintenanceRecord.create({
    data: {
      vehicleId: vehicles["AA401GH"].id,
      serviceType: "Brake service",
      serviceDate: daysFromNow(-6),
      mileage: vehicles["AA401GH"].mileage,
      cost: 340,
      provider: "AutoTech Tirana",
      description: "Front brake pads and rotors replaced",
      nextServiceDate: daysFromNow(150),
      status: MaintenanceStatus.IN_PROGRESS,
    },
  });
  await prisma.maintenanceRecord.create({
    data: {
      vehicleId: vehicles["AA123BC"].id,
      serviceType: "Oil change",
      serviceDate: daysFromNow(5),
      mileage: vehicles["AA123BC"].mileage,
      cost: 60,
      provider: "Toyota Service Center",
      description: "Routine oil and filter change",
      status: MaintenanceStatus.SCHEDULED,
    },
  });
  await prisma.maintenanceRecord.create({
    data: {
      vehicleId: vehicles["AA300EF"].id,
      serviceType: "Tire rotation",
      serviceDate: daysFromNow(-30),
      mileage: vehicles["AA300EF"].mileage - 1000,
      cost: 40,
      provider: "QuickFix Garage",
      description: "Tire rotation and balancing",
      status: MaintenanceStatus.COMPLETED,
      nextServiceDate: daysFromNow(60),
    },
  });
  console.log("Seeded maintenance records");

  // ---------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      { type: "MAINTENANCE_DUE", title: "Maintenance due soon", message: `${vehicles["AA123BC"].brand} ${vehicles["AA123BC"].model} (${vehicles["AA123BC"].plateNumber}) has an oil change scheduled soon.`, relatedEntityType: "Vehicle", relatedEntityId: vehicles["AA123BC"].id },
      { type: "REGISTRATION_EXPIRING", title: "Registration expiring soon", message: "Several vehicles have registration expiring within 30 days.", relatedEntityType: "Vehicle", relatedEntityId: vehicles["AA123BC"].id },
      { type: "SYSTEM", title: "Welcome to V Car Rent", message: "Your car rental management system is set up and ready to go.", relatedEntityType: "System", relatedEntityId: "system" },
    ],
  });
  console.log("Seeded notifications");

  console.log("\nSeed complete. Login with:");
  console.log("  Admin:    admin@vcarrent.al / Password123!");
  console.log("  Manager:  manager@vcarrent.al / Password123!");
  console.log("  Employee: employee1@vcarrent.al / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
