import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { propertyApi } from '../api/propertyApi';
import { AlertCircleIcon, FilterIcon, SearchIcon } from '../components/Icons';
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

const DEFAULT_FILTERS = {
  search: '',
  area: '',
  city: '',
  propertyType: '',
  minRent: '',
  maxRent: '',
  minBedrooms: '',
  maxBedrooms: '',
  amenities: [],
  sort: 'newest',
  page: 1,
};

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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

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
  }, [filters]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateUrlFilters({ search: searchDraft });
  };

  const toggleAmenity = (amenity) => {
    const exists = filters.amenities.includes(amenity);
    const nextAmenities = exists
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];
    updateUrlFilters({ amenities: nextAmenities });
  };

  const handleResetFilters = () => {
    setSearchDraft('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters =
    filters.search ||
    filters.area ||
    filters.city ||
    filters.propertyType ||
    filters.minRent ||
    filters.maxRent ||
    filters.minBedrooms ||
    filters.maxBedrooms ||
    filters.amenities.length > 0 ||
    filters.sort !== 'newest';

  return (
    <main className="container page-section">
      <section className="browse-header">
        <div>
          <h1 className="browse-title">Verified homes for transparent renting</h1>
          <p className="browse-subtitle">
            Browse admin-reviewed apartments, villas, studios, and PG residences across Delhi &amp; Bengaluru.
          </p>
        </div>

        <form className="search-bar-row" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrap">
            <SearchIcon size={17} className="search-input-icon" />
            <input
              type="text"
              className="input search-input"
              placeholder="Search by locality, city, or title (e.g., Saket, Indiranagar)…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-expanded={filtersOpen}
          >
            <FilterIcon size={16} />
            {filtersOpen ? 'Hide Filters' : 'Filters'}
          </button>
        </form>

        <div className="pill-strip" role="group" aria-label="Property type quick filters">
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

      {filtersOpen && (
        <section className="surface-card filter-panel" aria-label="Advanced property filters">
          <div className="filter-grid">
            <div className="field">
              <label className="field-label" htmlFor="filter-area">
                Area / Locality
              </label>
              <input
                id="filter-area"
                type="text"
                className="input"
                placeholder="e.g., Dwarka, Saket"
                value={filters.area}
                onChange={(e) => updateUrlFilters({ area: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="filter-city">
                City
              </label>
              <input
                id="filter-city"
                type="text"
                className="input"
                placeholder="e.g., Delhi, Bengaluru"
                value={filters.city}
                onChange={(e) => updateUrlFilters({ city: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="filter-min-rent">
                Min Rent (₹)
              </label>
              <input
                id="filter-min-rent"
                type="number"
                min="0"
                className="input"
                placeholder="10000"
                value={filters.minRent}
                onChange={(e) => updateUrlFilters({ minRent: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="filter-max-rent">
                Max Rent (₹)
              </label>
              <input
                id="filter-max-rent"
                type="number"
                min="0"
                className="input"
                placeholder="80000"
                value={filters.maxRent}
                onChange={(e) => updateUrlFilters({ maxRent: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="filter-min-bed">
                Min Bedrooms
              </label>
              <select
                id="filter-min-bed"
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
              <label className="field-label" htmlFor="filter-max-bed">
                Max Bedrooms
              </label>
              <select
                id="filter-max-bed"
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
              <label className="field-label" htmlFor="filter-type">
                Property Type
              </label>
              <select
                id="filter-type"
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
              <label className="field-label" htmlFor="filter-sort">
                Sort By
              </label>
              <select
                id="filter-sort"
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
                  onClick={() => toggleAmenity(amenity)}
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
      )}

      <div className="results-toolbar">
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-secondary)' }}>
          {isLoading
            ? 'Loading verified listings…'
            : `${pagination.total} ${pagination.total === 1 ? 'property' : 'properties'} available`}
        </p>

        {!filtersOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
            )}
            <select
              aria-label="Sort properties"
              className="select"
              style={{ width: 'auto', minWidth: 180 }}
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
        )}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertCircleIcon size={17} />
          <span>{error}</span>
        </div>
      )}

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
      ) : properties.length === 0 ? (
        <div className="surface-card center-state">
          <h2 style={{ fontSize: 20 }}>No properties match your filters</h2>
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
                className="btn btn-secondary btn-sm"
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
                className="btn btn-secondary btn-sm"
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
