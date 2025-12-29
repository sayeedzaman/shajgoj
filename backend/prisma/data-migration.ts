import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('Starting data migration...');

    // Step 1: Get all existing categories
    const categories = await prisma.category.findMany();
    console.log(`Found ${categories.length} categories`);

    for (const category of categories) {
      console.log(`\nProcessing category: ${category.name}`);

      // Step 2: Create or find a default Type for each Category
      let type = await prisma.type.findFirst({
        where: {
          slug: 'general',
          categoryId: category.id,
        },
      });

      if (!type) {
        type = await prisma.type.create({
          data: {
            name: 'General',
            slug: 'general',
            description: `General ${category.name} products`,
            categoryId: category.id,
          },
        });
        console.log(`  ✓ Created Type: ${type.name} (${type.id})`);
      } else {
        console.log(`  ➜ Type already exists: ${type.name} (${type.id})`);
      }

      // Step 3: Create or find a default SubCategory for the Type
      let subCategory = await prisma.subCategory.findFirst({
        where: {
          slug: 'all-products',
          typeId: type.id,
        },
      });

      if (!subCategory) {
        subCategory = await prisma.subCategory.create({
          data: {
            name: 'All Products',
            slug: 'all-products',
            description: `All ${category.name} products`,
            typeId: type.id,
          },
        });
        console.log(`  ✓ Created SubCategory: ${subCategory.name} (${subCategory.id})`);
      } else {
        console.log(`  ➜ SubCategory already exists: ${subCategory.name} (${subCategory.id})`);
      }

      // Step 4: Update all products in this category to use the SubCategory
      // Use raw SQL since categoryId is not in the Prisma schema
      const result = await prisma.$executeRaw`
        UPDATE "Product"
        SET "subCategoryId" = ${subCategory.id}
        WHERE "categoryId" = ${category.id}
          AND "subCategoryId" IS NULL
      `;
      console.log(`  ✓ Updated ${result} products`);
    }

    console.log('\n✅ Data migration completed successfully!');

    // Verify migration using raw SQL
    const productsWithoutSubCategory = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count
      FROM "Product"
      WHERE "subCategoryId" IS NULL
    `;

    const totalProducts = await prisma.product.count();
    console.log(`\nVerification:`);
    console.log(`  Total products: ${totalProducts}`);
    console.log(`  Products without subCategory: ${Number(productsWithoutSubCategory[0].count)}`);

    if (Number(productsWithoutSubCategory[0].count) === 0) {
      console.log('  ✓ All products have been migrated');
    } else {
      console.log('  ⚠️ Some products are missing subCategoryId');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
