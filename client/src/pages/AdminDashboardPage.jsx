import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { propertyApi } from '../api/propertyApi';
import ConfirmModal from '../components/ConfirmModal';
import { AlertCircleIcon, MapPinIcon } from '../components/Icons';
import { useToast } from '../context/ToastContext';
import { formatDate, formatINR, formatPropertyType } from '../utils/formatters';

const QUEUE_STATUSES = ['pending', 'approved', 'rejected'];
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=75';

export default function AdminDashboardPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('moderation');
  const [queueStatus, setQueueStatus] = useState('pending');
  const [queuePage, setQueuePage] = useState(1);
  const [queueItems, setQueueItems] = useState([]);
  const [queuePagination, setQueuePagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [isQueueLoading, setIsQueueLoading] = useState(true);

  // Analytics state
  const [summary, setSummary] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [areaStats, setAreaStats] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [includeUnapproved, setIncludeUnapproved] = useState(false);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [error, setError] = useState('');

  // Inline rejection & delete states
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadQueue = useCallback(async () => {
    setIsQueueLoading(true);
    setError('');
    try {
      const res = await adminApi.getAdminProperties({
        status: queueStatus,
        page: queuePage,
        limit: 10,
      });
      setQueueItems(Array.isArray(res?.data) ? res.data : []);
      setQueuePagination(
        res?.pagination || { total: 0, page: 1, totalPages: 1 }
      );
    } catch (err) {
      setError(err.message || 'Failed to load moderation queue');
    } finally {
      setIsQueueLoading(false);
    }
  }, [queueStatus, queuePage]);

  const loadAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    try {
      const res = await adminApi.getAreaRentAnalytics({
        city: cityFilter,
        includeUnapproved: includeUnapproved ? 'true' : 'false',
      });
      if (res?.summary) setSummary(res.summary);
      setAreaStats(Array.isArray(res?.areaStats) ? res.areaStats : []);
    } catch (err) {
      setError(err.message || 'Failed to load area rent analytics');
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, [cityFilter, includeUnapproved]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const maxAvgRent = useMemo(() => {
    if (areaStats.length === 0) return 1;
    return Math.max(...areaStats.map((row) => row.avgRent || 0), 1);
  }, [areaStats]);

  const handleApprove = async (propertyId) => {
    setReviewingId(propertyId);
    try {
      await adminApi.reviewProperty(propertyId, { status: 'approved' });
      showToast('Property approved and published');
      await Promise.all([loadQueue(), loadAnalytics()]);
    } catch (err) {
      showToast(err.message || 'Failed to approve property', 'error');
    } finally {
      setReviewingId(null);
    }
  };

  const handleRejectSubmit = async (e, propertyId) => {
    e.preventDefault();
    const trimmed = rejectionReason.trim();
    if (!trimmed) {
      setRejectionError('Please provide a clear rejection reason.');
      return;
    }

    setReviewingId(propertyId);
    setRejectionError('');
    try {
      await adminApi.reviewProperty(propertyId, {
        status: 'rejected',
        rejectionReason: trimmed,
      });
      setRejectingId(null);
      setRejectionReason('');
      showToast('Property rejected', 'info');
      await Promise.all([loadQueue(), loadAnalytics()]);
    } catch (err) {
      showToast(err.message || 'Failed to reject property', 'error');
    } finally {
      setReviewingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await propertyApi.deleteProperty(deleteTarget._id);
      setDeleteTarget(null);
      showToast('Property permanently deleted');
      await Promise.all([loadQueue(), loadAnalytics()]);
    } catch (err) {
      showToast(err.message || 'Failed to delete property', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="container page-section">
      <div className="dashboard-header">
        <div>
          <h1>Admin Moderation &amp; Analytics</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-ink-secondary)' }}>
            Review owner submissions and monitor area-wise rental market trends.
          </p>
        </div>
      </div>

      <section className="kpi-grid" aria-label="Platform listing summary">
        <div className="surface-card kpi-card">
          <span className="kpi-label">Total Listings</span>
          <span className="kpi-value tabular-nums">{summary.total}</span>
        </div>
        <div className="surface-card kpi-card">
          <span className="kpi-label">Pending Review</span>
          <span className="kpi-value tabular-nums">{summary.pending}</span>
        </div>
        <div className="surface-card kpi-card">
          <span className="kpi-label">Approved</span>
          <span className="kpi-value tabular-nums">{summary.approved}</span>
        </div>
        <div className="surface-card kpi-card">
          <span className="kpi-label">Rejected</span>
          <span className="kpi-value tabular-nums">{summary.rejected}</span>
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
          aria-selected={activeTab === 'moderation'}
          className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          Moderation Queue ({summary.pending})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'analytics'}
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Area-Wise Rent Analytics
        </button>
      </div>

      {activeTab === 'moderation' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="pill-rail">
            {QUEUE_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className={`filter-pill ${queueStatus === status ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
                onClick={() => {
                  setQueueStatus(status);
                  setQueuePage(1);
                  setRejectingId(null);
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {isQueueLoading ? (
            <div className="stack-list">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="skeleton" style={{ height: 150 }} />
              ))}
            </div>
          ) : queueItems.length === 0 ? (
            <div className="surface-card center-state">
              <h2>No {queueStatus} listings</h2>
              <p style={{ margin: 0, color: 'var(--color-ink-secondary)' }}>
                The {queueStatus} moderation queue is currently clear.
              </p>
            </div>
          ) : (
            <>
              <div className="stack-list">
                {queueItems.map((prop) => {
                  const isBusy = reviewingId === prop._id;
                  const isRejectOpen = rejectingId === prop._id;

                  return (
                    <article key={prop._id} className="surface-card dashboard-item-card">
                      <div className="dashboard-item-row">
                        <div className="dashboard-item-media-wrap">
                          <img
                            className="item-thumb"
                            src={prop.images?.[0] || FALLBACK_IMAGE}
                            alt={prop.title}
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                          <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              <span
                                className={`badge badge-${prop.approvalStatus}`}
                                style={{ textTransform: 'capitalize' }}
                              >
                                {prop.approvalStatus}
                              </span>
                              <span className="badge badge-neutral">
                                {formatPropertyType(prop.propertyType)}
                              </span>
                              <span className="badge badge-neutral">
                                {formatDate(prop.createdAt)}
                              </span>
                            </div>

                            <h3 style={{ fontSize: 16 }}>{prop.title}</h3>

                            <div
                              className="wrap-anywhere"
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 5,
                                fontSize: 13.5,
                                color: 'var(--color-ink-secondary)',
                              }}
                            >
                              <MapPinIcon size={14} />
                              <span>
                                {prop.location?.address}, {prop.location?.area},{' '}
                                {prop.location?.city} ({prop.location?.pincode})
                              </span>
                            </div>

                            <div
                              className="tabular-nums"
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 12,
                                fontSize: 13.5,
                                fontWeight: 500,
                              }}
                            >
                              <span>Rent: {formatINR(prop.rent)}/mo</span>
                              <span>Deposit: {formatINR(prop.deposit)}</span>
                              <span>
                                {prop.bedrooms === 0 ? 'Studio' : `${prop.bedrooms} BHK`} ·{' '}
                                {prop.bathrooms} Bath · {prop.areaSqFt} sq.ft
                              </span>
                            </div>

                            {prop.amenities?.length > 0 && (
                              <div className="pill-strip">
                                {prop.amenities.map((a) => (
                                  <span key={a} className="badge badge-neutral">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}

                            {prop.owner && (
                              <div
                                className="wrap-anywhere"
                                style={{ fontSize: 12.5, color: 'var(--color-ink-muted)' }}
                              >
                                Owner: {prop.owner.name} ({prop.owner.email}
                                {prop.owner.phone ? ` · ${prop.owner.phone}` : ''})
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="card-action-grid">
                          {prop.approvalStatus !== 'approved' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={isBusy}
                              onClick={() => handleApprove(prop._id)}
                            >
                              Approve
                            </button>
                          )}
                          {prop.approvalStatus !== 'rejected' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              disabled={isBusy}
                              onClick={() => {
                                setRejectingId(isRejectOpen ? null : prop._id);
                                setRejectionReason('');
                                setRejectionError('');
                              }}
                            >
                              Reject
                            </button>
                          )}
                          <Link
                            to={`/properties/${prop._id}`}
                            className="btn btn-secondary btn-sm"
                          >
                            Inspect
                          </Link>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={isBusy}
                            onClick={() => setDeleteTarget(prop)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {prop.approvalStatus === 'rejected' && prop.rejectionReason && (
                        <div className="callout-box callout-rejected">
                          <strong>Rejection Reason:</strong> {prop.rejectionReason}
                        </div>
                      )}

                      {isRejectOpen && (
                        <form
                          onSubmit={(e) => handleRejectSubmit(e, prop._id)}
                          className="callout-box"
                          style={{ display: 'grid', gap: 10 }}
                        >
                          <label className="field-label" htmlFor={`reject-${prop._id}`}>
                            Rejection Reason (visible to owner)
                          </label>
                          <textarea
                            id={`reject-${prop._id}`}
                            rows={2}
                            className={`textarea ${rejectionError ? 'input-error' : ''}`}
                            placeholder="Explain what needs to be fixed before approval…"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                          {rejectionError && (
                            <span className="field-error">{rejectionError}</span>
                          )}
                          <div className="card-action-grid">
                            <button
                              type="submit"
                              className="btn btn-danger btn-sm"
                              disabled={isBusy}
                            >
                              {isBusy ? 'Submitting…' : 'Confirm Reject'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setRejectingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </article>
                  );
                })}
              </div>

              {queuePagination.totalPages > 1 && (
                <nav className="pagination" aria-label="Moderation queue pagination">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={queuePage <= 1}
                    onClick={() => setQueuePage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <span className="tabular-nums" style={{ fontSize: 13.5 }}>
                    Page {queuePagination.page} of {queuePagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={queuePage >= queuePagination.totalPages}
                    onClick={() => setQueuePage((p) => p + 1)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          <div
            className="surface-card"
            style={{
              padding: 16,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div className="field" style={{ flex: '1 1 220px', maxWidth: 320 }}>
              <label className="field-label" htmlFor="analytics-city">
                Filter by City
              </label>
              <input
                id="analytics-city"
                type="text"
                className="input"
                placeholder="e.g., Delhi, Bengaluru"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13.5,
                minHeight: 44,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={includeUnapproved}
                onChange={(e) => setIncludeUnapproved(e.target.checked)}
              />
              <span>Include Unapproved Listings</span>
            </label>
          </div>

          {isAnalyticsLoading ? (
            <div className="skeleton" style={{ height: 240 }} />
          ) : areaStats.length === 0 ? (
            <div className="surface-card center-state">
              <h2>No analytics data available</h2>
              <p style={{ margin: 0, color: 'var(--color-ink-secondary)' }}>
                Try clearing the city filter or including unapproved listings.
              </p>
            </div>
          ) : (
            <>
              <section className="surface-card" style={{ padding: 20, display: 'grid', gap: 16 }}>
                <div>
                  <h2>Area-Wise Average Monthly Rent</h2>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-ink-muted)' }}>
                    Computed live via MongoDB Aggregation Pipeline ($match → $group → $project → $sort)
                  </p>
                </div>

                <div className="bar-chart">
                  {areaStats.map((row) => {
                    const widthPct = Math.max(
                      6,
                      Math.round((row.avgRent / maxAvgRent) * 100)
                    );
                    return (
                      <div key={`${row.area}-${row.city}`} className="bar-row">
                        <div className="bar-row-meta">
                          <div>
                            <div style={{ fontWeight: 600 }}>{row.area}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                              {row.city}
                            </div>
                          </div>
                          <div className="bar-row-meta-mobile-rent tabular-nums">
                            <strong>{formatINR(row.avgRent)}</strong>
                            <span style={{ color: 'var(--color-ink-muted)', fontSize: 12 }}>
                              {' '}
                              ({row.totalListings})
                            </span>
                          </div>
                        </div>

                        <div className="bar-track" aria-hidden="true">
                          <div className="bar-fill" style={{ width: `${widthPct}%` }} />
                        </div>

                        <div className="bar-row-desktop-rent tabular-nums">
                          <strong>{formatINR(row.avgRent)}</strong>
                          <span style={{ color: 'var(--color-ink-muted)', fontSize: 12 }}>
                            {' '}
                            ({row.totalListings})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Desktop Breakdown Table (>= 768px) */}
              <section className="surface-card analytics-table-wrap" style={{ padding: 18 }}>
                <table className="data-table tabular-nums">
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>City</th>
                      <th>Avg Rent</th>
                      <th>Min Rent</th>
                      <th>Max Rent</th>
                      <th>Total Listings</th>
                      <th>Available</th>
                      <th>Avg Bedrooms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areaStats.map((row) => (
                      <tr key={`${row.area}-${row.city}-row`}>
                        <td style={{ fontWeight: 600 }}>{row.area}</td>
                        <td>{row.city}</td>
                        <td style={{ fontWeight: 600 }}>{formatINR(row.avgRent)}</td>
                        <td>{formatINR(row.minRent)}</td>
                        <td>{formatINR(row.maxRent)}</td>
                        <td>{row.totalListings}</td>
                        <td>{row.availableListings}</td>
                        <td>{row.avgBedrooms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Mobile Stacked Metric Cards (< 768px) */}
              <section className="analytics-mobile-cards" aria-label="Area rent breakdown">
                {areaStats.map((row) => (
                  <article
                    key={`${row.area}-${row.city}-card`}
                    className="surface-card"
                    style={{ padding: 16, display: 'grid', gap: 12 }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        borderBottom: '1px solid var(--color-border)',
                        paddingBottom: 8,
                      }}
                    >
                      <strong style={{ fontSize: 16 }}>{row.area}</strong>
                      <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                        {row.city}
                      </span>
                    </div>

                    <div className="analytics-metric-grid tabular-nums">
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-ink-muted)' }}>
                          Avg Rent
                        </div>
                        <div style={{ fontWeight: 700 }}>{formatINR(row.avgRent)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-ink-muted)' }}>
                          Min Rent
                        </div>
                        <div style={{ fontWeight: 600 }}>{formatINR(row.minRent)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-ink-muted)' }}>
                          Max Rent
                        </div>
                        <div style={{ fontWeight: 600 }}>{formatINR(row.maxRent)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-ink-muted)' }}>
                          Listings
                        </div>
                        <div style={{ fontWeight: 600 }}>{row.totalListings}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-ink-muted)' }}>
                          Available
                        </div>
                        <div style={{ fontWeight: 600 }}>{row.availableListings}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-ink-muted)' }}>
                          Avg BHK
                        </div>
                        <div style={{ fontWeight: 600 }}>{row.avgBedrooms}</div>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Property Listing"
        description={`Permanently delete "${deleteTarget?.title}"? This will also cascade-remove related shortlist entries and enquiries.`}
        confirmLabel="Delete Property"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
