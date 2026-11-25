const mongoose = require('mongoose');

const savedPropertySchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tenant is required'],
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate shortlist entries per tenant + property
savedPropertySchema.index({ tenant: 1, property: 1 }, { unique: true });

// Fast tenant shortlist retrieval
savedPropertySchema.index({ tenant: 1, createdAt: -1 });

module.exports = mongoose.model('SavedProperty', savedPropertySchema);
