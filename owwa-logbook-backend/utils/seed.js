require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const connectDB = require('../config/db');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

const seed = async () => {
  await connectDB();

  try {
    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@1234', 12);
    const admin = await User.create({
      firstName: 'OWWA',
      lastName: 'Administrator',
      email: 'admin@owwa9.gov.ph',
      phone: '09171234567',
      owwaId: 'ADMIN-001',
      address: 'OWWA Region 9 Office, Zamboanga City',
      password: 'Admin@1234', // Will be hashed by pre-save hook
      role: 'admin',
      status: 'approved',
    });
    console.log(`✅ Admin created: ${admin.email} / Admin@1234`);

    // Sample users data
    const sampleUsers = [
      {
        firstName: 'Ana',
        lastName: 'Reyes',
        email: 'ana.reyes@email.com',
        phone: '09201234567',
        owwaId: 'OWWA-2024-003',
        address: 'Dipolog City',
        password: 'User@1234',
        status: 'approved',
      },
      {
        firstName: 'Pedro',
        lastName: 'Garcia',
        email: 'pedro.garcia@email.com',
        phone: '09211234567',
        owwaId: '',
        address: 'Dapitan City',
        password: 'User@1234',
        status: 'pending',
      },
      {
        firstName: 'Rosa',
        lastName: 'Lim',
        email: 'rosa.lim@email.com',
        phone: '09221234567',
        owwaId: '',
        address: 'Zamboanga del Norte',
        password: 'User@1234',
        status: 'pending',
      },
    ];

    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await User.create(userData);

      // Generate QR code for approved users
      if (user.status === 'approved') {
        const qrPayload = JSON.stringify({ userId: user._id.toString() });
        user.qrCode = await QRCode.toDataURL(qrPayload, {
          width: 300,
          margin: 2,
          color: { dark: '#1e3a8a', light: '#ffffff' },
        });
        await user.save();
      }

      createdUsers.push(user);
      console.log(`✅ User created: ${user.email} (${user.status})`);
    }

    // Create sample attendance for approved users (last 7 days)
    const approvedUsers = createdUsers.filter((u) => u.status === 'approved');
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Skip weekends for realism
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      for (const user of approvedUsers) {
        // 80% chance of attendance
        if (Math.random() > 0.2) {
          try {
            await Attendance.create({
              userId: user._id,
              date: dateStr,
              timestamp: new Date(date.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60))),
              scannedBy: admin._id,
            });
          } catch (e) {
            // Skip duplicates
          }
        }
      }
    }
    console.log('✅ Sample attendance records created');

    console.log('\n🎉 Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Login:');
    console.log('  Email:    admin@owwa9.gov.ph');
    console.log('  Password: Admin@1234');
    console.log('\nUser Login (approved):');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
