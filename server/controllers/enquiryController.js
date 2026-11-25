const Enquiry = require('../models/Enquiry');
const { ENQUIRY_TYPES, ENQUIRY_STATUSES } = require('../models/Enquiry');
const Property = require('../models/Property');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const OWNER_ALLOWED_STATUSES = ['accepted', 'declined', 'completed'];

/**
 * Build optional status/type filter for enquiry list queries.
 */
const buildEnquiryFilter = (baseFilter, query, next) => {
  const { status, type } = query;
  const filter = { ...baseFilter };

  if (status) {
    if (!ENQUIRY_STATUSES.includes(status)) {
      next(new AppError(`Invalid status filter: ${status}`, 400));
      return null;
    }
    filter.status = status;
  }

  if (type) {
    if (!ENQUIRY_TYPES.includes(type)) {
      next(new AppError(`Invalid type filter: ${type}`, 400));
      return null;
    }
    filter.type = type;
  }

  return filter;
};

/**
 * @route   POST /api/enquiries
 * @access  Private (tenant)
 */
const createEnquiry = asyncHandler(async (req, res, next) => {
  const { propertyId, type = 'enquiry', message, preferredVisitDate } = req.body;

  if (!propertyId) {
    return next(new AppError('propertyId is required', 400));
  }

  if (!ENQUIRY_TYPES.includes(type)) {
    return next(new AppError(`Invalid enquiry type: ${type}`, 400));
  }

  const property = await Property.findById(propertyId);
  if (!property || property.approvalStatus !== 'approved') {
    return next(new AppError('Property not found', 404));
  }

  if (!property.isAvailable) {
    return next(new AppError('Property is currently not available for enquiries', 400));
  }

  let parsedVisitDate = null;
  if (type === 'visit_request') {
    if (!preferredVisitDate) {
      return next(new AppError('preferredVisitDate is required for visit requests', 400));
    }
    parsedVisitDate = new Date(preferredVisitDate);
    if (Number.isNaN(parsedVisitDate.getTime())) {
      return next(new AppError('preferredVisitDate must be a valid date', 400));
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (parsedVisitDate < startOfToday) {
      return next(new AppError('preferredVisitDate cannot be in the past', 400));
    }
  }

  const existingPending = await Enquiry.findOne({
    property: property._id,
    tenant: req.user._id,
    type,
    status: 'pending',
  });

  if (existingPending) {
    return next(
      new AppError('You already have a pending request for this property', 409)
    );
  }

  const enquiry = await Enquiry.create({
    property: property._id,
    tenant: req.user._id,
    owner: property.owner,
    type,
    message,
    preferredVisitDate: parsedVisitDate,
  });

  await enquiry.populate([
    { path: 'property', select: 'title rent location images' },
    { path: 'owner', select: 'name email phone' },
  ]);

  res.status(201).json({
    success: true,
    data: enquiry,
  });
});

/**
 * @route   GET /api/enquiries/sent
 * @access  Private (tenant)
 */
const getSentEnquiries = asyncHandler(async (req, res, next) => {
  const filter = buildEnquiryFilter({ tenant: req.user._id }, req.query, next);
  if (!filter) return;

  const enquiries = await Enquiry.find(filter)
    .sort({ createdAt: -1 })
    .populate('property', 'title rent location propertyType images isAvailable')
    .populate('owner', 'name email phone');

  res.status(200).json({
    success: true,
    data: enquiries,
  });
});

/**
 * @route   GET /api/enquiries/received
 * @access  Private (owner)
 */
const getReceivedEnquiries = asyncHandler(async (req, res, next) => {
  const filter = buildEnquiryFilter({ owner: req.user._id }, req.query, next);
  if (!filter) return;

  const enquiries = await Enquiry.find(filter)
    .sort({ createdAt: -1 })
    .populate('property', 'title rent location propertyType')
    .populate('tenant', 'name email phone');

  res.status(200).json({
    success: true,
    data: enquiries,
  });
});

/**
 * @route   PATCH /api/enquiries/:id/status
 * @access  Private (owner)
 */
const updateEnquiryStatus = asyncHandler(async (req, res, next) => {
  const { status, ownerResponse } = req.body;

  if (!OWNER_ALLOWED_STATUSES.includes(status)) {
    return next(
      new AppError(
        `Status must be one of: ${OWNER_ALLOWED_STATUSES.join(', ')}`,
        400
      )
    );
  }

  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    return next(new AppError('Enquiry not found', 404));
  }

  if (enquiry.owner.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to update this enquiry', 403));
  }

  enquiry.status = status;
  if (ownerResponse !== undefined) {
    enquiry.ownerResponse = String(ownerResponse).trim();
  }
  enquiry.respondedAt = new Date();

  await enquiry.save();
  await enquiry.populate([
    { path: 'property', select: 'title rent location propertyType' },
    { path: 'tenant', select: 'name email phone' },
  ]);

  res.status(200).json({
    success: true,
    data: enquiry,
  });
});

module.exports = {
  createEnquiry,
  getSentEnquiries,
  getReceivedEnquiries,
  updateEnquiryStatus,
};
