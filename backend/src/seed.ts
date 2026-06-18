import dns from 'dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Chat } from './models/Chat';
import { Message } from './models/Message';
import { Admin } from './models/Admin';
import { Log } from './models/Log';

// Force Node.js to use Google DNS when running locally to resolve MongoDB Atlas SRV records
if (!process.env.RENDER) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (err) {
    console.warn('Failed to set custom DNS servers, using default resolver.', err);
  }
}

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/privatechat';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected. Clearing collections...');

    // Clear existing data
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await Admin.deleteMany({});
    await Log.deleteMany({});

    console.log('Collections cleared. Hashing passwords...');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);

    // Create Admins
    console.log('Seeding administrative accounts...');
    const sysAdmin = new Admin({
      username: 'admin',
      password: adminPassword,
      role: 'superadmin',
    });
    await sysAdmin.save();

    // Create Users (with some admin roles as well)
    console.log('Seeding user accounts...');
    const alice = new User({
      username: 'Alice',
      email: 'alice@apple.com',
      password: defaultPassword,
      role: 'admin', // Alice is a system admin too
      status: 'active',
      isOnline: true,
    });

    const bob = new User({
      username: 'Bob',
      email: 'bob@apple.com',
      password: defaultPassword,
      role: 'user',
      status: 'active',
      isOnline: false,
      lastSeen: new Date(Date.now() - 15 * 60000), // 15 mins ago
    });

    const charlie = new User({
      username: 'Charlie',
      email: 'charlie@apple.com',
      password: defaultPassword,
      role: 'user',
      status: 'active',
      isOnline: true,
    });

    const david = new User({
      username: 'David',
      email: 'david@apple.com',
      password: defaultPassword,
      role: 'user',
      status: 'suspended', // David starts suspended for testing suspension capabilities
      isOnline: false,
    });

    await Promise.all([alice.save(), bob.save(), charlie.save(), david.save()]);

    console.log('Seeding direct conversation and group chats...');
    // Create one-to-one chat
    const directChat = new Chat({
      type: 'one-to-one',
      participants: [alice._id, bob._id],
    });
    await directChat.save();

    // Create group chat
    const groupChat = new Chat({
      type: 'group',
      participants: [alice._id, bob._id, charlie._id],
      groupName: 'Apple Dev Team',
      groupDescription: 'Collaborative channel for the private chat development team',
      groupAdmin: alice._id,
    });
    await groupChat.save();

    console.log('Seeding conversation messages...');
    // Seeding messages for direct chat
    const o2oMessages = [
      {
        chatId: directChat._id,
        senderId: bob._id,
        content: 'Hi Alice! Did you review the layout designs for the new messaging dashboard?',
        createdAt: new Date(Date.now() - 2 * 3600000), // 2 hours ago
        seen: true,
      },
      {
        chatId: directChat._id,
        senderId: alice._id,
        content: 'Hey Bob, yes I did. The glassmorphism borders look absolutely stunning. Very clean SF Pro vibe.',
        createdAt: new Date(Date.now() - 1.8 * 3600000),
        seen: true,
      },
      {
        chatId: directChat._id,
        senderId: bob._id,
        content: 'Awesome! Let\'s setup Socket.IO and integrate Framer Motion transitions next.',
        createdAt: new Date(Date.now() - 1.5 * 3600000),
        seen: false,
      },
    ];

    // Seeding messages for group chat
    const groupMessages = [
      {
        chatId: groupChat._id,
        senderId: alice._id,
        content: 'Welcome everyone to the Apple Dev Team workspace! 🎉',
        createdAt: new Date(Date.now() - 24 * 3600000), // 1 day ago
        seen: true,
      },
      {
        chatId: groupChat._id,
        senderId: charlie._id,
        content: 'Thanks Alice! Excited to start building this real-time app.',
        createdAt: new Date(Date.now() - 23.8 * 3600000),
        seen: true,
      },
      {
        chatId: groupChat._id,
        senderId: bob._id,
        content: 'Hey guys, checking in. I will start working on the responsive mobile layout views.',
        createdAt: new Date(Date.now() - 23.5 * 3600000),
        seen: true,
      },
      {
        chatId: groupChat._id,
        senderId: alice._id,
        content: 'Perfect, keep me updated on the chat bubbles layout.',
        createdAt: new Date(Date.now() - 23.2 * 3600000),
        seen: true,
      },
      {
        chatId: groupChat._id,
        senderId: charlie._id,
        content: 'Has anyone finished setting up the Mongoose schemas yet?',
        createdAt: new Date(Date.now() - 1 * 3600000), // 1 hour ago
        seen: true,
      },
    ];

    await Message.insertMany([...o2oMessages, ...groupMessages]);

    console.log('Seeding activity audit logs...');
    // Seeding system logs
    const activityLogs = [
      {
        action: 'USER_REGISTER',
        details: 'New user account registered: Alice',
        userId: alice._id,
        username: alice.username,
        createdAt: new Date(Date.now() - 30 * 3600000),
      },
      {
        action: 'USER_REGISTER',
        details: 'New user account registered: Bob',
        userId: bob._id,
        username: bob.username,
        createdAt: new Date(Date.now() - 29 * 3600000),
      },
      {
        action: 'USER_REGISTER',
        details: 'New user account registered: Charlie',
        userId: charlie._id,
        username: charlie.username,
        createdAt: new Date(Date.now() - 28 * 3600000),
      },
      {
        action: 'USER_REGISTER',
        details: 'New user account registered: David',
        userId: david._id,
        username: david.username,
        createdAt: new Date(Date.now() - 27 * 3600000),
      },
      {
        action: 'ADMIN_SUSPEND_USER',
        details: 'Admin suspended user account: David',
        username: 'admin',
        createdAt: new Date(Date.now() - 26 * 3600000),
      },
      {
        action: 'CHAT_CREATE_GROUP',
        details: 'Group chat "Apple Dev Team" created by Alice',
        userId: alice._id,
        username: alice.username,
        createdAt: new Date(Date.now() - 24 * 3600000),
      },
    ];

    await Log.insertMany(activityLogs);

    console.log('Database seeded successfully!');
    console.log('\nDefault credentials created:');
    console.log('- Sys Admin: admin / admin123');
    console.log('- Alice (User & Admin): Alice / password123');
    console.log('- Bob (User): Bob / password123');
    console.log('- Charlie (User): Charlie / password123');
    console.log('- David (Suspended User): David / password123');

    await mongoose.disconnect();
    console.log('Disconnected from database.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
