// Format number as currency (USDT)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Format datetime
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Format time ago
export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(dateString);
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
  return `${parseFloat(value).toFixed(decimals)}%`;
};

// Redact email address for privacy
export const redactEmail = (email) => {
  // Handle null/undefined
  if (!email) return '-';
  
  // Check if email has @ symbol
  if (!email.includes('@')) {
    // Invalid format - redact middle characters
    if (email.length <= 4) return email;
    const start = email.substring(0, 2);
    const end = email.substring(email.length - 2);
    return `${start}***${end}`;
  }
  
  const [local, domain] = email.split('@');
  
  // Redact local part (before @)
  let redactedLocal;
  if (local.length <= 1) {
    redactedLocal = local + '**';
  } else if (local.length === 2) {
    redactedLocal = local[0] + '**';
  } else {
    redactedLocal = local.substring(0, 2) + '***';
  }
  
  // Redact domain part (after @)
  const domainParts = domain.split('.');
  const redactedDomainParts = domainParts.map((part) => {
    if (part.length === 0) return part;
    if (part.length === 1) return part;
    // Show first char, replace rest with asterisks (maintaining length)
    return part[0] + '*'.repeat(part.length - 1);
  });
  
  return `${redactedLocal}@${redactedDomainParts.join('.')}`;
};
