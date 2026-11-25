const express = require('express');
const {
  createEnquiry,
  getSentEnquiries,
  getReceivedEnquiries,
  updateEnquiryStatus,
} = require('../controllers/enquiryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', protect, authorize('tenant'), createEnquiry);
router.get('/sent', protect, authorize('tenant'), getSentEnquiries);
router.get('/received', protect, authorize('owner'), getReceivedEnquiries);
router.patch('/:id/status', protect, authorize('owner'), updateEnquiryStatus);

module.exports = router;
