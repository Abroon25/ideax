export const TIER_LIMITS = {
  FREE: { maxChars: 500, maxFileSizeMB: 0, monetizeOptions: ['NONE'], price: 0 },
  BASIC: { maxChars: 15000, maxFileSizeMB: 100, monetizeOptions: ['NONE', 'MONEY', 'PROFIT_SHARE'], price: 499 },
  PREMIUM: { maxChars: 50000, maxFileSizeMB: 1024, monetizeOptions: ['NONE', 'MONEY', 'PROFIT_SHARE', 'SHAREHOLDING', 'PARTNERSHIP'], price: 1999 },
};

export const MONETIZE_LABELS = { NONE: 'Not for Sale', MONEY: 'Fixed Price', PROFIT_SHARE: 'Profit Share', SHAREHOLDING: 'Shareholding', PARTNERSHIP: 'Partnership' };

export const CATEGORY_ICONS = { MOVIES: '🎬', BUSINESS: '💼', STARTUPS: '🚀', APP_DEVELOPMENT: '📱', WEBSITE_DEVELOPMENT: '🌐', TECHNOLOGY: '🤖', HEALTHCARE: '🏥', EDUCATION: '📚', FINANCE: '💰', ENTERTAINMENT: '🎭', FOOD: '🍔', TRAVEL: '✈️', FASHION: '👗', SPORTS: '⚽', OTHER: '💡' };
