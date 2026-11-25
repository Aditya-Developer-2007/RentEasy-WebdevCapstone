import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { enquiryApi } from '../api/enquiryApi';
import { propertyApi } from '../api/propertyApi';
import {
  AlertCircleIcon,
  AreaIcon,
  ArrowLeftIcon,
  BathIcon,
  BedIcon,
  CalendarIcon,
  CheckIcon,
  HeartIcon,
  MapPinIcon,
} from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useShortlist } from '../context/ShortlistContext';
import { formatINR, formatPropertyType, getTodayISO } from '../utils/formatters';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { isSaved, toggleSave, pendingIds } = useShortlist();

  const [property, setProperty] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Enquiry / Visit Request form state
  const [requestType, setRequestType] = useState('enquiry');
  const [message, setMessage] = useState('');
  const [preferredVisitDate, setPreferredVisitDate] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setIsLoading(true);
      setFetchError('');
      try {
        const res = await propertyApi.getPropertyById(id);
        if (!cancelled) {
          setProperty(res?.data || null);
          setActiveImageIdx(0);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err.message || 'Property not found');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <main className="container page-section">
        <div className="skeleton" style={{ height: 380, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 28, width: '50%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 18, width: '30%' }} />
      </main>
    );
  }

  if (fetchError || !property) {
    return (
      <main className="container page-section">
        <div className="surface-card center-state">
          <h1 style={{ fontSize: 22 }}>Property unavailable</h1>
          <p style={{ margin: 0, color: 'var(--color-ink-secondary)' }}>
            {fetchError || 'This listing could not be found.'}
          </p>
          <Link to="/" className="btn btn-primary">
            <ArrowLeftIcon size={16} />
            Back to Browse
          </Link>
        </div>
      </main>
    );
  }

  const images =
    property.images && property.images.length > 0 ? property.images : [FALLBACK_IMAGE];
  const saved = isSaved(property._id);
  const isTogglingSave = pendingIds.has(property._id);

  const validateForm = () => {
    const errors = {};
    const trimmedMsg = message.trim();
    if (trimmedMsg.length < 10) {
      errors.message = 'Please enter at least 10 characters.';
    }
    if (requestType === 'visit_request') {
      if (!preferredVisitDate) {
        errors.preferredVisitDate = 'Please select a preferred visit date.';
      } else if (preferredVisitDate < getTodayISO()) {
        errors.preferredVisitDate = 'Visit date cannot be in the past.';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        propertyId: property._id,
        type: requestType,
        message: message.trim(),
        ...(requestType === 'visit_request' ? { preferredVisitDate } : {}),
      };
      const res = await enquiryApi.createEnquiry(payload);
      setSubmittedEnquiry(res.data);
      setMessage('');
      setPreferredVisitDate('');
    } catch (err) {
      setSubmitError(err.message || 'Could not submit your request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container page-section">
      <div style={{ marginBottom: 18 }}>
        <Link
          to="/"
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: 0 }}
        >
          <ArrowLeftIcon size={16} />
          Back to all properties
        </Link>
      </div>

      <div className="detail-layout">
        <div>
          <div className="gallery-main">
            <img
              src={images[activeImageIdx] || FALLBACK_IMAGE}
              alt={`${property.title} photo ${activeImageIdx + 1}`}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>

          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((url, idx) => (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  className={`gallery-thumb ${idx === activeImageIdx ? 'active' : ''}`}
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`View photo ${idx + 1}`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          <div
            className="surface-card"
            style={{ padding: 24, marginTop: 24, display: 'grid', gap: 20 }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-neutral">
                {formatPropertyType(property.propertyType)}
              </span>
              {(user?.role === 'owner' || user?.role === 'admin') && (
                <span className={`badge badge-${property.approvalStatus}`}>
                  {property.approvalStatus}
                </span>
              )}
              {!property.isAvailable && (
                <span className="badge badge-rejected">Currently Unavailable</span>
              )}
            </div>

            <div>
              <h1 style={{ fontSize: 'clamp(22px, 2.5vw, 28px)', marginBottom: 8 }}>
                {property.title}
              </h1>
              <div className="property-card-loc" style={{ fontSize: 14 }}>
                <MapPinIcon size={16} />
                <span>
                  {property.location?.address}, {property.location?.area},{' '}
                  {property.location?.city} — {property.location?.pincode}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 12,
                padding: 16,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>Monthly Rent</div>
                <div className="tabular-nums" style={{ fontWeight: 700, fontSize: 17 }}>
                  {formatINR(property.rent)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>Security Deposit</div>
                <div className="tabular-nums" style={{ fontWeight: 600, fontSize: 16 }}>
                  {formatINR(property.deposit)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>Configuration</div>
                <div className="spec-item tabular-nums" style={{ fontWeight: 600 }}>
                  <BedIcon size={15} />
                  {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} BHK`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>Bathrooms</div>
                <div className="spec-item tabular-nums" style={{ fontWeight: 600 }}>
                  <BathIcon size={15} />
                  {property.bathrooms}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>Area</div>
                <div className="spec-item tabular-nums" style={{ fontWeight: 600 }}>
                  <AreaIcon size={15} />
                  {property.areaSqFt} sq.ft
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 17, marginBottom: 8 }}>About this home</h2>
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-ink-secondary)',
                  whiteSpace: 'pre-line',
                }}
              >
                {property.description}
              </p>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h2 style={{ fontSize: 17, marginBottom: 10 }}>Amenities</h2>
                <div className="pill-strip">
                  {property.amenities.map((item) => (
                    <span key={item} className="badge badge-neutral" style={{ padding: '5px 11px' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {property.owner && (
              <div
                style={{
                  paddingTop: 16,
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>Listed by</div>
                  <div style={{ fontWeight: 600 }}>{property.owner.name}</div>
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--color-ink-secondary)' }}>
                  {property.owner.email}
                  {property.owner.phone ? ` · ${property.owner.phone}` : ''}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="sticky-sidebar">
          <div className="surface-card" style={{ padding: 22, display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="tabular-nums" style={{ fontSize: 22, fontWeight: 700 }}>
                  {formatINR(property.rent)}
                  <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-ink-muted)' }}>
                    /mo
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--color-ink-muted)' }}>
                  Deposit: {formatINR(property.deposit)}
                </div>
              </div>

              {(!isAuthenticated || user?.role === 'tenant') && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={isTogglingSave}
                  onClick={() => {
                    if (!isAuthenticated) return;
                    toggleSave(property._id);
                  }}
                  style={
                    saved
                      ? { borderColor: 'var(--color-danger-text)', color: 'var(--color-danger-text)' }
                      : undefined
                  }
                >
                  <HeartIcon size={15} filled={saved} />
                  {saved ? 'Saved' : 'Save'}
                </button>
              )}
            </div>

            {!isAuthenticated ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-secondary)' }}>
                  Sign in as a tenant to shortlist this home, send an enquiry, or schedule a visit.
                </p>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="btn btn-primary btn-full"
                >
                  Sign In to Enquire
                </Link>
              </div>
            ) : user.role !== 'tenant' ? (
              <div
                style={{
                  padding: 14,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface-subtle)',
                  fontSize: 13.5,
                  color: 'var(--color-ink-secondary)',
                }}
              >
                Signed in as <strong style={{ textTransform: 'capitalize' }}>{user.role}</strong>.
                Listing status: <strong style={{ textTransform: 'capitalize' }}>{property.approvalStatus}</strong>.
              </div>
            ) : submittedEnquiry ? (
              <div className="alert alert-success" style={{ flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                  <CheckIcon size={16} />
                  <span>
                    {submittedEnquiry.type === 'visit_request'
                      ? 'Visit request sent!'
                      : 'Enquiry sent!'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13 }}>
                  The owner has received your request. Track their response in your tenant dashboard.
                </p>
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <Link to="/dashboard/tenant" className="btn btn-primary btn-sm btn-full">
                    View My Enquiries
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSubmittedEnquiry(null)}
                  >
                    New
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} style={{ display: 'grid', gap: 14 }} noValidate>
                <div className="segmented-control" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={requestType === 'enquiry'}
                    className={`segmented-btn ${requestType === 'enquiry' ? 'active' : ''}`}
                    onClick={() => {
                      setRequestType('enquiry');
                      setFormErrors({});
                    }}
                  >
                    General Enquiry
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={requestType === 'visit_request'}
                    className={`segmented-btn ${requestType === 'visit_request' ? 'active' : ''}`}
                    onClick={() => {
                      setRequestType('visit_request');
                      setFormErrors({});
                    }}
                  >
                    Request Visit
                  </button>
                </div>

                {requestType === 'visit_request' && (
                  <div className="field">
                    <label className="field-label" htmlFor="visit-date">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <CalendarIcon size={14} />
                        Preferred Visit Date
                      </span>
                    </label>
                    <input
                      id="visit-date"
                      type="date"
                      min={getTodayISO()}
                      className={`input ${formErrors.preferredVisitDate ? 'input-error' : ''}`}
                      value={preferredVisitDate}
                      onChange={(e) => setPreferredVisitDate(e.target.value)}
                    />
                    {formErrors.preferredVisitDate && (
                      <span className="field-error">{formErrors.preferredVisitDate}</span>
                    )}
                  </div>
                )}

                <div className="field">
                  <label className="field-label" htmlFor="enquiry-message">
                    Message to Owner
                  </label>
                  <textarea
                    id="enquiry-message"
                    rows={4}
                    className={`textarea ${formErrors.message ? 'input-error' : ''}`}
                    placeholder={
                      requestType === 'visit_request'
                        ? 'Share your preferred time slot and move-in timeline…'
                        : 'Ask about lease terms, parking, or availability…'
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  {formErrors.message && (
                    <span className="field-error">{formErrors.message}</span>
                  )}
                </div>

                {submitError && (
                  <div className="alert alert-error">
                    <AlertCircleIcon size={16} />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={isSubmitting || !property.isAvailable}
                >
                  {isSubmitting
                    ? 'Sending…'
                    : requestType === 'visit_request'
                    ? 'Schedule Visit'
                    : 'Send Enquiry'}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
