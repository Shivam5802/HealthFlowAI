import { prisma } from '../repositories/prisma.js';
import { hashPassword } from './security.js';
import { Role, UserStatus, FacilityType, FacilityStatus, ResourceCategory } from '@prisma/client';

export async function bootstrapDatabaseIfNeeded(): Promise<void> {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log(`[BOOTSTRAP] Database already initialized (${userCount} users present).`);
      return;
    }

    console.log('[BOOTSTRAP] Database is empty (0 users found). Auto-populating demonstration healthcare network and accounts...');

    // 1. Create Baseline Facility
    const districtHosp = await prisma.facility.create({
      data: {
        name: 'District General Hospital Lucknow',
        type: FacilityType.HOSPITAL,
        address: 'Hazratganj Main Road, Sector 4',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        latitude: 26.8467,
        longitude: 80.9462,
        status: FacilityStatus.ACTIVE,
      },
    });

    const phcB = await prisma.facility.create({
      data: {
        name: 'PHC Bakshi Ka Talab',
        type: FacilityType.PHC,
        address: 'Village BKT, Sitapur Highway',
        district: 'Lucknow',
        state: 'Uttar Pradesh',
        latitude: 27.0125,
        longitude: 80.8924,
        status: FacilityStatus.ACTIVE,
      },
    });

    // 2. Create Core Resources
    const paracetamol = await prisma.resource.create({
      data: {
        name: 'Paracetamol 500mg Tablet',
        category: ResourceCategory.MEDICINE,
        unit: 'tablets',
        description: 'Standard antipyretic and analgesic for pain and fever management',
      },
    });

    const oxygen = await prisma.resource.create({
      data: {
        name: 'Medical Oxygen Cylinder D-Type (46.7L)',
        category: ResourceCategory.EQUIPMENT,
        unit: 'cylinders',
        description: 'High-pressure medical-grade oxygen cylinder for emergency respiratory support',
      },
    });

    // 3. Create Demo Users with Hashed Passwords
    const adminPass = await hashPassword('Admin@123');
    const managerPass = await hashPassword('Manager@123');
    const supplyPass = await hashPassword('Supply@123');

    await prisma.user.createMany({
      data: [
        {
          name: 'System Administrator',
          email: 'admin@healthflow.demo',
          passwordHash: adminPass,
          role: Role.ADMIN,
          employeeId: 'HF-EMP-1001',
          status: UserStatus.ACTIVE,
          mustChangePassword: false,
        },
        {
          name: 'Dr. Rajesh Verma (PHC Superintendent)',
          email: 'manager@healthflow.demo',
          passwordHash: managerPass,
          role: Role.HOSPITAL_MANAGER,
          facilityId: phcB.id,
          employeeId: 'HF-EMP-1002',
          status: UserStatus.ACTIVE,
          mustChangePassword: false,
        },
        {
          name: 'Anita Roy (Logistics Coordinator)',
          email: 'supply@healthflow.demo',
          passwordHash: supplyPass,
          role: Role.SUPPLY_MANAGER,
          employeeId: 'HF-EMP-1003',
          status: UserStatus.ACTIVE,
          mustChangePassword: false,
        },
      ],
    });

    // 4. Create Baseline Inventory for Demo Scenario
    await prisma.inventory.createMany({
      data: [
        {
          facilityId: districtHosp.id,
          resourceId: paracetamol.id,
          quantity: 900,
          dailyConsumption: 50,
          safetyStock: 100,
        },
        {
          facilityId: phcB.id,
          resourceId: paracetamol.id,
          quantity: 35,
          dailyConsumption: 20,
          safetyStock: 100,
        },
        {
          facilityId: districtHosp.id,
          resourceId: oxygen.id,
          quantity: 45,
          dailyConsumption: 3,
          safetyStock: 10,
        },
      ],
    });

    console.log('====================================================');
    console.log('[BOOTSTRAP] AUTO-POPULATION COMPLETED SUCCESSFULLY!');
    console.log('Demo Accounts Active:');
    console.log('  1. admin@healthflow.demo   / Admin@123 (ADMIN)');
    console.log('  2. manager@healthflow.demo / Manager@123 (HOSPITAL MANAGER)');
    console.log('  3. supply@healthflow.demo  / Supply@123 (SUPPLY MANAGER)');
    console.log('====================================================');
  } catch (error) {
    console.error('[BOOTSTRAP] Error during auto-population:', error);
  }
}
