const TIER_LIMITS = {
  FREE: {
    maxChars: 500,
    maxFileSize: 0,
    maxFileSizeMB: 0,
    allowedFileTypes: [],
    monetizeOptions: ['NONE'],
    price: 0,
  },
  BASIC: {
    maxChars: 15000,
    maxFileSize: 100 * 1024 * 1024,
    maxFileSizeMB: 100,
    allowedFileTypes: ['image/*', '.ppt', '.pptx', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    monetizeOptions: ['NONE', 'MONEY', 'PROFIT_SHARE'],
    price: 499,
  },
  PREMIUM: {
    maxChars: 50000,
    maxFileSize: 1024 * 1024 * 1024,
    maxFileSizeMB: 1024,
    allowedFileTypes: ['*'],
    monetizeOptions: ['NONE', 'MONEY', 'PROFIT_SHARE', 'SHAREHOLDING', 'PARTNERSHIP'],
    price: 1999,
  },
};

const PAY_PER_POST = {
  charsRate: 1,
  charsUnit: 50,
  storageRate: 1,
  storageUnit: 5 * 1024 * 1024,
  storageUnitMB: 5,
  monetizeUnlock: 10,
};

module.exports = { TIER_LIMITS, PAY_PER_POST };
