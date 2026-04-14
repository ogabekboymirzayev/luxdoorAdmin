const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const Decimal = require('decimal.js');

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete existing admin users to avoid conflicts
    await prisma.user.deleteMany();

    // Get superadmin credentials from environment variables
    const superadminUsername = process.env.NEXTAUTH_SUPERADMIN_USERNAME;
    const superadminPassword = process.env.NEXTAUTH_SUPERADMIN_PASSWORD;

    if (!superadminUsername || !superadminPassword) {
      throw new Error(
        'NEXTAUTH_SUPERADMIN_USERNAME and NEXTAUTH_SUPERADMIN_PASSWORD must be set in .env.local'
      );
    }

    // Hash the superadmin password
    const hashedPassword = await bcrypt.hash(superadminPassword, 10);

    // Create default SUPERADMIN user
    const superAdmin = await prisma.user.create({
      data: {
        username: superadminUsername,
        password: hashedPassword,
        role: 'SUPERADMIN'
      }
    });

    console.log('✅ Default SUPERADMIN created:', superAdmin);

    // Create sample categories
    const categoryUz = await prisma.category.create({
      data: {
        nameUz: "Ichki Eshiklar",
        nameRu: "Внутренние двери"
      }
    });

    const categoryRu = await prisma.category.create({
      data: {
        nameUz: "Tashqi Eshiklar",
        nameRu: "Внешние двери"
      }
    });

    console.log('✅ Sample categories created');

    // Create sample products matching frontend data
    const products = [
      {
        slug: "Миламин-602",
        nameUz: "Milamin 602",
        nameRu: "Миламин 602",
        descriptionUz: "Sasna yog'ochidan tayyorlangan karkas va yuqori zichlikdagi MDF filyonkalardan iborat sifatli eshik. ECO shpon qoplamasi chidamlilikni ta'minlaydi.",
        descriptionRu: "Качественная дверь с каркасом из сосны и филенками из МДФ высокой плотности. Покрытие ECO шпон обеспечивает долговечность.",
        price: "750000.00",
        categoryId: categoryUz.id,
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/products/milamin-602.jpg"
        ],
        attributes: {
          material: "Sasna / Сосна",
          thickness: "40",
          color: "Shokolat rang / Шоколадный",
          category: "ECO шпон",
          construction: "Filyonkali, tsargovaya / Филенчатая, царговая",
          pogonaj: "Teleskopik / Телескопический"
        }
      },
      {
        slug: "Миламин-601",
        nameUz: "Milamin 601",
        nameRu: "Миламин 601",
        descriptionUz: "MDF filyonkali va ECO shpon qoplamali, mustahkam sasna karkasli zamonaviy ichki eshik.",
        descriptionRu: "Современная межкомнатная дверь с каркасом из сосны, филенками из МДФ и покрытием ECO шпон.",
        price: "750000.00",
        categoryId: categoryUz.id,
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/products/milamin-601.jpg"
        ],
        attributes: {
          material: "Sasna / Сосна",
          thickness: "40",
          color: "Shokolat rang / Шоколадный",
          category: "ECO шпон",
          construction: "Filyonkali, tsargovaya / Филенчатая, царговая",
          pogonaj: "Teleskopik / Телескопический"
        }
      },
      {
        slug: "Миламин-502",
        nameUz: "Milamin 502",
        nameRu: "Миламин 502",
        descriptionUz: "Milamin 502 — klassik uslubdagi, ECO shpon qoplamali va filyonkali konstruksiyaga ega bo'lgan mustahkam ichki eshik.",
        descriptionRu: "Миламин 502 — классическая межкомнатная дверь с покрытием ECO шпон и филенчатой конструкцией.",
        price: "750000.00",
        categoryId: categoryUz.id,
        images: [
          "https://res.cloudinary.com/demo/image/upload/v1/products/milamin-502.jpg"
        ],
        attributes: {
          material: "Sasna / Сосна",
          thickness: "40",
          color: "Shokolat rang / Шоколадный",
          category: "ECO шпон",
          construction: "Filyonkali, tsargovaya / Филенчатая, царговая",
          pogonaj: "Teleskopik / Телескопический"
        }
      }
    ];

    for (const productData of products) {
      await prisma.product.create({
        data: productData
      });
    }

    console.log('✅ Sample products created');

    // Create sample lead
    const lead = await prisma.lead.create({
      data: {
        name: "Test Lead",
        phone: "+998901234567",
        message: "Men eshik xarid qilmoqchiman",
        status: "NOT_CALLED"
      }
    });

    console.log('✅ Sample lead created');

    console.log('🌱 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
