const Property = require('../models/Property');
const { PROPERTY_TYPES, APPROVAL_STATUSES } = require('../models/Property');
const SavedProperty = require('../models/SavedProperty');
const Enquiry = require('../models/Enquiry');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  rent_asc: { rent: 1 },
  rent_desc: { rent: -1 },
  bedrooms_desc: { bedrooms: -1 },
  area_desc: { areaSqFt: -1 },
};

const EDITABLE_FIELDS = [
  'title',
  'description',
  'rent',
  'deposit',
  'bedrooms',
  'bathrooms',
  'areaSqFt',
  'propertyType',
  'amenities',
  'images',
  'isAvailable',
];

const CORE_REVIEW_FIELDS = [
  'title',
  'description',
  'rent',
  'deposit',
  'bedrooms',
  'bathrooms',
  'areaSqFt',
  'propertyType',
  'location',
  'amenities',
  'images',
];

/**
 * Escape regex metacharacters to prevent ReDoS or invalid regex errors.
 */
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Pick allowed location fields from raw input.
 */
const pickLocation = (loc) => {
  if (!loc || typeof loc !== 'object') return undefined;
  const picked = {};
  if (loc.area !== undefined) picked.area = loc.area;
  if (loc.city !== undefined) picked.city = loc.city;
  if (loc.address !== undefined) picked.address = loc.address;
  if (loc.pincode !== undefined) picked.pincode = loc.pincode;
  return picked;
};

/**
 * Parse a numeric query parameter and throw 400 AppError if invalid.
 */
const parseNumericParam = (value, name) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new AppError(`Invalid numeric value for ${name}`, 400);
  }
  return num;
};

/**
 * @route   GET /api/properties
 * @access  Public
 */
const getProperties = asyncHandler(async (req, res, next) => {
  const {
    search,
    area,
    city,
    propertyType,
    minRent,
    maxRent,
    minBedrooms,
    maxBedrooms,
    amenities,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = req.query;

  const filter = {
    approvalStatus: 'approved',
    isAvailable: true,
  };

  if (search && String(search).trim()) {
    const regex = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [
      { title: regex },
      { 'location.area': regex },
      { 'location.city': regex },
      { description: regex },
    ];
  }

  if (area && String(area).trim()) {
    filter['location.area'] = new RegExp(escapeRegex(String(area).trim()), 'i');
  }

  if (city && String(city).trim()) {
    filter['location.city'] = new RegExp(escapeRegex(String(city).trim()), 'i');
  }

  if (propertyType) {
    if (!PROPERTY_TYPES.includes(propertyType)) {
      return next(new AppError(`Invalid propertyType: ${propertyType}`, 400));
    }
    filter.propertyType = propertyType;
  }

  if (minRent !== undefined || maxRent !== undefined) {
    const rentFilter = {};
    if (minRent !== undefined && minRent !== '') {
      rentFilter.$gte = parseNumericParam(minRent, 'minRent');
    }
    if (maxRent !== undefined && maxRent !== '') {
      rentFilter.$lte = parseNumericParam(maxRent, 'maxRent');
    }
    if (
      rentFilter.$gte !== undefined &&
      rentFilter.$lte !== undefined &&
      rentFilter.$gte > rentFilter.$lte
    ) {
      return next(new AppError('minRent cannot be greater than maxRent', 400));
    }
    if (Object.keys(rentFilter).length > 0) {
      filter.rent = rentFilter;
    }
  }

  if (minBedrooms !== undefined || maxBedrooms !== undefined) {
    const bedroomFilter = {};
    if (minBedrooms !== undefined && minBedrooms !== '') {
      bedroomFilter.$gte = parseNumericParam(minBedrooms, 'minBedrooms');
    }
    if (maxBedrooms !== undefined && maxBedrooms !== '') {
      bedroomFilter.$lte = parseNumericParam(maxBedrooms, 'maxBedrooms');
    }
    if (
      bedroomFilter.$gte !== undefined &&
      bedroomFilter.$lte !== undefined &&
      bedroomFilter.$gte > bedroomFilter.$lte
    ) {
      return next(new AppError('minBedrooms cannot be greater than maxBedrooms', 400));
    }
    if (Object.keys(bedroomFilter).length > 0) {
      filter.bedrooms = bedroomFilter;
    }
  }

  if (amenities && String(amenities).trim()) {
    const amenityRegexes = String(amenities)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => new RegExp(`^${escapeRegex(item)}$`, 'i'));

    if (amenityRegexes.length > 0) {
      filter.$and = [
        ...(filter.$and || []),
        ...amenityRegexes.map((rx) => ({ amenities: rx })),
      ];
    }
  }

  const sortCriteria = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('owner', 'name email phone')
      .sort(sortCriteria)
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
 * @route   GET /api/properties/mine
 * @access  Private (owner)
 */
const getMyProperties = asyncHandler(async (req, res, next) => {
  const { approvalStatus } = req.query;
  const filter = { owner: req.user._id };

  if (approvalStatus) {
    if (!APPROVAL_STATUSES.includes(approvalStatus)) {
      return next(new AppError(`Invalid approvalStatus: ${approvalStatus}`, 400));
    }
    filter.approvalStatus = approvalStatus;
  }

  const properties = await Property.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: properties,
  });
});

/**
 * @route   GET /api/properties/:id
 * @access  Public (unapproved visible only to owner or admin)
 */
const getPropertyById = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id).populate(
    'owner',
    'name email phone'
  );

  if (!property) {
    return next(new AppError('Property not found', 404));
  }

  if (property.approvalStatus !== 'approved') {
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner =
      req.user &&
      property.owner &&
      property.owner._id.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return next(new AppError('Property not found', 404));
    }
  }

  res.status(200).json({
    success: true,
    data: property,
  });
});

/**
 * @route   POST /api/properties
 * @access  Private (owner)
 */
const createProperty = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    rent,
    deposit,
    bedrooms,
    bathrooms,
    areaSqFt,
    propertyType,
    location,
    amenities,
    images,
    isAvailable,
  } = req.body;

  const property = await Property.create({
    owner: req.user._id,
    title,
    description,
    rent,
    deposit,
    bedrooms,
    bathrooms,
    areaSqFt,
    propertyType,
    location: pickLocation(location),
    amenities,
    images,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    approvalStatus: 'pending',
  });

  res.status(201).json({
    success: true,
    data: property,
  });
});

/**
 * @route   PATCH /api/properties/:id
 * @access  Private (owner)
 */
const updateProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new AppError('Property not found', 404));
  }

  if (property.owner.toString() !== req.user._id.toString()) {
    return next(new AppError('You are not authorized to update this property', 403));
  }

  let hasCoreDetailUpdate = false;

  for (const field of EDITABLE_FIELDS) {
    if (req.body[field] !== undefined) {
      property[field] = req.body[field];
      if (CORE_REVIEW_FIELDS.includes(field)) {
        hasCoreDetailUpdate = true;
      }
    }
  }

  if (req.body.location !== undefined) {
    const pickedLoc = pickLocation(req.body.location);
    if (pickedLoc) {
      property.location = {
        ...property.location.toObject(),
        ...pickedLoc,
      };
      hasCoreDetailUpdate = true;
    }
  }

  if (property.approvalStatus === 'rejected' && hasCoreDetailUpdate) {
    property.approvalStatus = 'pending';
    property.rejectionReason = '';
    property.reviewedBy = null;
    property.reviewedAt = null;
  }

  await property.save();

  res.status(200).json({
    success: true,
    data: property,
  });
});

/**
 * @route   DELETE /api/properties/:id
 * @access  Private (owner or admin)
 */
const deleteProperty = asyncHandler(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new AppError('Property not found', 404));
  }

  if (
    req.user.role === 'owner' &&
    property.owner.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('You are not authorized to delete this property', 403));
  }

  await property.deleteOne();
  await Promise.all([
    SavedProperty.deleteMany({ property: property._id }),
    Enquiry.deleteMany({ property: property._id }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Property deleted successfully',
  });
});

module.exports = {
  getProperties,
  getMyProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
};
