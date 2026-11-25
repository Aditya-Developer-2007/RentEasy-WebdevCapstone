import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { propertyApi } from '../api/propertyApi';
import {
  AlertCircleIcon,
  CloseIcon,
  FilterIcon,
  SearchIcon,
} from '../components/Icons';
import PropertyCard from '../components/PropertyCard';
import { formatPropertyType } from '../utils/formatters';

const PROPERTY_TYPES = ['apartment', 'independent_house', 'villa', 'studio', 'pg'];
const AMENITY_OPTIONS = [
  'Parking',
  'WiFi',
  'AC',
  'Lift',
  'Power Backup',
  'Gym',
  'Security',
  'Furnished',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'rent_asc', label: 'Rent: Low to High' },
  { value: 'rent_desc', label: 'Rent: High to Low' },
  { value: 'bedrooms_desc', label: 'Bedrooms: Most First' },
  { value: 'area_desc', label: 'Area: Largest First' },
];

function parseFiltersFromParams(searchParams) {
  const amenitiesParam = searchParams.get('amenities') || '';
  return {
    search: searchParams.get('search') || '',
    area: searchParams.get('area') || '',
    city: searchParams.get('city') || '',
    propertyType: searchParams.get('propertyType') || '',
    minRent: searchParams.get('minRent') || '',
    maxRent: searchParams.get('maxRent') || '',
    minBedrooms: searchParams.get('minBedrooms') || '',
    maxBedrooms: searchParams.get('maxBedrooms') || '',
    amenities: amenitiesParam
      ? amenitiesParam.split(',').map((a) => a.trim()).filter(Boolean)
      : [],
    sort: searchParams.get('sort') || 'newest',
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1),
  };
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFiltersFromParams(searchParams), [searchParams]);

  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDraft, setSheetDraft] = useState(filters);

  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (!sheetOpen) return undefined;
    setSheetDraft(filters);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [sheetOpen, filters]);

  const updateUrlFilters = (patch, resetPage = true) => {
    const merged = {
      ...filters,
      ...patch,
      page: resetPage ? 1 : patch.page || filters.page,
    };

    const nextParams = new URLSearchParams();
    Object.entries(merged).forEach(([key, val]) => {
      if (key === 'amenities') {
        if (Array.isArray(val) && val.length > 0) {
          nextParams.set('amenities', val.join(','));
        }
      } else if (key === 'sort') {
        if (val && val !== 'newest') nextParams.set('sort', val);
      } else if (key === 'page') {
        if (Number(val) > 1) nextParams.set('page', String(val));
      } else if (val !== undefined && val !== null && String(val).trim() !== '') {
        nextParams.set(key, String(val).trim());
      }
    });

    setSearchParams(nextParams);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      setIsLoading(true);
      setError('');

      try {
        const res = await propertyApi.getProperties({
          search: filters.search,
          area: filters.area,
          city: filters.city,
          propertyType: filters.propertyType,
          minRent: filters.minRent,
          maxRent: filters.maxRent,
          minBedrooms: filters.minBedrooms,
          maxBedrooms: filters.maxBedrooms,
          amenities: filters.amenities.join(','),
          sort: filters.sort,
          page: filters.page,
          limit: 12,
        });

        if (!cancelled) {
          setProperties(res?.data || []);
          setPagination(
            res?.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 }
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load properties');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProperties();
    return () => {
      cancelled = true;
    };
  }, [filters, reloadTick]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.area) count += 1;
    if (filters.city) count += 1;
    if (filters.propertyType) count += 1;
    if (filters.minRent) count += 1;
    if (filters.maxRent) count += 1;
    if (filters.minBedrooms) count += 1;
    if (filters.maxBedrooms) count += 1;
    count += filters.amenities.length;
    return count;
  }, [filters]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrlFilters({ search: searchDraft });
  };

  const toggleDesktopAmenity = (amenity) => {
    const exists = filters.amenities.includes(amenity);
    const nextAmenities = exists
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];
    updateUrlFilters({ amenities: nextAmenities });
  };

  const toggleSheetAmenity = (amenity) => {
    setSheetDraft((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleResetFilters = () => {
    setSearchDraft('');
    setSearchParams(new URLSearchParams());
    setSheetOpen(false);
  };

  const handleApplySheet = () => {
    updateUrlFilters({
      area: sheetDraft.area,
      city: sheetDraft.city,
      propertyType: sheetDraft.propertyType,
      minRent: sheetDraft.minRent,
      maxRent: sheetDraft.maxRent,
      minBedrooms: sheetDraft.minBedrooms,
      maxBedrooms: sheetDraft.maxBedrooms,
      amenities: sheetDraft.amenities,
      sort: sheetDraft.sort,
    });
    setSheetOpen(false);
  };

  const hasActiveFilters =
    Boolean(filters.search) || activeFilterCount > 0 || filters.sort !== 'newest';

  return (
    <main className="container page-section">
      <section className="browse-header">
        <div>
          <h1>Verified homes for transparent renting</h1>
          <p className="browse-subtitle">
            Browse admin-reviewed apartments, villas, studios, and PG residences across Delhi &amp; Bengaluru.
          </p>
        </div>

        <form className="search-bar-form" onSubmit={handleSearchSubmit}>
          <div className="search-unified-box">
            <SearchIcon size={17} className="search-unified-icon" />
            <input
              type="text"
              className="search-unified-input"
              placeholder="Search locality, city, or title..."
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            <button type="submit" className="search-inline-btn">
              Search
            </button>
          </div>

          <div className="mobile-controls-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSheetOpen(true)}
            >
              <FilterIcon size={16} />
              <span>
                Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
              </span>
            </button>

            <select
              aria-label="Sort properties"
              className="select"
              value={filters.sort}
              onChange={(e) => updateUrlFilters({ sort: e.target.value })}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </form>

        <div className="pill-rail" role="group" aria-label="Property type quick filters">
          <button
            type="button"
            className={`filter-pill ${filters.propertyType === '' ? 'active' : ''}`}
            onClick={() => updateUrlFilters({ propertyType: '' })}
          >
            All Types
          </button>
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`filter-pill ${filters.propertyType === type ? 'active' : ''}`}
              onClick={() =>
                updateUrlFilters({
                  propertyType: filters.propertyType === type ? '' : type,
                })
              }
            >
              {formatPropertyType(type)}
            </button>
          ))}
        </div>
      </section>

      {/* Desktop Filter Panel (>= 900px) */}
      <section
        className="surface-card filter-panel-desktop"
        aria-label="Desktop property filters"
      >
        <div className="filter-grid">
          <div className="field">
            <label className="field-label" htmlFor="desktop-area">
              Area / Locality
            </label>
            <input
              id="desktop-area"
              type="text"
              className="input"
              placeholder="e.g., Dwarka, Saket"
              value={filters.area}
              onChange={(e) => updateUrlFilters({ area: e.target.value })}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="desktop-city">
              City
            </label>
            <input
              id="desktop-city"
              type="text"
              className="input"
              placeholder="e.g., Delhi, Bengaluru"
              value={filters.city}
              onChange={(e) => updateUrlFilters({ city: e.target.value })}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="desktop-min-rent">
              Min Rent (₹)
            </label>
            <input
              id="desktop-min-rent"
              type="number"
              min="0"
              className="input"
              placeholder="10000"
              value={filters.minRent}
              onChange={(e) => updateUrlFilters({ minRent: e.target.value })}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="desktop-max-rent">
              Max Rent (₹)
            </label>
            <input
              id="desktop-max-rent"
              type="number"
              min="0"
              className="input"
              placeholder="80000"
              value={filters.maxRent}
              onChange={(e) => updateUrlFilters({ maxRent: e.target.value })}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="desktop-min-bed">
              Min Bedrooms
            </label>
            <select
              id="desktop-min-bed"
              className="select"
              value={filters.minBedrooms}
              onChange={(e) => updateUrlFilters({ minBedrooms: e.target.value })}
            >
              <option value="">Any</option>
              <option value="1">1+ BHK</option>
              <option value="2">2+ BHK</option>
              <option value="3">3+ BHK</option>
              <option value="4">4+ BHK</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="desktop-max-bed">
              Max Bedrooms
            </label>
            <select
              id="desktop-max-bed"
              className="select"
              value={filters.maxBedrooms}
              onChange={(e) => updateUrlFilters({ maxBedrooms: e.target.value })}
            >
              <option value="">Any</option>
              <option value="1">Up to 1 BHK</option>
              <option value="2">Up to 2 BHK</option>
              <option value="3">Up to 3 BHK</option>
              <option value="4">Up to 4 BHK</option>
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="desktop-type">
              Property Type
            </label>
            <select
              id="desktop-type"
              className="select"
              value={filters.propertyType}
              onChange={(e) => updateUrlFilters({ propertyType: e.target.value })}
            >
              <option value="">All Types</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatPropertyType(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="desktop-sort">
              Sort By
            </label>
            <select
              id="desktop-sort"
              className="select"
              value={filters.sort}
              onChange={(e) => updateUrlFilters({ sort: e.target.value })}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="amenity-chips">
          <span className="field-label" style={{ marginRight: 4 }}>
            Amenities:
          </span>
          {AMENITY_OPTIONS.map((amenity) => {
            const active = filters.amenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                className={`filter-pill ${active ? 'active' : ''}`}
                onClick={() => toggleDesktopAmenity(amenity)}
              >
                {amenity}
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Mobile Filter Bottom Sheet (< 900px) */}
      {sheetOpen && (
        <div
          className="sheet-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Filter properties"
          onClick={() => setSheetOpen(false)}
        >
          <div className="filter-bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h2 style={{ fontSize: 18 }}>Filter Properties</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label="Close filters"
                onClick={() => setSheetOpen(false)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="sheet-body">
              <div className="form-grid-2">
                <div className="field">
                  <label className="field-label" htmlFor="sheet-area">
                    Area / Locality
                  </label>
                  <input
                    id="sheet-area"
                    type="text"
                    className="input"
                    placeholder="e.g., Dwarka, Saket"
                    value={sheetDraft.area}
                    onChange={(e) =>
                      setSheetDraft((p) => ({ ...p, area: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="sheet-city">
                    City
                  </label>
                  <input
                    id="sheet-city"
                    type="text"
                    className="input"
                    placeholder="e.g., Delhi, Bengaluru"
                    value={sheetDraft.city}
                    onChange={(e) =>
                      setSheetDraft((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-pair-xs">
                <div className="field">
                  <label className="field-label" htmlFor="sheet-min-rent">
                    Min Rent (₹)
                  </label>
                  <input
                    id="sheet-min-rent"
                    type="number"
                    min="0"
                    className="input"
                    placeholder="10000"
                    value={sheetDraft.minRent}
                    onChange={(e) =>
                      setSheetDraft((p) => ({ ...p, minRent: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="sheet-max-rent">
                    Max Rent (₹)
                  </label>
                  <input
                    id="sheet-max-rent"
                    type="number"
                    min="0"
                    className="input"
                    placeholder="80000"
                    value={sheetDraft.maxRent}
                    onChange={(e) =>
                      setSheetDraft((p) => ({ ...p, maxRent: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-pair-xs">
                <div className="field">
                  <label className="field-label" htmlFor="sheet-min-bed">
                    Min Bedrooms
                  </label>
                  <select
                    id="sheet-min-bed"
                    className="select"
                    value={sheetDraft.minBedrooms}
                    onChange={(e) =>
                      setSheetDraft((p) => ({ ...p, minBedrooms: e.target.value }))
                    }
                  >
                    <option value="">Any</option>
                    <option value="1">1+ BHK</option>
                    <option value="2">2+ BHK</option>
                    <option value="3">3+ BHK</option>
                    <option value="4">4+ BHK</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="sheet-max-bed">
                    Max Bedrooms
                  </label>
                  <select
                    id="sheet-max-bed"
                    className="select"
                    value={sheetDraft.maxBedrooms}
                    onChange={(e) =>
                      setSheetDraft((p) => ({ ...p, maxBedrooms: e.target.value }))
                    }
                  >
                    <option value="">Any</option>
                    <option value="1">Up to 1 BHK</option>
                    <option value="2">Up to 2 BHK</option>
                    <option value="3">Up to 3 BHK</option>
                    <option value="4">Up to 4 BHK</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="sheet-type">
                  Property Type
                </label>
                <select
                  id="sheet-type"
                  className="select"
                  value={sheetDraft.propertyType}
                  onChange={(e) =>
                    setSheetDraft((p) => ({ ...p, propertyType: e.target.value }))
                  }
                >
                  <option value="">All Types</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {formatPropertyType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <span className="field-label">Amenities</span>
                <div className="pill-strip">
                  {AMENITY_OPTIONS.map((amenity) => {
                    const active = sheetDraft.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        className={`filter-pill ${active ? 'active' : ''}`}
                        onClick={() => toggleSheetAmenity(amenity)}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="sheet-footer">
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={handleResetFilters}
              >
                Reset All
              </button>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={handleApplySheet}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="results-toolbar">
        <p style={{ margin: 0, fontSize: 13, color: 'var(--color-ink-muted)' }}>
          {isLoading
            ? 'Loading verified listings…'
            : error
            ? 'Unable to reach listing server'
            : `${pagination.total} ${pagination.total === 1 ? 'property' : 'properties'} available`}
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="property-grid">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="surface-card" style={{ overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 195, borderRadius: 0 }} />
              <div style={{ padding: 16, display: 'grid', gap: 10 }}>
                <div className="skeleton" style={{ height: 22, width: '45%' }} />
                <div className="skeleton" style={{ height: 18, width: '85%' }} />
                <div className="skeleton" style={{ height: 14, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="surface-card center-state">
          <AlertCircleIcon size={28} />
          <h2>Could not load properties — server may be waking up</h2>
          <p style={{ margin: 0, color: 'var(--color-ink-secondary)', maxWidth: 420 }}>
            {error}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setReloadTick((t) => t + 1)}
          >
            Retry
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="surface-card center-state">
          <h2>No properties match your filters</h2>
          <p style={{ margin: 0, color: 'var(--color-ink-secondary)', maxWidth: 420 }}>
            Try widening your rent range, removing an amenity filter, or resetting all filters.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="property-grid">
            {properties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => updateUrlFilters({ page: pagination.page - 1 }, false)}
              >
                Previous
              </button>
              <span
                className="tabular-nums"
                style={{ fontSize: 13.5, color: 'var(--color-ink-secondary)' }}
              >
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateUrlFilters({ page: pagination.page + 1 }, false)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
