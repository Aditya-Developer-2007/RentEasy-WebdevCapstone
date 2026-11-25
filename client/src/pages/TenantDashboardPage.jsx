import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { enquiryApi } from '../api/enquiryApi';
import { AlertCircleIcon, CalendarIcon, MapPinIcon } from '../components/Icons';
import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../context/AuthContext';
import { useShortlist } from '../context/ShortlistContext';
import { useToast } from '../context/ToastContext';
import { formatDate, formatINR } from '../utils/formatters';

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'declined', 'completed'];
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=75';

function getEnquiryBadgeClass(status) {
  if (status === 'accepted' || status === 'completed') return 'badge-approved';
  if (status === 'declined') return 'badge-rejected';
  return 'badge-pending';
}

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const { savedItems, isShortlistLoading, toggleSave, refreshSaved } = useShortlist();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('shortlist');
  const [enquiries, setEnquiries] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEnquiriesLoading, setIsEnquiriesLoading] = useState(true);
  const [enquiryError, setEnquiryError] = useState('');

  const loadSentEnquiries = useCallback(async () => {
    setIsEnquiriesLoading(true);
    setEnquiryError('');
    try {
      const res = await enquiryApi.getSentEnquiries();
      setEnquiries(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setEnquiryError(err.message || 'Failed to load enquiries');
    } finally {
      setIsEnquiriesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSaved();
    loadSentEnquiries();
  }, [refreshSaved, loadSentEnquiries]);

  const filteredEnquiries = useMemo(() => {
    if (statusFilter === 'all') return enquiries;
    return enquiries.filter((item) => item.status === statusFilter);
  }, [enquiries, statusFilter]);

  const acceptedVisitsCount = useMemo(
    () =>
      enquiries.filter(
        (item) => item.type === 'visit_request' && item.status === 'accepted'
      ).length,
    [enquiries]
  );

  const handleRemoveSaved = async (propertyId) => {
    try {
      await toggleSave(propertyId);
      showToast('Removed from shortlist', 'info');
    } catch (err) {
      showToast(err.message || 'Could not remove property', 'error');
    }
  };

  return (
    <main className="container page-section">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 2.6vw, 28px)' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-ink-secondary)' }}>
            Manage your shortlisted homes and track owner responses.
          </p>
        </div>
        <Link to="/" className="btn btn-primary">
          Browse Properties
        </Link>
      </div>

      <section className="kpi-grid" aria-label="Tenant summary">
        <div className="surface-card kpi-card">
          <span className="kpi-label">Shortlisted</span>
          <span className="kpi-value tabular-nums">{savedItems.length}</span>
        </div>
        <div className="surface-card kpi-card">
          <span className="kpi-label">Total Enquiries</span>
          <span className="kpi-value tabular-nums">{enquiries.length}</span>
        </div>
        <div className="surface-card kpi-card">
          <span className="kpi-label">Accepted Visits</span>
          <span className="kpi-value tabular-nums">{acceptedVisitsCount}</span>
        </div>
      </section>

      <div className="tab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'shortlist'}
          className={`tab-btn ${activeTab === 'shortlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('shortlist')}
        >
          Shortlisted Properties ({savedItems.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'enquiries'}
          className={`tab-btn ${activeTab === 'enquiries' ? 'active' : ''}`}
          onClick={() => setActiveTab('enquiries')}
        >
          My Enquiries &amp; Visits ({enquiries.length})
        </button>
      </div>

      {activeTab === 'shortlist' ? (
        isShortlistLoading ? (
          <div className="property-grid">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="skeleton" style={{ height: 280 }} />
            ))}
          </div>
        ) : savedItems.length === 0 ? (
          <div className="surface-card center-state">
            <h2 style={{ fontSize: 19 }}>No shortlisted properties yet</h2>
            <p style={{ margin: 0, color: 'var(--color-ink-secondary)', maxWidth: 400 }}>
              Tap the heart icon on any verified listing to save it here for quick comparison.
            </p>
            <Link to="/" className="btn btn-primary">
              Explore Listings
            </Link>
          </div>
        ) : (
          <div className="property-grid">
            {savedItems.map((entry) => (
              <div key={entry._id} style={{ display: 'grid', gap: 8 }}>
                <PropertyCard property={entry.property} />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleRemoveSaved(entry.property._id)}
                >
                  Remove from Shortlist
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="pill-strip" role="group" aria-label="Filter enquiries by status">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                className={`filter-pill ${statusFilter === status ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {enquiryError && (
            <div className="alert alert-error">
              <AlertCircleIcon size={16} />
              <span>{enquiryError}</span>
            </div>
          )}

          {isEnquiriesLoading ? (
            <div className="stack-list">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="skeleton" style={{ height: 130 }} />
              ))}
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="surface-card center-state">
              <h2 style={{ fontSize: 19 }}>No enquiries in this view</h2>
              <p style={{ margin: 0, color: 'var(--color-ink-secondary)' }}>
                Send an enquiry or schedule a visit from any property detail page.
              </p>
              <Link to="/" className="btn btn-primary">
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="stack-list">
              {filteredEnquiries.map((item) => {
                const prop = item.property;
                return (
                  <article key={item._id} className="surface-card dashboard-item-card">
                    <div className="dashboard-item-row">
                      <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                        {prop && (
                          <Link to={`/properties/${prop._id}`}>
                            <img
                              className="item-thumb"
                              src={prop.images?.[0] || FALLBACK_IMAGE}
                              alt={prop.title}
                              onError={(e) => {
                                e.currentTarget.src = FALLBACK_IMAGE;
                              }}
                            />
                          </Link>
                        )}
                        <div style={{ display: 'grid', gap: 6 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <span className="badge badge-neutral">
                              {item.type === 'visit_request'
                                ? 'Visit Request'
                                : 'General Enquiry'}
                            </span>
                            <span
                              className={`badge ${getEnquiryBadgeClass(item.status)}`}
                              style={{ textTransform: 'capitalize' }}
                            >
                              {item.status}
                            </span>
                            {item.type === 'visit_request' && item.preferredVisitDate && (
                              <span className="badge badge-accent">
                                <CalendarIcon size={12} />
                                {formatDate(item.preferredVisitDate)}
                              </span>
                            )}
                          </div>

                          {prop ? (
                            <Link
                              to={`/properties/${prop._id}`}
                              style={{ fontWeight: 600, fontSize: 16 }}
                            >
                              {prop.title}
                            </Link>
                          ) : (
                            <span style={{ fontWeight: 600 }}>Listing no longer available</span>
                          )}

                          {prop && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 12,
                                fontSize: 13.5,
                                color: 'var(--color-ink-secondary)',
                              }}
                            >
                              <span className="spec-item">
                                <MapPinIcon size={14} />
                                {prop.location?.area}, {prop.location?.city}
                              </span>
                              <span className="tabular-nums" style={{ fontWeight: 600 }}>
                                {formatINR(prop.rent)}/mo
                              </span>
                            </div>
                          )}

                          <p
                            style={{
                              margin: '4px 0 0',
                              fontSize: 14,
                              color: 'var(--color-ink-secondary)',
                            }}
                          >
                            “{item.message}”
                          </p>
                        </div>
                      </div>

                      {item.owner && (
                        <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                          <div>Owner: {item.owner.name}</div>
                          <div>{item.owner.email}</div>
                          {item.owner.phone && <div>{item.owner.phone}</div>}
                        </div>
                      )}
                    </div>

                    {item.ownerResponse && (
                      <div className="callout-box callout-response">
                        <strong>Owner Response:</strong> {item.ownerResponse}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
