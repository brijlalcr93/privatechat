import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Log } from '../models/Log';
import { userAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforprivatechat123!';

// @route   POST api/auth/register
// @desc    Register a user
router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  const { username, email, password, avatar } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      email,
      password: hashedPassword,
      avatar: avatar || '',
      role: 'user',
      status: 'active',
    });

    await user.save();

    // Create system log
    await new Log({
      action: 'USER_REGISTER',
      details: `New user account registered: ${username}`,
      userId: user._id,
      username: user.username,
    }).save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  const { emailOrUsername, password } = req.body;

  try {
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    // Search by username or email
    const user = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }],
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended by the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Create system log
    await new Log({
      action: 'USER_LOGIN',
      details: `User logged in: ${user.username}`,
      userId: user._id,
      username: user.username,
    }).save();

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user details
router.get('/me', userAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error retrieving profile' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update current user profile
router.put('/profile', userAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { username, email, avatar } = req.body;

  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If changing username or email, verify it's not taken
    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      user.username = username;
    }

    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ error: 'Email is already taken' });
      }
      user.email = email.toLowerCase();
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    // Create system log
    await new Log({
      action: 'USER_PROFILE_UPDATE',
      details: `User profile updated: ${user.username}`,
      userId: user._id,
      username: user.username,
    }).save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

export default router;
