import { prisma } from '../repositories/prisma.js';

async function updateResourceName() {
  const res = await prisma.resource.findFirst({
    where: { name: { contains: 'Paracetamol' } },
  });
  if (res) {
    await prisma.resource.update({
      where: { id: res.id },
      data: { name: 'Medicine X (Paracetamol 500mg)' },
    });
    console.log('Updated resource name to: Medicine X (Paracetamol 500mg)');
  }
}

updateResourceName()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
