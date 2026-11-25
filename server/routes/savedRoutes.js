const express = require('express');
const {
  getSavedProperties,
  saveProperty,
  removeSavedProperty,
} = require('../controllers/savedController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('tenant'));

router.get('/', getSavedProperties);
router.post('/:propertyId', saveProperty);
router.delete('/:propertyId', removeSavedProperty);

module.exports = router;
