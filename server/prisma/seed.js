const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const genres = [
    { name: 'Movies & Film', slug: 'movies', category: 'MOVIES', icon: '🎬', description: 'Movie plots, screenplays, film concepts' },
    { name: 'TV Series', slug: 'tv-series', category: 'ENTERTAINMENT', icon: '📺', description: 'TV show concepts and series ideas' },
    { name: 'Business Ideas', slug: 'business', category: 'BUSINESS', icon: '💼', description: 'Business models and ventures' },
    { name: 'Startups', slug: 'startups', category: 'STARTUPS', icon: '🚀', description: 'Startup concepts and disruptive ideas' },
    { name: 'Mobile Apps', slug: 'mobile-apps', category: 'APP_DEVELOPMENT', icon: '📱', description: 'Mobile application ideas' },
    { name: 'Web Applications', slug: 'web-apps', category: 'WEBSITE_DEVELOPMENT', icon: '🌐', description: 'Website and web app concepts' },
    { name: 'AI & Machine Learning', slug: 'ai-ml', category: 'TECHNOLOGY', icon: '🤖', description: 'AI/ML product and service ideas' },
    { name: 'SaaS Products', slug: 'saas', category: 'TECHNOLOGY', icon: '☁️', description: 'Software as a Service ideas' },
    { name: 'E-Commerce', slug: 'ecommerce', category: 'BUSINESS', icon: '🛒', description: 'Online store and marketplace ideas' },
    { name: 'Healthcare', slug: 'healthcare', category: 'HEALTHCARE', icon: '🏥', description: 'Healthcare innovations and solutions' },
    { name: 'EdTech', slug: 'edtech', category: 'EDUCATION', icon: '📚', description: 'Educational technology ideas' },
    { name: 'FinTech', slug: 'fintech', category: 'FINANCE', icon: '💰', description: 'Financial technology innovations' },
    { name: 'Food & Beverage', slug: 'food', category: 'FOOD', icon: '🍔', description: 'Restaurant, food product, delivery ideas' },
    { name: 'Travel & Tourism', slug: 'travel', category: 'TRAVEL', icon: '✈️', description: 'Travel industry innovations' },
    { name: 'Fashion & Lifestyle', slug: 'fashion', category: 'FASHION', icon: '👗', description: 'Fashion brand and lifestyle ideas' },
    { name: 'Sports & Fitness', slug: 'sports', category: 'SPORTS', icon: '⚽', description: 'Sports tech and fitness ideas' },
    { name: 'Gaming', slug: 'gaming', category: 'ENTERTAINMENT', icon: '🎮', description: 'Video game concepts and gaming platforms' },
    { name: 'Social Impact', slug: 'social-impact', category: 'OTHER', icon: '🌍', description: 'Ideas for social good' },
    { name: 'Hardware & IoT', slug: 'hardware-iot', category: 'TECHNOLOGY', icon: '🔧', description: 'Physical products and IoT solutions' },
    { name: 'Other', slug: 'other', category: 'OTHER', icon: '💡', description: 'Ideas that do not fit other categories' },
  ];

  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: genre,
      create: genre,
    });
  }

  console.log('Seeded ' + genres.length + ' genres');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
