/**
 * Attaches fleet photos to vehicles. Idempotent: for every image file in
 * `uploads/vehicles/<plateNumber>.<ext>` it (re)sets that vehicle's primary
 * image to the matching file. Re-running replaces, never duplicates.
 *
 * Add a real photo for a vehicle by dropping `<plateNumber>.jpg` into
 * uploads/vehicles and running `npm run seed:images --workspace=backend`.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dir = path.join(process.cwd(), "uploads", "vehicles");

async function main() {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)) : [];
  if (files.length === 0) {
    console.log(`No image files found in ${dir}. Nothing to do.`);
    return;
  }

  const byPlate = new Map(files.map((f) => [path.parse(f).name, f]));
  const vehicles = await prisma.vehicle.findMany({ select: { id: true, plateNumber: true, brand: true, model: true } });

  let count = 0;
  for (const v of vehicles) {
    const file = byPlate.get(v.plateNumber);
    if (!file) continue;
    const url = `/uploads/vehicles/${file}`;
    await prisma.$transaction([
      prisma.vehicleImage.deleteMany({ where: { vehicleId: v.id } }),
      prisma.vehicleImage.create({ data: { vehicleId: v.id, url, isPrimary: true } }),
    ]);
    count++;
    console.log(`  ${v.plateNumber}  ${v.brand} ${v.model}  ->  ${url}`);
  }

  console.log(`\nAttached photos to ${count} of ${vehicles.length} vehicle(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
