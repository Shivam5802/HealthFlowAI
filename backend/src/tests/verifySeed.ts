import { prisma } from '../repositories/prisma.js';

async function verifyDatabase() {
  console.log('--- HEALTHFLOW AI DATABASE VERIFICATION ---');
  const facilities = await prisma.facility.findMany();
  console.log(`Facilities count: ${facilities.length}`);

  const resources = await prisma.resource.findMany();
  console.log(`Resources count: ${resources.length}`);

  const users = await prisma.user.findMany({
    select: { email: true, role: true, employeeId: true, facilityId: true },
  });
  console.log('Seeded Users:');
  users.forEach((u) => console.log(`  - [${u.role}] ${u.email} (${u.employeeId})`));

  const inventories = await prisma.inventory.findMany({
    include: { facility: true, resource: true },
  });
  console.log(`Total inventory lines: ${inventories.length}`);

  const demoItems = inventories.filter((i) => i.resource.name.includes('Medicine X'));
  console.log('Deliberate Demo Scenario (Medicine X):');
  demoItems.forEach((i) => {
    const days = i.dailyConsumption > 0 ? (i.quantity / i.dailyConsumption).toFixed(1) : 'INF';
    console.log(`  - ${i.facility.name}: Stock = ${i.quantity}, Daily = ${i.dailyConsumption}, Safety = ${i.safetyStock}, Days Remaining = ~${days}d`);
  });

  const demandCount = await prisma.patientDemand.count();
  console.log(`Historical patient demand records: ${demandCount}`);

  const alertCount = await prisma.alert.count();
  console.log(`Active/Recorded alerts count: ${alertCount}`);

  const transferCount = await prisma.transfer.count();
  console.log(`Transfers in database: ${transferCount}`);

  const predictions = await prisma.prediction.count();
  console.log(`Predictions count: ${predictions}`);
  console.log('--- VERIFICATION COMPLETE ---');
}

verifyDatabase()
  .catch((err) => console.error('Verification error:', err))
  .finally(() => prisma.$disconnect());
