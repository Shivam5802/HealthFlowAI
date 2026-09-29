import { PrismaClient, Role, UserStatus, FacilityType, FacilityStatus, ResourceCategory, RiskLevel, AlertType, AlertSeverity, AlertStatus, TransferStatus, TransferPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function main() {
  console.log('====================================================');
  console.log('HEALTHFLOW AI — POPULATING DEMO / SYNTHETIC DATA');
  console.log('Note: All seed data is synthetic for demonstration.');
  console.log('====================================================');

  // 1. Clean existing records in dependency order
  console.log('Cleaning existing records for safe, idempotent seed...');
  await prisma.auditLog.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.patientDemand.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.facility.deleteMany();

  // 2. Create 25 Realistic Healthcare Facilities
  console.log('Creating 25 healthcare facilities across UP districts...');
  const facilityData = [
    {
      name: 'District General Hospital Lucknow', // Hospital A (Surplus donor)
      type: FacilityType.HOSPITAL,
      address: 'Hazratganj Main Road, Sector 4',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      latitude: 26.8467,
      longitude: 80.9462,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'PHC Bakshi Ka Talab', // PHC B (High shortage risk)
      type: FacilityType.PHC,
      address: 'Village BKT, Sitapur Highway',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      latitude: 27.0125,
      longitude: 80.8924,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'Community Health Centre Malihabad',
      type: FacilityType.CLINIC,
      address: 'Mango Belt Rd, Malihabad',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      latitude: 26.9213,
      longitude: 80.7124,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'Divisional Civil Hospital Varanasi',
      type: FacilityType.HOSPITAL,
      address: 'Cantonment Area, Kashi',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      latitude: 25.3216,
      longitude: 82.9876,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'PHC Shivpur',
      type: FacilityType.PHC,
      address: 'Shivpur Central, GT Road',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      latitude: 25.3612,
      longitude: 82.9541,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'Tej Bahadur Sapru Memorial Hospital',
      type: FacilityType.HOSPITAL,
      address: 'Civil Lines, Beli Hospital Road',
      district: 'Prayagraj',
      state: 'Uttar Pradesh',
      latitude: 25.4484,
      longitude: 81.8463,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'PHC Phulpur',
      type: FacilityType.PHC,
      address: 'Tehsil Road, Phulpur Market',
      district: 'Prayagraj',
      state: 'Uttar Pradesh',
      latitude: 25.5512,
      longitude: 82.0912,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'District Hospital Gorakhpur',
      type: FacilityType.HOSPITAL,
      address: 'Golghar Medical Square',
      district: 'Gorakhpur',
      state: 'Uttar Pradesh',
      latitude: 26.7606,
      longitude: 83.3732,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'PHC Sahjanwa',
      type: FacilityType.PHC,
      address: 'Industrial Area Rd, Sahjanwa',
      district: 'Gorakhpur',
      state: 'Uttar Pradesh',
      latitude: 26.7712,
      longitude: 83.2145,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'Ursala Horsman Memorial Hospital',
      type: FacilityType.HOSPITAL,
      address: 'Parade Market, The Mall Road',
      district: 'Kanpur Nagar',
      state: 'Uttar Pradesh',
      latitude: 26.4671,
      longitude: 80.3503,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'PHC Kalyanpur',
      type: FacilityType.PHC,
      address: 'GT Road Near University Gate',
      district: 'Kanpur Nagar',
      state: 'Uttar Pradesh',
      latitude: 26.4912,
      longitude: 80.2612,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'District Hospital Ayodhya',
      type: FacilityType.HOSPITAL,
      address: 'Faizabad Cantt Link Road',
      district: 'Ayodhya',
      state: 'Uttar Pradesh',
      latitude: 26.7922,
      longitude: 82.1998,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'PHC Sohawal',
      type: FacilityType.PHC,
      address: 'National Highway 27, Sohawal',
      district: 'Ayodhya',
      state: 'Uttar Pradesh',
      latitude: 26.7654,
      longitude: 82.0123,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'Maharana Pratap District Hospital Bareilly',
      type: FacilityType.HOSPITAL,
      address: 'Civil Lines, Station Road',
      district: 'Bareilly',
      state: 'Uttar Pradesh',
      latitude: 28.3670,
      longitude: 79.4304,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'PHC Nawabganj',
      type: FacilityType.PHC,
      address: 'Pilibhit Bypass Junction',
      district: 'Bareilly',
      state: 'Uttar Pradesh',
      latitude: 28.5312,
      longitude: 79.6241,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'Pyare Lal Sharma District Hospital Meerut',
      type: FacilityType.HOSPITAL,
      address: 'Suraj Kund Sports Ground Road',
      district: 'Meerut',
      state: 'Uttar Pradesh',
      latitude: 28.9845,
      longitude: 77.7064,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'PHC Sardhana',
      type: FacilityType.PHC,
      address: 'Church Road, Sardhana',
      district: 'Meerut',
      state: 'Uttar Pradesh',
      latitude: 29.1412,
      longitude: 77.6189,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'District Hospital Jhansi',
      type: FacilityType.HOSPITAL,
      address: 'Gwalior Road, Bundelkhand Area',
      district: 'Jhansi',
      state: 'Uttar Pradesh',
      latitude: 25.4484,
      longitude: 78.5685,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'PHC Babina',
      type: FacilityType.PHC,
      address: 'Cantonment Outpost, Babina',
      district: 'Jhansi',
      state: 'Uttar Pradesh',
      latitude: 25.2412,
      longitude: 78.4712,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'S.N. Medical College Hospital Agra',
      type: FacilityType.HOSPITAL,
      address: 'Hospital Road, Moti Katra',
      district: 'Agra',
      state: 'Uttar Pradesh',
      latitude: 27.1852,
      longitude: 78.0098,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'PHC Fatehabad',
      type: FacilityType.PHC,
      address: 'Yamuna Expressway Link',
      district: 'Agra',
      state: 'Uttar Pradesh',
      latitude: 27.0214,
      longitude: 78.3124,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'Malkhan Singh District Hospital Aligarh',
      type: FacilityType.HOSPITAL,
      address: 'Ramghat Road, Centre',
      district: 'Aligarh',
      state: 'Uttar Pradesh',
      latitude: 27.8974,
      longitude: 78.0880,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'Community Health Centre Hardoi',
      type: FacilityType.CLINIC,
      address: 'Station Road, Hardoi',
      district: 'Hardoi',
      state: 'Uttar Pradesh',
      latitude: 27.3985,
      longitude: 80.1287,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'District Hospital Sitapur',
      type: FacilityType.HOSPITAL,
      address: 'Eye Hospital Road, Sitapur',
      district: 'Sitapur',
      state: 'Uttar Pradesh',
      latitude: 27.5684,
      longitude: 80.6812,
      status: FacilityStatus.ACTIVE,
    },
    {
      name: 'District Hospital Unnao',
      type: FacilityType.HOSPITAL,
      address: 'Kanpur-Lucknow Highway Road',
      district: 'Unnao',
      state: 'Uttar Pradesh',
      latitude: 26.5432,
      longitude: 80.4876,
      status: FacilityStatus.ACTIVE,
    },
  ];

  const facilities = [];
  for (const f of facilityData) {
    const created = await prisma.facility.create({ data: f });
    facilities.push(created);
  }

  const hospitalA = facilities[0]; // District General Hospital Lucknow
  const phcB = facilities[1];      // PHC Bakshi Ka Talab

  // 3. Create 12 Standard Clinical Resources
  console.log('Creating 12 clinical resources (medicines, supplies, equipment)...');
  const resourceData = [
    {
      name: 'Medicine X (Paracetamol 500mg)',
      category: ResourceCategory.MEDICINE,
      unit: 'tablets',
      description: 'Antipyretic and analgesic frontline clinical medicine',
    },
    {
      name: 'Amoxicillin 250mg',
      category: ResourceCategory.MEDICINE,
      unit: 'capsules',
      description: 'Broad-spectrum antibiotic for bacterial infections',
    },
    {
      name: 'IV Normal Saline 500ml',
      category: ResourceCategory.MEDICAL_SUPPLY,
      unit: 'bottles',
      description: 'Sterile isotonic crystalloid for intravenous infusion',
    },
    {
      name: 'Disposable Syringes 5ml',
      category: ResourceCategory.MEDICAL_SUPPLY,
      unit: 'units',
      description: 'Hypodermic sterile single-use disposable syringes with needle',
    },
    {
      name: 'Medical Oxygen Cylinder 40L',
      category: ResourceCategory.EQUIPMENT,
      unit: 'cylinders',
      description: 'High-pressure compressed medical grade oxygen cylinder',
    },
    {
      name: 'ICU Critical Care Bed',
      category: ResourceCategory.BED,
      unit: 'beds',
      description: 'Multi-function electric motorized intensive care bed',
    },
    {
      name: 'Examination Nitrile Gloves (Box of 100)',
      category: ResourceCategory.MEDICAL_SUPPLY,
      unit: 'boxes',
      description: 'Powder-free non-sterile latex-free clinical examination gloves',
    },
    {
      name: 'Artesunate 60mg Injection',
      category: ResourceCategory.MEDICINE,
      unit: 'vials',
      description: 'Antimalarial injection for severe plasmodium falciparum infection',
    },
    {
      name: 'Human Insulin 100IU/ml',
      category: ResourceCategory.MEDICINE,
      unit: 'vials',
      description: 'Short-acting regular recombinant human insulin',
    },
    {
      name: 'Oral Rehydration Salts (ORS 20.5g)',
      category: ResourceCategory.MEDICINE,
      unit: 'sachets',
      description: 'WHO standard low-osmolarity oral electrolyte replenishment',
    },
    {
      name: 'Digital Pulse Oximeter',
      category: ResourceCategory.EQUIPMENT,
      unit: 'units',
      description: 'Finger-clip photoelectric blood oxygen saturation and pulse rate monitor',
    },
    {
      name: 'PPE Protection Kit Clinical Grade',
      category: ResourceCategory.MEDICAL_SUPPLY,
      unit: 'kits',
      description: 'Complete personal protective equipment suit with N95 mask and shield',
    },
  ];

  const resources = [];
  for (const r of resourceData) {
    const created = await prisma.resource.create({ data: r });
    resources.push(created);
  }

  const medicineX = resources[0]; // Paracetamol 500mg

  // 4. Create the Exactly Required Demo Accounts
  console.log('Creating demo user accounts...');
  // Password hashes:
  const adminHash = await hashPassword('Admin@123');
  const managerHash = await hashPassword('Manager@123');
  const supplyHash = await hashPassword('Supply@123');

  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@healthflow.demo',
      passwordHash: adminHash,
      role: Role.ADMIN,
      facilityId: null,
      employeeId: 'HF-EMP-1001',
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
    },
  });

  const hospitalManagerUser = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Verma (PHC Superintendent)',
      email: 'manager@healthflow.demo',
      passwordHash: managerHash,
      role: Role.HOSPITAL_MANAGER,
      facilityId: phcB.id, // Assigned to PHC B
      employeeId: 'HF-EMP-1002',
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
    },
  });

  const supplyManagerUser = await prisma.user.create({
    data: {
      name: 'Anita Roy (Logistics Coordinator)',
      email: 'supply@healthflow.demo',
      passwordHash: supplyHash,
      role: Role.SUPPLY_MANAGER,
      facilityId: null,
      employeeId: 'HF-EMP-1003',
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
    },
  });

  // 5. Populate Deliberate Demonstration Scenario & Network Inventories
  console.log('Populating inventory records with deliberate demonstration scenario...');
  
  // Scenario: Hospital A holds SURPLUS of Medicine X
  // 900 units, 50 daily consumption, safety stock 100 -> 18 days supply (LOW risk)
  await prisma.inventory.create({
    data: {
      facilityId: hospitalA.id,
      resourceId: medicineX.id,
      quantity: 900,
      dailyConsumption: 50.0,
      safetyStock: 100,
      lastUpdated: new Date(),
    },
  });

  // Scenario: PHC B holds CRITICAL DEFICIT of Medicine X
  // 150 units, 75 daily consumption, safety stock 200 -> 2.0 days supply (HIGH/CRITICAL risk)
  await prisma.inventory.create({
    data: {
      facilityId: phcB.id,
      resourceId: medicineX.id,
      quantity: 150,
      dailyConsumption: 75.0,
      safetyStock: 200,
      lastUpdated: new Date(),
    },
  });

  // Seed inventory for remaining facilities and resources
  for (let i = 0; i < facilities.length; i++) {
    const fac = facilities[i];
    for (let j = 0; j < resources.length; j++) {
      const res = resources[j];
      // Skip if already seeded above
      if (
        (fac.id === hospitalA.id && res.id === medicineX.id) ||
        (fac.id === phcB.id && res.id === medicineX.id)
      ) {
        continue;
      }

      // Realistic stock profiles
      const isHospital = fac.type === FacilityType.HOSPITAL;
      const baseQty = isHospital ? 400 + ((i * 73 + j * 47) % 600) : 50 + ((i * 31 + j * 19) % 150);
      const baseDaily = isHospital ? 20 + ((i * 7 + j * 5) % 35) : 5 + ((i * 3 + j * 2) % 15);
      const safetyStock = isHospital ? 100 : 30;

      await prisma.inventory.create({
        data: {
          facilityId: fac.id,
          resourceId: res.id,
          quantity: baseQty,
          dailyConsumption: baseDaily,
          safetyStock,
          lastUpdated: new Date(),
        },
      });
    }
  }

  // 6. Create 60 Days Historical Patient Demand Data
  console.log('Generating 60 days of historical patient demand data...');
  const now = new Date();
  const demandRecords = [];

  for (let d = 60; d >= 0; d--) {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    for (const fac of facilities.slice(0, 8)) {
      const isHospital = fac.type === FacilityType.HOSPITAL;
      // Introduce an intentional surge at PHC B in the last 10 days
      const isPHCBRecent = fac.id === phcB.id && d <= 10;
      const baseDemand = isHospital ? 140 : 45;
      const variance = (d % 7) * 4;
      const surgeMultiplier = isPHCBRecent ? 1.6 : 1.0;

      demandRecords.push({
        facilityId: fac.id,
        date,
        patientCount: Math.round((baseDemand + variance) * surgeMultiplier),
        department: isHospital ? (d % 2 === 0 ? 'General Medicine' : 'Emergency & Trauma') : 'Primary Care OPD',
      });
    }
  }

  await prisma.patientDemand.createMany({ data: demandRecords });

  // 7. Seed Initial Predictions
  console.log('Creating initial ML predictions...');
  // High risk prediction for PHC B on Medicine X
  await prisma.prediction.create({
    data: {
      facilityId: phcB.id,
      resourceId: medicineX.id,
      predictedDailyDemand: 82.5,
      predictedStockoutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      riskLevel: RiskLevel.CRITICAL,
      confidence: 0.93,
      explanation: 'Rapid inventory depletion: 150 units remaining vs 75 units/day burn rate. Acute patient surge detected.',
      predictionDate: new Date(),
    },
  });

  // Low risk prediction for Hospital A on Medicine X
  await prisma.prediction.create({
    data: {
      facilityId: hospitalA.id,
      resourceId: medicineX.id,
      predictedDailyDemand: 52.0,
      predictedStockoutDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days
      riskLevel: RiskLevel.LOW,
      confidence: 0.91,
      explanation: 'Stable surplus reserves: 900 units on hand with 18 days operational runway.',
      predictionDate: new Date(),
    },
  });

  // 8. Seed Initial Operational Alerts
  console.log('Creating initial operational alerts...');
  await prisma.alert.create({
    data: {
      facilityId: phcB.id,
      resourceId: medicineX.id,
      type: AlertType.STOCKOUT_RISK,
      severity: AlertSeverity.CRITICAL,
      title: 'Critical Stock-Out Imminent: Paracetamol 500mg',
      message: 'PHC Bakshi Ka Talab has less than 48 hours of Paracetamol reserves remaining. Inpatient and OPD stock endangered.',
      status: AlertStatus.OPEN,
    },
  });

  await prisma.alert.create({
    data: {
      facilityId: phcB.id,
      resourceId: null,
      type: AlertType.DEMAND_SURGE,
      severity: AlertSeverity.WARNING,
      title: 'Patient Attendance Surge Detected',
      message: 'Weekly patient visits increased by 42% due to seasonal flu presentations.',
      status: AlertStatus.OPEN,
    },
  });

  // 9. Seed Sample Transfers
  console.log('Creating sample transfer records in various lifecycle states...');
  // Transfer 1: Requested transfer from Hospital A to PHC B
  await prisma.transfer.create({
    data: {
      sourceFacilityId: hospitalA.id,
      destinationFacilityId: phcB.id,
      resourceId: medicineX.id,
      quantity: 250,
      status: TransferStatus.REQUESTED,
      priority: TransferPriority.HIGH,
      requestedBy: hospitalManagerUser.id,
      eta: new Date(Date.now() + 6 * 60 * 60 * 1000),
    },
  });

  // Transfer 2: Approved and Packed transfer between regional centers
  await prisma.transfer.create({
    data: {
      sourceFacilityId: facilities[3].id, // Varanasi
      destinationFacilityId: facilities[4].id, // PHC Shivpur
      resourceId: resources[2].id, // IV Normal Saline
      quantity: 100,
      status: TransferStatus.IN_TRANSIT,
      priority: TransferPriority.MEDIUM,
      requestedBy: adminUser.id,
      approvedBy: supplyManagerUser.id,
      eta: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  // Transfer 3: Completed delivered transfer
  await prisma.transfer.create({
    data: {
      sourceFacilityId: facilities[5].id, // Prayagraj
      destinationFacilityId: facilities[6].id, // Phulpur
      resourceId: resources[3].id, // Syringes
      quantity: 300,
      status: TransferStatus.DELIVERED,
      priority: TransferPriority.LOW,
      requestedBy: adminUser.id,
      approvedBy: supplyManagerUser.id,
    },
  });

  // 10. Audit Log Initial Records
  console.log('Logging initial system bootstrap audit events...');
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'System',
      entityId: 'HEALTHFLOW-INIT',
      metadata: { facilitiesCreated: 25, resourcesCreated: 12, demoUsers: 3 },
      ipAddress: '127.0.0.1',
    },
  });

  console.log('====================================================');
  console.log('SEEDING COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
  console.log('DEMO ACCOUNTS:');
  console.log('1. ADMIN:            admin@healthflow.demo   / Admin@123');
  console.log('2. HOSPITAL MANAGER: manager@healthflow.demo / Manager@123 (PHC Bakshi Ka Talab)');
  console.log('3. SUPPLY MANAGER:   supply@healthflow.demo  / Supply@123');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
