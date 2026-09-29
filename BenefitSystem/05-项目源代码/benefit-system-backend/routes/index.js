const { Router } = require('express');
const { verifyToken } = require('../middleware/authJwt');
const { verifyRole } = require('../middleware/verifyRole');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const giftRoutes = require('./gift.routes');
const activityRoutes = require('./activity.routes');
const addressRoutes = require('./address.routes');
const applyRoutes = require('./apply.routes');
const deliverRoutes = require('./deliver.routes');
const signRoutes = require('./sign.routes');
const statisticsRoutes = require('./statistics.routes');
const exportRoutes = require('./export.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', verifyToken, verifyRole('admin'), userRoutes);
router.use('/roles', verifyToken, verifyRole('admin'), roleRoutes);
router.use('/gifts', verifyToken, verifyRole(['hr', 'admin']), giftRoutes);
router.use('/activities', verifyToken, activityRoutes);
router.use('/addresses', verifyToken, addressRoutes);
router.use('/apply', verifyToken, applyRoutes);
router.use('/deliver', verifyToken, verifyRole(['hr', 'admin']), deliverRoutes);
router.use('/sign', verifyToken, signRoutes);
router.use('/statistics', verifyToken, verifyRole(['hr', 'admin']), statisticsRoutes);
router.use('/export', verifyToken, verifyRole(['hr', 'admin']), exportRoutes);

module.exports = router;
