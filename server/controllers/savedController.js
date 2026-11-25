const SavedProperty = require('../models/SavedProperty');
const Property = require('../models/Property');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/saved
 * @access  Private (tenant)
 */
const getSavedProperties = asyncHandler(async (req, res) => {
  const entries = await SavedProperty.find({ tenant: req.user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'property',
      populate: { path: 'owner', select: 'name email phone' },
    });

  const validEntries = entries.filter(
    (entry) => entry.property && entry.property.approvalStatus === 'approved'
  );

  const savedPropertyIds = validEntries.map((entry) => entry.property._id.toString());

  res.status(200).json({
    success: true,
    data: validEntries,
    savedPropertyIds,
  });
});

/**
 * @route   POST /api/saved/:propertyId
 * @access  Private (tenant)
 */
const saveProperty = asyncHandler(async (req, res, next) => {
  const { propertyId } = req.params;

  const property = await Property.findById(propertyId);
  if (!property || property.approvalStatus !== 'approved') {
    return next(new AppError('Property not found', 404));
  }

  const existing = await SavedProperty.findOne({
    tenant: req.user._id,
    property: property._id,
  });

  if (existing) {
    return res.status(200).json({
      success: true,
      alreadySaved: true,
      message: 'Property already saved',
      data: existing,
    });
  }

  const saved = await SavedProperty.create({
    tenant: req.user._id,
    property: property._id,
  });

  res.status(201).json({
    success: true,
    alreadySaved: false,
    message: 'Property saved to shortlist',
    data: saved,
  });
});

/**
 * @route   DELETE /api/saved/:propertyId
 * @access  Private (tenant)
 */
const removeSavedProperty = asyncHandler(async (req, res, next) => {
  const deleted = await SavedProperty.findOneAndDelete({
    tenant: req.user._id,
    property: req.params.propertyId,
  });

  if (!deleted) {
    return next(new AppError('Saved property not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Property removed from shortlist',
  });
});

module.exports = {
  getSavedProperties,
  saveProperty,
  removeSavedProperty,
};
