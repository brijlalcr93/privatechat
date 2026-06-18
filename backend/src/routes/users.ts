import { Router, Response } from 'express';
import { User } from '../models/User';
import { userAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// @route   GET api/users
// @desc    Get all active users for chat selection (excluding self)
router.get('/', userAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const search = req.query.search as string;
    let query: any = {
      _id: { $ne: req.user?.id },
      status: 'active',
    };

    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    const users = await User.find(query).select('username email avatar role isOnline lastSeen');
    res.json(users);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error retrieving users' });
  }
});

export default router;
