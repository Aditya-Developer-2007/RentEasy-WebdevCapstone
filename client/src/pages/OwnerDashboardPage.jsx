import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { enquiryApi } from '../api/enquiryApi';
import { propertyApi } from '../api/propertyApi';
import ConfirmModal from '../components/ConfirmModal';
import { AlertCircleIcon, CalendarIcon, MapPinIcon } from '../components/Icons';
import PropertyFormModal from '../components/PropertyFormModal';
import { useToast } from '../context/ToastContext';
import { formatDate, formatINR, formatPropertyType } from '../utils/formatters';

const PROPERTY_FILTERS = ['all', 'approved', 'pending', 'rejected'];
const ENQUIRY_FILTERS = ['all', 'pending', 'accepted', 'declined', 'completed'];
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=75';

function getEnquiryBadgeClass(status) {
  if (status === 'accepted' || status === 'completed') return 'badge-approved';
  if (status === 'declined') return 'badge-rejected';
  return 'badge-pending';
}

export default function OwnerDashboardPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [propFilter, setPropFilter] = useState('all');
  const [enqFilter, setEnqFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & action states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingAvailId, setTogglingAvailId] = useState(null);

  // Per-enquiry response drafts & loading
  const [responseDrafts, setResponseDrafts] = useState({});
  const [updatingEnquiryId, setUpdatingEnquiryId] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [propsRes, enqRes] = await Promise.all([
        propertyApi.getMyProperties(),
        enquiryApi.getReceivedEnquiries(),
      ]);
      setProperties(Array.isArray(propsRes?.data) ? propsRes.data : []);
      setEnquiries(Array.isArray(enqRes?.data) ? enqRes.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load owner dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const stats = useMemo(
    () => ({
      total: properties.length,
      approved: properties.filter((p) => p.approvalStatus === 'approved').length,
      pending: properties.filter((p) => p.approvalStatus === 'pending').length,
      rejected: properties.filter((p) => p.approvalStatus === 'rejected').length,
      pendingEnquiries: enquiries.filter((e) => e.status === 'pending').length,
    }),
    [properties, enquiries]
  );

  const filteredProperties = useMemo(() => {
    if (propFilter === 'all') return properties;
    return properties.filter((p) => p.approvalStatus === propFilter);
  }, [properties, propFilter]);

  const filteredEnquiries = useMemo(() => {
    if (enqFilter === 'all') return enquiries;
    return enquiries.filter((e) => e.status === enqFilter);
  }, [enquiries, enqFilter]);

  const handleSavedProperty = (savedDoc, isEdit) => {
    setFormModalOpen(false);
    setEditingProperty(null);
    if (isEdit) {
      setProperties((prev) =>
        prev.map((item) => (item._id === savedDoc._id ? savedDoc : item))
      );
      showToast('Listing updated successfully');
    } else {
      setProperties((prev) => [savedDoc, ...prev]);
      showToast('Listing submitted for admin review');
    }
  };

  const handleToggleAvailability = async (property) => {
    setTogglingAvailId(property._id);
    try {
      const res = await propertyApi.updateProperty(property._id, {
        isAvailable: !property.isAvailable,
      });
      setProperties((prev) =>
        prev.map((item) => (item._id === property._id ? res.data : item))
      );
      showToast(
        res.data.isAvailable ? 'Marked as available' : 'Marked as unavailable',
        'info'
      );
    } catch (err) {
      showToast(err.message || 'Could not update availability', 'error');
    } finally {
      setTogglingAvailId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await propertyApi.deleteProperty(deleteTarget._id);
      setProperties((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setEnquiries((prev) =>
        prev.filter((e) => e.property?._id !== deleteTarget._id)
      );
      setDeleteTarget(null);
      showToast('Property deleted');
    } catch (err) {
      showToast(err.message || 'Failed to delete property', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateEnquiryStatus = async (enquiryId, status) => {
    setUpdatingEnquiryId(enquiryId);
    try {
      const res = await enquiryApi.updateEnquiryStatus(enquiryId, {
        status,
        ownerResponse: responseDrafts[enquiryId] || '',
      });
      setEnquiries((prev) =>
        prev.map((item) => (item._id === enquiryId ? res.data : item))
      );
      showToast(`Request marked as ${status}`);
    } catch (err) {
      showToast(err.message || 'Failed to update enquiry status', 'error');
    } finally {
      setUpdatingEnquiryId(null);
    }
  };

  return (
    <main className="container page-section">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 2.6vw, 28px)' }}>Owner Workspace</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-ink-secondary)' }}>
            Manage your rental listings, availability, and tenant visit requests.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingProperty(null);
            setFormModalOpen(true);
          }}
        >
          + List New Property
        </button>
      </div>

      <section className="kpi-grid" aria-label="Owner metrics">
        <div className="surface-card kpi-card">
          <span className="kpi-label">Total Listings</span>
          <span className="kpi-value tabular-nums">{stats.total}</span>
        </div>
        <div className="surface-card kpi-card">
          <span className="kpi-label">Approved</span>
          <span className="kpi-value tabular-nums">{stats.approved}</span>
        </div>
        <div className="surface-card kpi-card">
          <span className="kpi-label">Pending Review</span>
          <span className="kpi-value tabular-nums">{stats.pending}</span>
        </div>
        <div className="surface-card kpi-card">
          <span className="kpi-label">Rejected</span>
          <span className="kpi-value tabular-nums">{stats.rejected}</span>
        </div>
        <div className="surface-card kpi-card">
          <span className="kpi-label">Pending Enquiries</span>
          <span className="kpi-value tabular-nums">{stats.pendingEnquiries}</span>
        </div>
      </section>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 18 }}>
          <AlertCircleIcon size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="tab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'properties'}
          className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          My Properties ({properties.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'enquiries'}
          className={`tab-btn ${activeTab === 'enquiries' ? 'active' : ''}`}
          onClick={() => setActiveTab('enquiries')}
        >
          Incoming Enquiries &amp; Visits ({enquiries.length})
        </button>
      </div>

      {isLoading ? (
        <div className="stack-list">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="skeleton" style={{ height: 140 }} />
          ))}
        </div>
      ) : activeTab === 'properties' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="pill-strip">
            {PROPERTY_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                className={`filter-pill ${propFilter === status ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
                onClick={() => setPropFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {filteredProperties.length === 0 ? (
            <div className="surface-card center-state">
              <h2 style={{ fontSize: 19 }}>No properties in this category</h2>
              <p style={{ margin: 0, color: 'var(--color-ink-secondary)' }}>
                Create a new property listing to reach verified tenants.
              </p>
            </div>
          ) : (
            <div className="stack-list">
              {filteredProperties.map((prop) => (
                <article key={prop._id} className="surface-card dashboard-item-card">
                  <div className="dashboard-item-row">
                    <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                      <img
                        className="item-thumb"
                        src={prop.images?.[0] || FALLBACK_IMAGE}
                        alt={prop.title}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                      <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <span
                            className={`badge badge-${prop.approvalStatus}`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {prop.approvalStatus}
                          </span>
                          <span className="badge badge-neutral">
                            {formatPropertyType(prop.propertyType)}
                          </span>
                          <span
                            className={`badge ${
                              prop.isAvailable ? 'badge-accent' : 'badge-neutral'
                            }`}
                          >
                            {prop.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: 16 }}>{prop.title}</h3>

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
                          <span className="tabular-nums">
                            Deposit: {formatINR(prop.deposit)}
                          </span>
                          <span className="tabular-nums">
                            {prop.bedrooms === 0 ? 'Studio' : `${prop.bedrooms} BHK`} ·{' '}
                            {prop.bathrooms} Bath · {prop.areaSqFt} sq.ft
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={togglingAvailId === prop._id}
                        onClick={() => handleToggleAvailability(prop)}
                      >
                        {prop.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                      <Link
                        to={`/properties/${prop._id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditingProperty(prop);
                          setFormModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(prop)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {prop.approvalStatus === 'rejected' && (
                    <div
                      className="callout-box callout-rejected"
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <span>
                        <strong>Rejection Reason:</strong>{' '}
                        {prop.rejectionReason || 'No reason provided.'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditingProperty(prop);
                          setFormModalOpen(true);
                        }}
                      >
                        Edit &amp; Resubmit
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="pill-strip">
            {ENQUIRY_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                className={`filter-pill ${enqFilter === status ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
                onClick={() => setEnqFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {filteredEnquiries.length === 0 ? (
            <div className="surface-card center-state">
              <h2 style={{ fontSize: 19 }}>No enquiries in this category</h2>
              <p style={{ margin: 0, color: 'var(--color-ink-secondary)' }}>
                Tenant enquiries and visit requests will appear here.
              </p>
            </div>
          ) : (
            <div className="stack-list">
              {filteredEnquiries.map((enq) => {
                const isBusy = updatingEnquiryId === enq._id;
                return (
                  <article key={enq._id} className="surface-card dashboard-item-card">
                    <div className="dashboard-item-row">
                      <div style={{ display: 'grid', gap: 6, flex: 1 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <span className="badge badge-neutral">
                            {enq.type === 'visit_request'
                              ? 'Visit Request'
                              : 'General Enquiry'}
                          </span>
                          <span
                            className={`badge ${getEnquiryBadgeClass(enq.status)}`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {enq.status}
                          </span>
                          {enq.type === 'visit_request' && enq.preferredVisitDate && (
                            <span className="badge badge-accent">
                              <CalendarIcon size={12} />
                              {formatDate(enq.preferredVisitDate)}
                            </span>
                          )}
                        </div>

                        <div style={{ fontWeight: 600, fontSize: 16 }}>
                          {enq.property?.title || 'Property'}
                        </div>

                        {enq.property?.location && (
                          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                            {enq.property.location.area}, {enq.property.location.city} ·{' '}
                            {formatINR(enq.property.rent)}/mo
                          </div>
                        )}

                        <p style={{ margin: '4px 0 0', fontSize: 14 }}>
                          “{enq.message}”
                        </p>
                      </div>

                      {enq.tenant && (
                        <div style={{ fontSize: 13, color: 'var(--color-ink-secondary)' }}>
                          <div style={{ fontWeight: 600 }}>{enq.tenant.name}</div>
                          <div>{enq.tenant.email}</div>
                          {enq.tenant.phone && <div>{enq.tenant.phone}</div>}
                        </div>
                      )}
                    </div>

                    {enq.ownerResponse && (
                      <div className="callout-box callout-response">
                        <strong>Your Response:</strong> {enq.ownerResponse}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'grid',
                        gap: 10,
                        paddingTop: 10,
                        borderTop: '1px solid var(--color-border)',
                      }}
                    >
                      <textarea
                        rows={2}
                        className="textarea"
                        placeholder="Write a response or visit confirmation note for the tenant…"
                        value={
                          responseDrafts[enq._id] !== undefined
                            ? responseDrafts[enq._id]
                            : enq.ownerResponse || ''
                        }
                        onChange={(e) =>
                          setResponseDrafts((prev) => ({
                            ...prev,
                            [enq._id]: e.target.value,
                          }))
                        }
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={isBusy}
                          onClick={() => handleUpdateEnquiryStatus(enq._id, 'accepted')}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={isBusy}
                          onClick={() => handleUpdateEnquiryStatus(enq._id, 'declined')}
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={isBusy}
                          onClick={() => handleUpdateEnquiryStatus(enq._id, 'completed')}
                        >
                          Mark Completed
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <PropertyFormModal
        isOpen={formModalOpen}
        property={editingProperty}
        onClose={() => {
          setFormModalOpen(false);
          setEditingProperty(null);
        }}
        onSaved={handleSavedProperty}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Property Listing"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"? All associated shortlist entries and enquiries will also be removed.`}
        confirmLabel="Delete Listing"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
