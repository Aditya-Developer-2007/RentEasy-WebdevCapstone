const express = require('express');
const {
  getProperties,
  getMyProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} = require('../controllers/propertyController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Static routes MUST be registered before dynamic /:id routes
router.get('/mine', protect, authorize('owner'), getMyProperties);

router.get('/', getProperties);
router.post('/', protect, authorize('owner'), createProperty);

router.get('/:id', optionalProtect, getPropertyById);
router.patch('/:id', protect, authorize('owner'), updateProperty);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteProperty);

module.exports = router;
