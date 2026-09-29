import { createApp } from '../app.js';
import { prisma } from '../repositories/prisma.js';
import { Server } from 'http';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: (baseUrl: string) => Promise<void>, baseUrl: string) {
  const start = Date.now();
  try {
    await fn(baseUrl);
    results.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ PASS: ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message || String(err), durationMs: Date.now() - start });
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message || String(err)}`);
  }
}

async function main() {
  console.log('====================================================');
  console.log('HEALTHFLOW AI — AUTOMATED BACKEND INTEGRATION TESTS');
  console.log('Testing genuine PostgreSQL + Express + RBAC + APIs');
  console.log('====================================================\n');

  const app = createApp();
  const testPort = 5055;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(testPort, () => resolve(s));
  });
  const baseUrl = `http://localhost:${testPort}/api`;

  let adminToken = '';
  let managerToken = '';
  let supplyToken = '';
  let hospitalAFacilityId = '';
  let phcBFacilityId = '';
  let medicineXId = '';
  let testTransferId = '';

  try {
    // Lookup facilities and resources seeded in database
    const hospitalA = await prisma.facility.findFirst({ where: { name: 'District General Hospital Lucknow' } });
    const phcB = await prisma.facility.findFirst({ where: { name: 'PHC Bakshi Ka Talab' } });
    const medicineX = await prisma.resource.findFirst({ where: { name: { contains: 'Paracetamol' } } });

    if (!hospitalA || !phcB || !medicineX) {
      throw new Error('Seed data missing: Hospital A, PHC B, or Medicine X not found.');
    }

    hospitalAFacilityId = hospitalA.id;
    phcBFacilityId = phcB.id;
    medicineXId = medicineX.id;

    // Test 1: Valid Login
    await runTest('1. Valid Login (Admin)', async (url) => {
      const res = await fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@healthflow.demo', password: 'Admin@123' }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 200 || !data.success || !data.data.token) {
        throw new Error(`Expected 200 with token, got ${res.status}: ${JSON.stringify(data)}`);
      }
      if (data.data.user.passwordHash) {
        throw new Error('Security violation: passwordHash exposed in response');
      }
      adminToken = data.data.token;
    }, baseUrl);

    // Login Manager and Supply Manager for subsequent tests
    const mRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@healthflow.demo', password: 'Manager@123' }),
    });
    const mData = (await mRes.json()) as any;
    managerToken = mData.data.token;

    const sRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'supply@healthflow.demo', password: 'Supply@123' }),
    });
    const sData = (await sRes.json()) as any;
    supplyToken = sData.data.token;

    // Test 2: Invalid Login (Wrong Password)
    await runTest('2. Invalid Login (Wrong Password)', async (url) => {
      const res = await fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@healthflow.demo', password: 'WrongPassword#999' }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 401 || data.success !== false) {
        throw new Error(`Expected 401 for wrong credentials, got ${res.status}`);
      }
    }, baseUrl);

    // Test 3: Inactive User Cannot Login
    await runTest('3. Inactive User Cannot Login', async (url) => {
      // Create a temporary suspended user
      const tempEmail = 'inactive.test@healthflow.demo';
      await prisma.user.deleteMany({ where: { email: tempEmail } });
      await prisma.user.create({
        data: {
          name: 'Suspended Worker',
          email: tempEmail,
          passwordHash: '$2a$10$xyz', // dummy hash
          employeeId: 'HF-EMP-9999',
          status: 'SUSPENDED',
          role: 'HOSPITAL_MANAGER',
        },
      });

      const res = await fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempEmail, password: 'AnyPassword' }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 403 && res.status !== 401) {
        throw new Error(`Expected 403 or 401 for inactive/suspended account, got ${res.status}`);
      }
      await prisma.user.deleteMany({ where: { email: tempEmail } });
    }, baseUrl);

    // Test 4: Admin Authorization
    await runTest('4. Admin Authorization (/api/users)', async (url) => {
      const res = await fetch(`${url}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = (await res.json()) as any;
      if (res.status !== 200 || !data.success || !Array.isArray(data.data)) {
        throw new Error(`Admin should access /api/users, got ${res.status}`);
      }
    }, baseUrl);

    // Test 5: Hospital Manager Authorization Blocked on Admin Route
    await runTest('5. Hospital Manager RBAC Block on Admin Route', async (url) => {
      const res = await fetch(`${url}/users`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 for Hospital Manager accessing /users, got ${res.status}`);
      }
    }, baseUrl);

    // Test 6: Supply Manager Authorization Blocked on Admin Route
    await runTest('6. Supply Manager RBAC Block on Admin Route', async (url) => {
      const res = await fetch(`${url}/users`, {
        headers: { Authorization: `Bearer ${supplyToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 for Supply Manager accessing /users, got ${res.status}`);
      }
    }, baseUrl);

    // Test 7: Facility-Level Data Isolation
    await runTest('7. Facility-Level Isolation (Manager at PHC B accessing Hospital A)', async (url) => {
      // Manager is assigned to PHC B. Accessing Hospital A must return 403.
      const res = await fetch(`${url}/facilities/${hospitalAFacilityId}`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 FACILITY_ACCESS_DENIED, got ${res.status}`);
      }
    }, baseUrl);

    // Test 8: Inventory Update & Dynamic Days Remaining
    await runTest('8. Inventory Update with Dynamic Calculation', async (url) => {
      const res = await fetch(`${url}/inventory/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          facilityId: hospitalAFacilityId,
          resourceId: medicineXId,
          quantity: 850,
          dailyConsumption: 50.0,
          safetyStock: 100,
        }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 200 || !data.success) {
        throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
      }
      if (data.data.daysRemaining !== 17 || data.data.riskLevel !== 'LOW') {
        throw new Error(`Expected 17 days and LOW risk, got ${data.data.daysRemaining} / ${data.data.riskLevel}`);
      }
    }, baseUrl);

    // Test 9: Patient Demand Creation
    await runTest('9. Patient Demand Recording', async (url) => {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${url}/patients/demand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          facilityId: phcBFacilityId,
          date: today,
          patientCount: 95,
          department: 'Outpatient Care',
        }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 201 || !data.success) {
        throw new Error(`Expected 201 for patient demand, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }, baseUrl);

    // Test 10: Prediction Pipeline Execution
    await runTest('10. Prediction Pipeline Run (/api/predictions/run)', async (url) => {
      const res = await fetch(`${url}/predictions/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ facilityId: phcBFacilityId }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 201 || !data.success || data.data.evaluatedCount === 0) {
        throw new Error(`Expected 201 with evaluated predictions, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }, baseUrl);

    // Test 11: Alert Creation
    await runTest('11. Operational Alert Creation', async (url) => {
      const res = await fetch(`${url}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          facilityId: phcBFacilityId,
          resourceId: medicineXId,
          type: 'STOCKOUT_RISK',
          severity: 'CRITICAL',
          title: 'Automated Test Stock Alert',
          message: 'Safety buffer threshold breach during integration test.',
        }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 201 || !data.success) {
        throw new Error(`Expected 201 for alert creation, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }, baseUrl);

    // Test 12: Transfer Creation
    await runTest('12. Transfer Request Creation', async (url) => {
      const res = await fetch(`${url}/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          sourceFacilityId: hospitalAFacilityId,
          destinationFacilityId: phcBFacilityId,
          resourceId: medicineXId,
          quantity: 120,
          priority: 'HIGH',
        }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 201 || !data.success || !data.data.id) {
        throw new Error(`Expected 201 for transfer, got ${res.status}: ${JSON.stringify(data)}`);
      }
      testTransferId = data.data.id;
    }, baseUrl);

    // Test 13: Invalid Transfer State Transition
    await runTest('13. Invalid Transfer State Transition Rejection', async (url) => {
      // Transfer is currently REQUESTED. Direct transition to DELIVERED is forbidden!
      const res = await fetch(`${url}/transfers/${testTransferId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 400 || data.code !== 'INVALID_STATE_TRANSITION') {
        throw new Error(`Expected 400 INVALID_STATE_TRANSITION, got ${res.status}: ${JSON.stringify(data)}`);
      }
    }, baseUrl);

    // Test 14: Dynamic Redistribution Recommendation
    await runTest('14. Dynamic Redistribution Recommendation Algorithm', async (url) => {
      const res = await fetch(`${url}/recommendations/redistribution`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = (await res.json()) as any;
      if (res.status !== 200 || !data.success || !Array.isArray(data.data)) {
        throw new Error(`Expected 200 with recommendation array, got ${res.status}`);
      }

      // Check that Hospital A is identified as donor and PHC B as recipient for Paracetamol
      const matched = data.data.find(
        (r: any) =>
          r.sourceFacilityId === hospitalAFacilityId &&
          r.destinationFacilityId === phcBFacilityId &&
          r.resourceId === medicineXId
      );

      if (!matched) {
        throw new Error('Algorithm failed to recommend redistribution from Hospital A to PHC B');
      }

      if (matched.recommendedQuantity <= 0) {
        throw new Error(`Expected recommendedQuantity > 0, got ${matched.recommendedQuantity}`);
      }
    }, baseUrl);

    // Test 15: Employee Provisioning (Admin creates Employee)
    await runTest('15. Employee Account Provisioning with HF-EMP ID', async (url) => {
      const testEmail = `new.staff.${Date.now()}@healthflow.demo`;
      const res = await fetch(`${url}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Nurse Priya Sharma',
          email: testEmail,
          role: 'HOSPITAL_MANAGER',
          facilityId: hospitalAFacilityId,
        }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 201 || !data.success) {
        throw new Error(`Expected 201 for employee creation, got ${res.status}: ${JSON.stringify(data)}`);
      }
      if (!data.data.employeeId.startsWith('HF-EMP-')) {
        throw new Error(`Expected employeeId format HF-EMP-xxxx, got ${data.data.employeeId}`);
      }
      if (!data.data.temporaryPassword) {
        throw new Error('Expected temporaryPassword to be returned once for admin handoff');
      }
    }, baseUrl);

    // Test 16: Password Hashing Verification
    await runTest('16. Password Hashing (Never plaintext in DB)', async () => {
      const user = await prisma.user.findUnique({ where: { email: 'admin@healthflow.demo' } });
      if (!user) throw new Error('Admin user not found');
      if (user.passwordHash === 'Admin@123' || !user.passwordHash.startsWith('$2')) {
        throw new Error('Password is not securely hashed with bcrypt!');
      }
    }, baseUrl);

    // Test 17: Input Validation
    await runTest('17. Input Validation Rejection (Invalid Email & Negative Quantity)', async (url) => {
      const res = await fetch(`${url}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: '123' }),
      });
      if (res.status !== 422) {
        throw new Error(`Expected 422 for malformed email, got ${res.status}`);
      }

      const invRes = await fetch(`${url}/inventory/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          facilityId: hospitalAFacilityId,
          resourceId: medicineXId,
          quantity: -50, // Negative quantity
        }),
      });
      if (invRes.status !== 422 && invRes.status !== 400) {
        throw new Error(`Expected 422 or 400 for negative inventory, got ${invRes.status}`);
      }
    }, baseUrl);

    // Test 18: Unauthorized API Access
    await runTest('18. Unauthorized API Access Rejection', async (url) => {
      const res = await fetch(`${url}/inventory`);
      if (res.status !== 401) {
        throw new Error(`Expected 401 for unauthenticated request, got ${res.status}`);
      }
    }, baseUrl);

    // Test 19: Complete Transfer FSM progression
    await runTest('19. Transfer FSM Progression (REQUESTED -> APPROVED -> PACKED -> IN_TRANSIT -> DELIVERED)', async (url) => {
      // Create fresh transfer to test full ordered lifecycle
      const createRes = await fetch(`${url}/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          sourceFacilityId: hospitalAFacilityId,
          destinationFacilityId: phcBFacilityId,
          resourceId: medicineXId,
          quantity: 25,
          priority: 'MEDIUM',
        }),
      });
      const createData = (await createRes.json()) as any;
      const transferId = createData.data.id;

      // 1. REQUESTED -> APPROVED
      const appRes = await fetch(`${url}/transfers/${transferId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supplyToken}` },
        body: JSON.stringify({ status: 'APPROVED', note: 'Approved by Supply Manager' }),
      });
      if (appRes.status !== 200) throw new Error(`Failed to approve: ${appRes.status}`);

      // 2. APPROVED -> PACKED
      const packRes = await fetch(`${url}/transfers/${transferId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supplyToken}` },
        body: JSON.stringify({ status: 'PACKED', note: 'Crate packed' }),
      });
      if (packRes.status !== 200) throw new Error(`Failed to pack: ${packRes.status}`);

      // 3. PACKED -> IN_TRANSIT
      const transitRes = await fetch(`${url}/transfers/${transferId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supplyToken}` },
        body: JSON.stringify({ status: 'IN_TRANSIT', note: 'Dispatched on logistics van' }),
      });
      if (transitRes.status !== 200) throw new Error(`Failed to dispatch in transit: ${transitRes.status}`);

      // 4. IN_TRANSIT -> DELIVERED
      const delRes = await fetch(`${url}/transfers/${transferId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'DELIVERED', note: 'Received at clinic' }),
      });
      if (delRes.status !== 200) throw new Error(`Failed to deliver: ${delRes.status}`);
    }, baseUrl);

    // Test 20: Audit Log Verification
    await runTest('20. Audit Trail Verification', async (url) => {
      const res = await fetch(`${url}/audit`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = (await res.json()) as any;
      if (res.status !== 200 || !data.success || !Array.isArray(data.data)) {
        throw new Error(`Audit log fetch failed with status ${res.status}`);
      }
    }, baseUrl);

    // Test 21: Daily & Weekly Reports Generation
    await runTest('21. Daily & Weekly Reports Generation', async (url) => {
      const dailyRes = await fetch(`${url}/reports/daily`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const dailyData = (await dailyRes.json()) as any;
      if (dailyRes.status !== 200 || !dailyData.data.summary) {
        throw new Error('Daily report generation failed');
      }

      const weeklyRes = await fetch(`${url}/reports/weekly`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const weeklyData = (await weeklyRes.json()) as any;
      if (weeklyRes.status !== 200 || !weeklyData.data.trendAnalysis) {
        throw new Error('Weekly report generation failed');
      }
    }, baseUrl);

    // Test 22: HealthFlow Panda Grounded AI Chat Endpoint
    await runTest('22. HealthFlow Panda Grounded AI Chat (/api/chat)', async (url) => {
      const res = await fetch(`${url}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ message: 'Which facility is at highest risk?' }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 200 || !data.success || !data.data.reply) {
        throw new Error(`Chat API failed with status ${res.status}: ${JSON.stringify(data)}`);
      }
      if (!data.data.groundingContext) {
        throw new Error('Panda response missing grounding context from live database');
      }
    }, baseUrl);

    // Test 23: Duplicate Email Employee Creation Rejection
    await runTest('23. Duplicate Email Employee Creation Rejection (409 Conflict)', async (url) => {
      const res = await fetch(`${url}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'Duplicate Staff',
          email: 'admin@healthflow.demo', // existing email
          role: 'HOSPITAL_MANAGER',
          facilityId: hospitalAFacilityId,
        }),
      });
      if (res.status !== 409 && res.status !== 422) {
        throw new Error(`Expected 409 or 422 for duplicate email, got ${res.status}`);
      }
    }, baseUrl);

    // Test 24: Direct IDOR Protection (Manager accessing peer facility inventory)
    await runTest('24. Direct IDOR Protection (Facility Data Isolation - Inventory)', async (url) => {
      // Manager at PHC B tries to fetch Hospital A's inventory
      const res = await fetch(`${url}/inventory?facilityId=${hospitalAFacilityId}`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Manager accessing peer facility inventory, got ${res.status}`);
      }
    }, baseUrl);

    // Test 25: Hospital Manager blocked from peer facility alerts
    await runTest('25. Hospital Manager Blocked from Peer Facility Alerts (IDOR Protection)', async (url) => {
      const res = await fetch(`${url}/alerts?facilityId=${hospitalAFacilityId}`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Manager querying Hospital A alerts, got ${res.status}`);
      }
    }, baseUrl);

    // Test 26: Hospital Manager blocked from peer facility predictions
    await runTest('26. Hospital Manager Blocked from Peer Facility Predictions (IDOR Protection)', async (url) => {
      const res = await fetch(`${url}/predictions?facilityId=${hospitalAFacilityId}`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Manager querying Hospital A predictions, got ${res.status}`);
      }
    }, baseUrl);

    // Test 27: Hospital Manager blocked from peer facility patient demand
    await runTest('27. Hospital Manager Blocked from Peer Facility Patient Demand (IDOR Protection)', async (url) => {
      const res = await fetch(`${url}/patients/demand?facilityId=${hospitalAFacilityId}`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Manager querying Hospital A patient demand, got ${res.status}`);
      }
    }, baseUrl);

    // Test 28: Hospital Manager blocked from peer facility transfers
    await runTest('28. Hospital Manager Blocked from Peer Facility Transfers (IDOR Protection)', async (url) => {
      const res = await fetch(`${url}/transfers?facilityId=${hospitalAFacilityId}`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Manager querying Hospital A transfers, got ${res.status}`);
      }
    }, baseUrl);

    // Test 29: Hospital Manager blocked from peer facility risks
    await runTest('29. Hospital Manager Blocked from Peer Facility Risk Detail (IDOR Protection)', async (url) => {
      const res = await fetch(`${url}/risks/facility/${hospitalAFacilityId}`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Manager querying Hospital A risks, got ${res.status}`);
      }
    }, baseUrl);

    // Test 30: Hospital Manager GET /api/facilities returns ONLY assigned facility
    await runTest('30. Hospital Manager GET /api/facilities Returns ONLY Assigned Facility', async (url) => {
      const res = await fetch(`${url}/facilities`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      const data = (await res.json()) as any;
      if (res.status !== 200 || !data.success) {
        throw new Error(`Expected 200 for Manager GET /facilities, got ${res.status}`);
      }
      if (data.data.length !== 1 || data.data[0].id !== phcBFacilityId) {
        throw new Error(`Expected array of length 1 containing assigned facility (${phcBFacilityId}), got ${data.data.length} items`);
      }
    }, baseUrl);

    // Test 31: Supply Manager blocked from /api/patients/demand
    await runTest('31. Supply Manager Blocked from Patient Demand (/api/patients/demand)', async (url) => {
      const res = await fetch(`${url}/patients/demand`, {
        headers: { Authorization: `Bearer ${supplyToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Supply Manager on /api/patients/demand, got ${res.status}`);
      }
    }, baseUrl);

    // Test 32: Supply Manager blocked from /api/predictions/run
    await runTest('32. Supply Manager Blocked from Predictions Engine (/api/predictions/run)', async (url) => {
      const res = await fetch(`${url}/predictions/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supplyToken}` },
        body: JSON.stringify({ facilityId: phcBFacilityId }),
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Supply Manager on /api/predictions/run, got ${res.status}`);
      }
    }, baseUrl);

    // Test 33: Supply Manager blocked from /api/risks
    await runTest('33. Supply Manager Blocked from Risk Analytics (/api/risks)', async (url) => {
      const res = await fetch(`${url}/risks`, {
        headers: { Authorization: `Bearer ${supplyToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Supply Manager on /api/risks, got ${res.status}`);
      }
    }, baseUrl);

    // Test 34: Supply Manager blocked from Admin Audit Logs (/api/audit)
    await runTest('34. Supply Manager Blocked from Admin Audit Logs (/api/audit)', async (url) => {
      const res = await fetch(`${url}/audit`, {
        headers: { Authorization: `Bearer ${supplyToken}` },
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for Supply Manager on /api/audit, got ${res.status}`);
      }
    }, baseUrl);

    // Test 35: Panda AI Role-Based Isolation for Hospital Manager
    await runTest('35. Panda AI Scoped to Assigned Facility for Hospital Manager', async (url) => {
      const res = await fetch(`${url}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
        body: JSON.stringify({ message: 'Which facility is at highest risk?' }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 200 || !data.success || !data.data.reply) {
        throw new Error(`Panda AI chat failed for Manager with status ${res.status}`);
      }
      // Must not reveal network-wide highest risk facility (Hospital A or other facility)
      // Must focus on assigned facility
      const reply = data.data.reply;
      if (reply.toLowerCase().includes('district general hospital lucknow')) {
        throw new Error(`Security breach: Panda leaked peer facility name in Manager chat: ${reply}`);
      }
      if (!reply.toLowerCase().includes('assigned facility') && !reply.toLowerCase().includes('phc bakshi ka talab')) {
        throw new Error(`Expected reply to mention assigned facility or PHC Bakshi Ka Talab, got: ${reply}`);
      }
    }, baseUrl);

    // Test 36: Panda AI Role-Based Isolation for Supply Manager
    await runTest('36. Panda AI Scoped to Supply Logistics for Supply Manager', async (url) => {
      const res = await fetch(`${url}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supplyToken}` },
        body: JSON.stringify({ message: 'Which facility is at highest risk?' }),
      });
      const data = (await res.json()) as any;
      if (res.status !== 200 || !data.success || !data.data.reply) {
        throw new Error(`Panda AI chat failed for Supply Manager with status ${res.status}`);
      }
      // Must not expose network risk rankings
      const reply = data.data.reply;
      if (reply.toLowerCase().includes('district general hospital lucknow')) {
        throw new Error(`Security breach: Panda leaked network risk ranking to Supply Manager: ${reply}`);
      }
      if (!reply.toLowerCase().includes('supply') && !reply.toLowerCase().includes('transfer') && !reply.toLowerCase().includes('logistics')) {
        throw new Error(`Expected Supply Manager Panda response to clarify supply/transfer scope, got: ${reply}`);
      }
    }, baseUrl);

    // Test 37: Transfer Sources Endpoint Minimal Disclosure
    await runTest('37. Transfer Sources Endpoint (/api/transfers/transfer-sources)', async (url) => {
      const res = await fetch(`${url}/transfers/transfer-sources`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      const data = (await res.json()) as any;
      if (res.status !== 200 || !data.success || !Array.isArray(data.data)) {
        throw new Error(`Expected 200 array for /api/transfers/transfer-sources, got ${res.status}`);
      }
      // Check that it only returns minimal donor fields (id, name, type, district) and NO operational stats
      const first = data.data[0];
      if (first.inventory || first.patientAdmissions || first.alerts || first.staffCount) {
        throw new Error(`Leaked operational statistics in transfer sources: ${JSON.stringify(first)}`);
      }
    }, baseUrl);

  } finally {
    server.close();
    await prisma.$disconnect();
  }

  // Summary
  console.log('\n====================================================');
  console.log('TEST SUITE EXECUTION SUMMARY');
  console.log('====================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error('\nFailed Tests:');
    results.filter((r) => !r.passed).forEach((r) => console.error(`- ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log(`\nALL ${results.length} AUTOMATED TESTS PASSED SUCCESSFULLY! ✓`);
  }
}

main().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
