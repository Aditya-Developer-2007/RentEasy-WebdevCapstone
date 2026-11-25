import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShortlist } from '../context/ShortlistContext';
import { useToast } from '../context/ToastContext';
import { formatINR, formatPropertyType } from '../utils/formatters';
import { AreaIcon, BathIcon, BedIcon, HeartIcon, MapPinIcon } from './Icons';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=75';

export default function PropertyCard({ property }) {
  const { user, isAuthenticated } = useAuth();
  const { isSaved, toggleSave, pendingIds } = useShortlist();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(property.images?.[0] || FALLBACK_IMAGE);

  const saved = isSaved(property._id);
  const isToggling = pendingIds.has(property._id);
  const showHeart = !isAuthenticated || user?.role === 'tenant';

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/properties/${property._id}` } } });
      return;
    }

    try {
      const result = await toggleSave(property._id);
      if (result?.saved) {
        showToast('Saved to shortlist');
      } else if (result?.saved === false) {
        showToast('Removed from shortlist', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Could not update shortlist', 'error');
    }
  };

  return (
    <article className="surface-card property-card">
      <Link to={`/properties/${property._id}`} className="property-card-media">
        <img
          src={imgSrc}
          alt={property.title}
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        <span className="property-card-type">
          {formatPropertyType(property.propertyType)}
        </span>
        {showHeart && (
          <button
            type="button"
            className={`heart-btn ${saved ? 'saved' : ''}`}
            aria-label={saved ? 'Remove from shortlist' : 'Save to shortlist'}
            disabled={isToggling}
            onClick={handleToggleSave}
          >
            <HeartIcon size={17} filled={saved} />
          </button>
        )}
      </Link>

      <Link to={`/properties/${property._id}`} className="property-card-body">
        <div className="property-card-rent tabular-nums">
          {formatINR(property.rent)}
          <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-ink-muted)' }}>
            /mo
          </span>
        </div>

        <h3 className="property-card-title">{property.title}</h3>

        <div className="property-card-loc">
          <MapPinIcon size={14} />
          <span>
            {property.location?.area}, {property.location?.city}
          </span>
        </div>

        <div className="property-card-specs tabular-nums">
          <span className="spec-item">
            <BedIcon size={15} />
            {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} BHK`}
          </span>
          <span className="spec-item">
            <BathIcon size={15} />
            {property.bathrooms} Bath
          </span>
          <span className="spec-item">
            <AreaIcon size={15} />
            {property.areaSqFt} sq.ft
          </span>
        </div>
      </Link>
    </article>
  );
}
