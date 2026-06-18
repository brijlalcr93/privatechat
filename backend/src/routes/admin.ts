import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { Admin } from '../models/Admin';
import { Log } from '../models/Log';
import { adminAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'adminsecretjwtkeyforprivatechat987!';

// @route   POST api/admin/login
// @desc    Admin login
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    // Check in Admin collection
    const admin = await Admin.findOne({ username });
    if (!admin) {
      // Also allow a User with role 'admin' to log in here
      const userAdmin = await User.findOne({ username, role: 'admin', status: 'active' });
      if (!userAdmin) {
        return res.status(400).json({ error: 'Invalid admin credentials' });
      }

      const isMatch = await bcrypt.compare(password, userAdmin.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid admin credentials' });
      }

      const token = jwt.sign({ id: userAdmin._id, role: 'admin' }, ADMIN_JWT_SECRET, {
        expiresIn: '1d',
      });

      await new Log({
        action: 'ADMIN_LOGIN',
        details: `Administrator logged in: ${userAdmin.username}`,
        userId: userAdmin._id,
        username: userAdmin.username,
      }).save();

      return res.json({
        token,
        admin: {
          id: userAdmin._id,
          username: userAdmin.username,
          role: 'admin',
        },
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, ADMIN_JWT_SECRET, {
      expiresIn: '1d',
    });

    await new Log({
      action: 'ADMIN_LOGIN',
      details: `Administrator logged in: ${admin.username}`,
      username: admin.username,
    }).save();

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// @route   GET api/admin/stats
// @desc    Get dashboard analytics metrics
router.get('/stats', adminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ isOnline: true, role: 'user' });
    const totalMessages = await Message.countDocuments();
    const totalGroups = await Chat.countDocuments({ type: 'group' });

    // Messages sent today (since midnight)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const messagesToday = await Message.countDocuments({
      createdAt: { $gte: todayMidnight },
    });

    // 7-day user activity chart data (messages sent per day)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setDate(end.getDate() - i);
      end.setHours(23, 59, 59, 999);

      const count = await Message.countDocuments({
        createdAt: { $gte: start, $lte: end },
      });

      const dayLabel = start.toLocaleDateString('en-US', { weekday: 'short' });
      chartData.push({ label: dayLabel, count });
    }

    // Recent activity log feed
    const recentLogs = await Log.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('userId', 'username avatar');

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalMessages,
        totalGroups,
        messagesToday,
      },
      chartData,
      recentLogs,
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error generating statistics' });
  }
});

// @route   GET api/admin/users
// @desc    View all users
router.get('/users', adminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error retrieving users' });
  }
});

// @route   POST api/admin/users
// @desc    Create a new user by Admin
router.post('/users', adminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { username, email, password, avatar } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      avatar: avatar || '',
      role: 'user',
      status: 'active',
    });

    await user.save();

    await new Log({
      action: 'ADMIN_CREATE_USER',
      details: `Admin ${req.admin?.username} created user account: ${username}`,
      userId: user._id,
      username: user.username,
    }).save();

    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// @route   PUT api/admin/users/:userId
// @desc    Edit user by Admin (update role, status, credentials)
router.put('/users/:userId', adminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { username, email, status, role, password } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) return res.status(400).json({ error: 'Username already taken' });
      user.username = username;
    }

    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ error: 'Email already taken' });
      user.email = email.toLowerCase();
    }

    if (status) {
      user.status = status;
    }

    if (role) {
      user.role = role;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    await new Log({
      action: 'ADMIN_UPDATE_USER',
      details: `Admin ${req.admin?.username} updated user: ${user.username} (Status: ${user.status})`,
      userId: user._id,
      username: user.username,
    }).save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// @route   DELETE api/admin/users/:userId
// @desc    Delete user by Admin
router.delete('/users/:userId', adminAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.findByIdAndDelete(userId);
    // Delete all chats that are O2O involving this user, or remove them from groups
    await Chat.deleteMany({ type: 'one-to-one', participants: userId });
    await Chat.updateMany({ type: 'group' }, { $pull: { participants: userId } });

    await new Log({
      action: 'ADMIN_DELETE_USER',
      details: `Admin ${req.admin?.username} deleted user: ${user.username}`,
      username: user.username,
    }).save();

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// @route   GET api/admin/chats
// @desc    View all chats
router.get('/chats', adminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const chats = await Chat.find({})
      .populate('participants', 'username email status')
      .populate('groupAdmin', 'username')
      .sort({ createdAt: -1 });
    res.json(chats);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error retrieving chats' });
  }
});

// @route   GET api/admin/logs
// @desc    Get all audit logs
router.get('/logs', adminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await Log.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'username email');
    res.json(logs);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error retrieving logs' });
  }
});

export default router;
