const express = require('express');
const {
  getAdminProperties,
  reviewProperty,
  getAreaRentAnalytics,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/properties', getAdminProperties);
router.patch('/properties/:id/review', reviewProperty);
router.get('/analytics/area-rent', getAreaRentAnalytics);

module.exports = router;
