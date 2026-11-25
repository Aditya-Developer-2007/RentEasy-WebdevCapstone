const mongoose = require('mongoose');

const ENQUIRY_TYPES = ['enquiry', 'visit_request'];
const ENQUIRY_STATUSES = ['pending', 'accepted', 'declined', 'completed'];

const enquirySchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property is required'],
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tenant is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    type: {
      type: String,
      enum: {
        values: ENQUIRY_TYPES,
        message: 'Type must be enquiry or visit_request',
      },
      required: [true, 'Enquiry type is required'],
      default: 'enquiry',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    preferredVisitDate: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          if (this.type === 'visit_request') {
            if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
              return false;
            }
            if (this.isNew) {
              const startOfToday = new Date();
              startOfToday.setHours(0, 0, 0, 0);
              return value >= startOfToday;
            }
          }
          return true;
        },
        message: 'A valid today or future preferredVisitDate is required for visit requests',
      },
    },
    status: {
      type: String,
      enum: {
        values: ENQUIRY_STATUSES,
        message: 'Status must be pending, accepted, declined, or completed',
      },
      default: 'pending',
    },
    ownerResponse: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Owner response cannot exceed 500 characters'],
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

enquirySchema.index({ owner: 1, status: 1, createdAt: -1 });
enquirySchema.index({ tenant: 1, createdAt: -1 });
enquirySchema.index({ property: 1, tenant: 1, status: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
module.exports.ENQUIRY_TYPES = ENQUIRY_TYPES;
module.exports.ENQUIRY_STATUSES = ENQUIRY_STATUSES;
