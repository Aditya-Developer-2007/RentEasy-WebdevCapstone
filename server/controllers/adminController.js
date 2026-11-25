const Property = require('../models/Property');
const { APPROVAL_STATUSES } = require('../models/Property');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Escape regex metacharacters for safe case-insensitive filtering.
 */
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @route   GET /api/admin/properties
 * @access  Private (admin)
 */
const getAdminProperties = asyncHandler(async (req, res, next) => {
  const { status = 'pending', page = 1, limit = 12 } = req.query;

  if (!APPROVAL_STATUSES.includes(status)) {
    return next(new AppError(`Invalid status filter: ${status}`, 400));
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;
  const sortOrder = status === 'pending' ? { createdAt: 1 } : { createdAt: -1 };

  const filter = { approvalStatus: status };

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('owner', 'name email phone')
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum),
    Property.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: properties,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * @route   PATCH /api/admin/properties/:id/review
 * @access  Private (admin)
 */
const reviewProperty = asyncHandler(async (req, res, next) => {
  const { status, rejectionReason } = req.body;

  if (status !== 'approved' && status !== 'rejected') {
    return next(new AppError("Review status must be 'approved' or 'rejected'", 400));
  }

  const trimmedReason =
    typeof rejectionReason === 'string' ? rejectionReason.trim() : '';

  if (status === 'rejected' && !trimmedReason) {
    return next(new AppError('Rejection reason is required when rejecting a property', 400));
  }

  const property = await Property.findById(req.params.id);
  if (!property) {
    return next(new AppError('Property not found', 404));
  }

  property.approvalStatus = status;
  property.rejectionReason = status === 'rejected' ? trimmedReason : '';
  property.reviewedBy = req.user._id;
  property.reviewedAt = new Date();

  await property.save();

  res.status(200).json({
    success: true,
    data: property,
  });
});

/**
 * @route   GET /api/admin/analytics/area-rent
 * @access  Private (admin)
 */
const getAreaRentAnalytics = asyncHandler(async (req, res) => {
  const { city, includeUnapproved } = req.query;

  const matchStage = {};
  if (includeUnapproved !== 'true') {
    matchStage.approvalStatus = 'approved';
  }
  if (city && String(city).trim()) {
    matchStage['location.city'] = new RegExp(`^${escapeRegex(String(city).trim())}$`, 'i');
  }

  const [areaStats, statusCounts] = await Promise.all([
    Property.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            area: { $toLower: '$location.area' },
            city: { $toLower: '$location.city' },
          },
          area: { $first: '$location.area' },
          city: { $first: '$location.city' },
          avgRent: { $avg: '$rent' },
          minRent: { $min: '$rent' },
          maxRent: { $max: '$rent' },
          totalListings: { $sum: 1 },
          availableListings: { $sum: { $cond: ['$isAvailable', 1, 0] } },
          avgBedrooms: { $avg: '$bedrooms' },
        },
      },
      {
        $project: {
          _id: 0,
          area: 1,
          city: 1,
          avgRent: { $round: ['$avgRent', 0] },
          minRent: 1,
          maxRent: 1,
          totalListings: 1,
          availableListings: 1,
          avgBedrooms: { $round: ['$avgBedrooms', 1] },
        },
      },
      { $sort: { avgRent: -1, totalListings: -1 } },
    ]),
    Property.aggregate([
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary = { pending: 0, approved: 0, rejected: 0, total: 0 };
  for (const item of statusCounts) {
    if (item._id in summary) {
      summary[item._id] = item.count;
      summary.total += item.count;
    }
  }

  res.status(200).json({
    success: true,
    summary,
    areaStats,
  });
});

module.exports = {
  getAdminProperties,
  reviewProperty,
  getAreaRentAnalytics,
};
