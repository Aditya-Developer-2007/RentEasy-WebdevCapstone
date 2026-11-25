const inrFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

export const formatINR = (amount) => {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '₹0';
  return `₹${inrFormatter.format(num)}`;
};

const PROPERTY_TYPE_LABELS = {
  apartment: 'Apartment',
  independent_house: 'Independent House',
  villa: 'Villa',
  studio: 'Studio',
  pg: 'PG / Co-living',
};

export const formatPropertyType = (type) =>
  PROPERTY_TYPE_LABELS[type] || type || 'Property';

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getTodayISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
