import { useEffect, useState } from 'react';
import { propertyApi } from '../api/propertyApi';
import { formatPropertyType } from '../utils/formatters';
import { AlertCircleIcon, CloseIcon } from './Icons';

const PROPERTY_TYPES = ['apartment', 'independent_house', 'villa', 'studio', 'pg'];
const COMMON_AMENITIES = [
  'Parking',
  'WiFi',
  'AC',
  'Lift',
  'Power Backup',
  'Gym',
  'Security',
  'Furnished',
];

const INITIAL_FORM = {
  title: '',
  description: '',
  propertyType: 'apartment',
  rent: '',
  deposit: '',
  bedrooms: '2',
  bathrooms: '2',
  areaSqFt: '',
  area: '',
  city: '',
  address: '',
  pincode: '',
  amenities: [],
  images: [],
  isAvailable: true,
};

export default function PropertyFormModal({
  isOpen,
  property = null,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(property);
  const [form, setForm] = useState(INITIAL_FORM);
  const [customAmenity, setCustomAmenity] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageError, setImageError] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (property) {
      setForm({
        title: property.title || '',
        description: property.description || '',
        propertyType: property.propertyType || 'apartment',
        rent: property.rent !== undefined ? String(property.rent) : '',
        deposit: property.deposit !== undefined ? String(property.deposit) : '',
        bedrooms: property.bedrooms !== undefined ? String(property.bedrooms) : '1',
        bathrooms: property.bathrooms !== undefined ? String(property.bathrooms) : '1',
        areaSqFt: property.areaSqFt !== undefined ? String(property.areaSqFt) : '',
        area: property.location?.area || '',
        city: property.location?.city || '',
        address: property.location?.address || '',
        pincode: property.location?.pincode || '',
        amenities: Array.isArray(property.amenities) ? property.amenities : [],
        images: Array.isArray(property.images) ? property.images : [],
        isAvailable: property.isAvailable !== undefined ? property.isAvailable : true,
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setCustomAmenity('');
    setImageUrlInput('');
    setImageError('');
    setErrors({});
    setServerError('');
  }, [isOpen, property]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    if (!form.amenities.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setForm((prev) => ({ ...prev, amenities: [...prev.amenities, trimmed] }));
    }
    setCustomAmenity('');
  };

  const handleAddImage = () => {
    const trimmed = imageUrlInput.trim();
    setImageError('');
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setImageError('Image URL must start with http:// or https://');
      return;
    }
    if (form.images.length >= 8) {
      setImageError('Maximum 8 images allowed per property.');
      return;
    }
    if (form.images.includes(trimmed)) {
      setImageError('This image URL is already added.');
      return;
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, trimmed] }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const validate = () => {
    const next = {};
    const title = form.title.trim();
    const description = form.description.trim();
    const rent = Number(form.rent);
    const deposit = Number(form.deposit);
    const bedrooms = Number(form.bedrooms);
    const bathrooms = Number(form.bathrooms);
    const areaSqFt = Number(form.areaSqFt);

    if (title.length < 5 || title.length > 120) {
      next.title = 'Title must be between 5 and 120 characters.';
    }
    if (description.length < 20 || description.length > 2000) {
      next.description = 'Description must be between 20 and 2000 characters.';
    }
    if (!Number.isFinite(rent) || rent < 1000 || rent > 10000000) {
      next.rent = 'Rent must be at least ₹1,000.';
    }
    if (!Number.isFinite(deposit) || deposit < 0) {
      next.deposit = 'Deposit must be 0 or greater.';
    }
    if (!Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 20) {
      next.bedrooms = 'Bedrooms must be an integer (0–20).';
    }
    if (!Number.isInteger(bathrooms) || bathrooms < 1 || bathrooms > 20) {
      next.bathrooms = 'Bathrooms must be an integer (1–20).';
    }
    if (!Number.isFinite(areaSqFt) || areaSqFt < 100 || areaSqFt > 50000) {
      next.areaSqFt = 'Area must be between 100 and 50,000 sq.ft.';
    }
    if (!form.area.trim()) next.area = 'Area / locality is required.';
    if (!form.city.trim()) next.city = 'City is required.';
    if (!form.address.trim()) next.address = 'Street address is required.';
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      next.pincode = 'Pincode must be a 6-digit number.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      propertyType: form.propertyType,
      rent: Number(form.rent),
      deposit: Number(form.deposit),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      areaSqFt: Number(form.areaSqFt),
      location: {
        area: form.area.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        pincode: form.pincode.trim(),
      },
      amenities: form.amenities,
      images: form.images,
      ...(isEdit ? { isAvailable: form.isAvailable } : {}),
    };

    setIsSubmitting(true);
    try {
      const res = isEdit
        ? await propertyApi.updateProperty(property._id, payload)
        : await propertyApi.createProperty(payload);
      onSaved(res.data, isEdit);
    } catch (err) {
      setServerError(err.message || 'Failed to save property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-form-title"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="surface-card modal-card modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="modal-header">
          <div>
            <h2 id="property-form-title" style={{ fontSize: 19 }}>
              {isEdit ? 'Edit Property Listing' : 'List a New Property'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-ink-muted)' }}>
              {isEdit
                ? 'Update listing details, photos, or availability.'
                : 'New listings go to Admin review before publishing.'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-label="Close modal"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <CloseIcon size={17} />
          </button>
        </div>

        <form
          id="property-form"
          onSubmit={handleSubmit}
          className="modal-scroll-body"
          noValidate
        >
          {isEdit && property?.approvalStatus === 'rejected' && (
            <div className="alert alert-info">
              <AlertCircleIcon size={16} />
              <span>
                Saving changes to a rejected listing resets its status to{' '}
                <strong>pending</strong> for Admin re-review.
              </span>
            </div>
          )}

          {serverError && (
            <div className="alert alert-error">
              <AlertCircleIcon size={16} />
              <span>{serverError}</span>
            </div>
          )}

          <div className="field">
            <label className="field-label" htmlFor="prop-title">
              Listing Title
            </label>
            <input
              id="prop-title"
              type="text"
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g., Sunlit 2BHK Apartment Near Saket Metro"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="field">
            <label className="field-label" htmlFor="prop-desc">
              Description
            </label>
            <textarea
              id="prop-desc"
              rows={3}
              className={`textarea ${errors.description ? 'input-error' : ''}`}
              placeholder="Describe natural light, metro proximity, furnishings, and lease terms…"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
            {errors.description && (
              <span className="field-error">{errors.description}</span>
            )}
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label className="field-label" htmlFor="prop-type">
                Property Type
              </label>
              <select
                id="prop-type"
                className="select"
                value={form.propertyType}
                onChange={(e) => updateField('propertyType', e.target.value)}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatPropertyType(type)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="prop-area-sqft">
                Area (sq.ft)
              </label>
              <input
                id="prop-area-sqft"
                type="number"
                min="100"
                className={`input ${errors.areaSqFt ? 'input-error' : ''}`}
                placeholder="1150"
                value={form.areaSqFt}
                onChange={(e) => updateField('areaSqFt', e.target.value)}
              />
              {errors.areaSqFt && <span className="field-error">{errors.areaSqFt}</span>}
            </div>
          </div>

          <div className="form-pair-xs">
            <div className="field">
              <label className="field-label" htmlFor="prop-rent">
                Monthly Rent (₹)
              </label>
              <input
                id="prop-rent"
                type="number"
                min="1000"
                className={`input ${errors.rent ? 'input-error' : ''}`}
                placeholder="32000"
                value={form.rent}
                onChange={(e) => updateField('rent', e.target.value)}
              />
              {errors.rent && <span className="field-error">{errors.rent}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="prop-deposit">
                Deposit (₹)
              </label>
              <input
                id="prop-deposit"
                type="number"
                min="0"
                className={`input ${errors.deposit ? 'input-error' : ''}`}
                placeholder="64000"
                value={form.deposit}
                onChange={(e) => updateField('deposit', e.target.value)}
              />
              {errors.deposit && <span className="field-error">{errors.deposit}</span>}
            </div>
          </div>

          <div className="form-pair-xs">
            <div className="field">
              <label className="field-label" htmlFor="prop-bedrooms">
                Bedrooms (0=Studio)
              </label>
              <input
                id="prop-bedrooms"
                type="number"
                min="0"
                max="20"
                className={`input ${errors.bedrooms ? 'input-error' : ''}`}
                value={form.bedrooms}
                onChange={(e) => updateField('bedrooms', e.target.value)}
              />
              {errors.bedrooms && <span className="field-error">{errors.bedrooms}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="prop-bathrooms">
                Bathrooms
              </label>
              <input
                id="prop-bathrooms"
                type="number"
                min="1"
                max="20"
                className={`input ${errors.bathrooms ? 'input-error' : ''}`}
                value={form.bathrooms}
                onChange={(e) => updateField('bathrooms', e.target.value)}
              />
              {errors.bathrooms && (
                <span className="field-error">{errors.bathrooms}</span>
              )}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label className="field-label" htmlFor="prop-loc-area">
                Area / Locality
              </label>
              <input
                id="prop-loc-area"
                type="text"
                className={`input ${errors.area ? 'input-error' : ''}`}
                placeholder="Saket"
                value={form.area}
                onChange={(e) => updateField('area', e.target.value)}
              />
              {errors.area && <span className="field-error">{errors.area}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="prop-loc-city">
                City
              </label>
              <input
                id="prop-loc-city"
                type="text"
                className={`input ${errors.city ? 'input-error' : ''}`}
                placeholder="Delhi"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
              />
              {errors.city && <span className="field-error">{errors.city}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="prop-loc-address">
                Street Address
              </label>
              <input
                id="prop-loc-address"
                type="text"
                className={`input ${errors.address ? 'input-error' : ''}`}
                placeholder="D-42, Freedom Fighters Enclave"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="prop-loc-pincode">
                Pincode (6 digits)
              </label>
              <input
                id="prop-loc-pincode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={`input ${errors.pincode ? 'input-error' : ''}`}
                placeholder="110068"
                value={form.pincode}
                onChange={(e) => updateField('pincode', e.target.value)}
              />
              {errors.pincode && <span className="field-error">{errors.pincode}</span>}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Amenities</span>
            <div className="pill-strip">
              {COMMON_AMENITIES.map((item) => {
                const active = form.amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    className={`filter-pill ${active ? 'active' : ''}`}
                    onClick={() => toggleAmenity(item)}
                  >
                    {item}
                  </button>
                );
              })}
              {form.amenities
                .filter((a) => !COMMON_AMENITIES.includes(a))
                .map((custom) => (
                  <button
                    key={custom}
                    type="button"
                    className="filter-pill active"
                    onClick={() => toggleAmenity(custom)}
                  >
                    {custom} ×
                  </button>
                ))}
            </div>
            <div className="image-url-row" style={{ marginTop: 6 }}>
              <input
                type="text"
                className="input"
                placeholder="Add custom amenity (e.g., Pet Friendly)"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAmenity();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddCustomAmenity}
              >
                Add
              </button>
            </div>
          </div>

          <div className="field">
            <span className="field-label">Property Images (up to 8 URLs)</span>
            <div className="image-url-row">
              <input
                type="url"
                className="input"
                placeholder="https://images.unsplash.com/..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddImage}
              >
                Add URL
              </button>
            </div>
            {imageError && <span className="field-error">{imageError}</span>}

            {form.images.length > 0 && (
              <div className="image-manager-grid">
                {form.images.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="image-thumb-item">
                    <img src={url} alt={`Listing preview ${idx + 1}`} />
                    <button
                      type="button"
                      className="image-thumb-remove"
                      aria-label={`Remove image ${idx + 1}`}
                      onClick={() => handleRemoveImage(idx)}
                    >
                      <CloseIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isEdit && (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                minHeight: 44,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => updateField('isAvailable', e.target.checked)}
              />
              <span>Listing is currently available for rent</span>
            </label>
          )}
        </form>

        <div className="modal-footer-sticky">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="property-form"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Saving…'
              : isEdit
              ? 'Save Changes'
              : 'Publish Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}
