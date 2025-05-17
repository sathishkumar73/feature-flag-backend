import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  for (let i = 1; i <= 20; i++) {
    await prisma.featureFlag.create({
      data: {
        name: `Test Flag ${i}`,
        description: `This is test flag number ${i}`,
        enabled: i % 2 === 0,
        environment: i % 2 === 0 ? 'production' : 'staging',
      },
    });
  }
}

main()
  .then(() => console.log('Seeding complete!'))
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
