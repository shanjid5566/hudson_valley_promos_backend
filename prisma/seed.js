require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Create database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Create Prisma client with adapter
const prisma = new PrismaClient({
  adapter,
});

/**
 * Seed admin user
 * Default credentials: admin@example.com / Admin@123456
 * 
 * Usage: npm run prisma:seed
 */
async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Admin credentials
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin@123456';
    const adminFirstName = 'Admin';
    const adminLastName = 'User';

    console.log('🔐 Hashing password...');
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    console.log('🔍 Checking if admin exists...');
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('✓ Admin user already exists:', adminEmail);
      if (existingAdmin.role === 'ADMIN') {
        console.log('✓ Admin user has ADMIN role');
      } else {
        // Update role to ADMIN if it's not
        console.log('📝 Updating user role to ADMIN...');
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'ADMIN' },
        });
        console.log('✓ Updated user role to ADMIN');
      }
    } else {
      // Create new admin user
      console.log('👤 Creating new admin user...');
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: 'ADMIN',
          isEmailVerified: true, // Admin email is pre-verified
          phone: '+1234567890',
        },
      });

      console.log('✓ Admin user created successfully!');
      console.log('  Email:', admin.email);
      console.log('  Name:', `${admin.firstName} ${admin.lastName}`);
      console.log('  Role:', admin.role);
      console.log('  ID:', admin.id);
    }

    console.log('\n📧 Default Admin Credentials:');
    console.log('  Email:', adminEmail);
    console.log('  Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');

    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error('\n📋 Troubleshooting:');
    console.error('   1. Make sure PostgreSQL is running');
    console.error('   2. Check DATABASE_URL in .env file');
    console.error('   3. Run migrations first: npm run prisma:migrate');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run seed
main();
