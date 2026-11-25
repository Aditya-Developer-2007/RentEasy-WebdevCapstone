const mongoose = require('mongoose');

const PROPERTY_TYPES = ['apartment', 'independent_house', 'villa', 'studio', 'pg'];
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];
const HTTP_URL_REGEX = /^https?:\/\/.+/i;

const integerValidator = {
  validator: Number.isInteger,
  message: '{PATH} must be an integer',
};

const locationSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      required: [true, 'Area is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be a 6-digit number'],
    },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Property owner is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    rent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
      min: [1000, 'Rent must be at least 1000'],
      max: [10000000, 'Rent cannot exceed 10000000'],
    },
    deposit: {
      type: Number,
      required: [true, 'Security deposit is required'],
      min: [0, 'Deposit cannot be negative'],
    },
    bedrooms: {
      type: Number,
      required: [true, 'Bedrooms count is required'],
      min: [0, 'Bedrooms cannot be negative'],
      max: [20, 'Bedrooms cannot exceed 20'],
      validate: integerValidator,
    },
    bathrooms: {
      type: Number,
      required: [true, 'Bathrooms count is required'],
      min: [1, 'Bathrooms must be at least 1'],
      max: [20, 'Bathrooms cannot exceed 20'],
      validate: integerValidator,
    },
    areaSqFt: {
      type: Number,
      required: [true, 'Area in sq ft is required'],
      min: [100, 'Area must be at least 100 sq ft'],
      max: [50000, 'Area cannot exceed 50000 sq ft'],
    },
    propertyType: {
      type: String,
      required: [true, 'Property type is required'],
      enum: {
        values: PROPERTY_TYPES,
        message: `Property type must be one of: ${PROPERTY_TYPES.join(', ')}`,
      },
    },
    location: {
      type: locationSchema,
      required: [true, 'Location details are required'],
    },
    amenities: {
      type: [String],
      default: [],
      set: (values) => {
        if (!Array.isArray(values)) return [];
        return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
      },
    },
    images: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (arr) => Array.isArray(arr) && arr.length <= 8,
          message: 'A property can have at most 8 images',
        },
        {
          validator: (arr) =>
            Array.isArray(arr) &&
            arr.every((url) => typeof url === 'string' && HTTP_URL_REGEX.test(url.trim())),
          message: 'Each image must be a valid http:// or https:// URL',
        },
      ],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: {
        values: APPROVAL_STATUSES,
        message: 'Approval status must be pending, approved, or rejected',
      },
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound search/filter index
propertySchema.index({
  approvalStatus: 1,
  isAvailable: 1,
  'location.area': 1,
  rent: 1,
  bedrooms: 1,
});

// Owner dashboard index
propertySchema.index({ owner: 1, createdAt: -1 });

// Admin moderation queue index
propertySchema.index({ approvalStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Property', propertySchema);
module.exports.PROPERTY_TYPES = PROPERTY_TYPES;
module.exports.APPROVAL_STATUSES = APPROVAL_STATUSES;
