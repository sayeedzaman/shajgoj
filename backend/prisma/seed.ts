import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const concerns = [
  { name: 'Acne', slug: 'acne' },
  { name: 'Anti-Aging', slug: 'anti-aging' },
  { name: 'Dandruff', slug: 'dandruff' },
  { name: 'Dry Skin', slug: 'dry-skin' },
  { name: 'Hair Fall', slug: 'hair-fall' },
  { name: 'Oil Control', slug: 'oil-control' },
  { name: 'Pore Care', slug: 'pore-care' },
  { name: 'Hyperpigmentation', slug: 'hyperpigmentation' },
  { name: 'Hair Thinning', slug: 'hair-thinning' },
  { name: 'Sun Protection', slug: 'sun-protection' },
];

async function main() {
  console.log('Start seeding concerns...');

  for (const concern of concerns) {
    await prisma.concern.upsert({
      where: { slug: concern.slug },
      update: {},
      create: concern,
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
