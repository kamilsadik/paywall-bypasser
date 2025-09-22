// List of paywalled news websites to redirect
const PAYWALLED_SITES = [
  // Major newspapers
  'nytimes.com',
  'wsj.com',
  'washingtonpost.com',
  'ft.com',
  'economist.com',
  'newyorker.com',
  'theatlantic.com',
  'harpers.org',
  'bloomberg.com',
  'reuters.com',
  'latimes.com',
  'chicagotribune.com',
  'bostonglobe.com',
  'seattletimes.com',
  'sfgate.com',
  'usatoday.com',

  // Tech publications
  'wired.com',
  'techcrunch.com',
  'theverge.com',
  'arstechnica.com',
  'engadget.com',
  'recode.net',
  'venturebeat.com',
  'zdnet.com',
  'cnet.com',

  // Business publications
  'fortune.com',
  'businessinsider.com',
  'forbes.com',
  'marketwatch.com',
  'cnbc.com',
  'fastcompany.com',
  'inc.com',
  'entrepreneur.com',

  // International
  'theguardian.com',
  'bbc.com',
  'telegraph.co.uk',
  'independent.co.uk',
  'lemonde.fr',
  'spiegel.de',
  'elpais.com',
  'corriere.it',
  'nrc.nl',

  // Science and culture
  'scientificamerican.com',
  'nationalgeographic.com',
  'smithsonianmag.com',
  'newscientist.com',
  'nature.com',
  'science.org'
];

// Function to check if current site is paywalled
function isPaywalledSite(hostname) {
  return PAYWALLED_SITES.some(site => {
    return hostname === site || hostname.endsWith('.' + site);
  });
}

// Function to detect if a URL is an article page (not homepage)
function isArticlePage(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const hostname = urlObj.hostname.toLowerCase();

    // Skip homepages and main sections
    if (pathname === '/' || pathname === '' ||
        pathname === '/index.html' || pathname === '/index.php') {
      return false;
    }

    // Skip common non-article pages
    const nonArticlePaths = [
      '/subscribe', '/subscription', '/pricing', '/plans', '/login', '/signup',
      '/register', '/account', '/profile', '/settings', '/preferences',
      '/about', '/contact', '/help', '/support', '/faq', '/terms', '/privacy',
      '/search', '/archive', '/sitemap', '/rss', '/feed',
      '/newsletter', '/newsletters', '/email-signup',
      '/jobs', '/careers', '/work-with-us',
      '/advertise', '/advertising', '/media-kit',
      '/events', '/conferences', '/webinars'
    ];

    if (nonArticlePaths.some(path => pathname.startsWith(path))) {
      return false;
    }

    // Skip section homepages (like /sports, /technology, /business)
    const sectionPages = [
      '/business', '/tech', '/technology', '/science', '/health', '/sports',
      '/politics', '/world', '/opinion', '/style', '/food', '/travel',
      '/culture', '/arts', '/books', '/movies', '/tv', '/music',
      '/fashion', '/lifestyle', '/education', '/environment', '/climate'
    ];

    // Check if it's just a section homepage (no additional path segments)
    if (sectionPages.some(section => pathname === section || pathname === section + '/')) {
      return false;
    }

    // Site-specific article detection patterns
    const articlePatterns = {
      'nytimes.com': [
        /\/\d{4}\/\d{2}\/\d{2}\//, // Date pattern: /2024/01/15/
        /\/article\//,
        /\/interactive\//
      ],
      'wsj.com': [
        /\/articles\//,
        /\/story\//
      ],
      'washingtonpost.com': [
        /\/\d{4}\/\d{2}\/\d{2}\//, // Date pattern
        /\/news\//,
        /\/opinions\//
      ],
      'bloomberg.com': [
        /\/news\/articles\//,
        /\/opinion\//
      ],
      'ft.com': [
        /\/content\//,
        /\/story\//
      ],
      'economist.com': [
        /\/\d{4}\/\d{2}\/\d{2}\//, // Date pattern
        /\/articles?\//,
        /\/briefing\//
      ],
      'theatlantic.com': [
        /\/archive\//,
        /\/article\//
      ],
      'newyorker.com': [
        /\/magazine\//,
        /\/news\//,
        /\/culture\//
      ],
      'wired.com': [
        /\/story\//,
        /\/article\//
      ],
      'techcrunch.com': [
        /\/\d{4}\/\d{2}\/\d{2}\//, // Date pattern
        /\/article\//
      ]
    };

    // Check site-specific patterns
    for (const [site, patterns] of Object.entries(articlePatterns)) {
      if (hostname.includes(site)) {
        if (patterns.some(pattern => pattern.test(pathname))) {
          return true;
        }
      }
    }

    // Generic article detection heuristics
    // Articles typically have longer paths with multiple segments
    const pathSegments = pathname.split('/').filter(segment => segment.length > 0);

    // Likely an article if:
    // 1. Has multiple path segments
    // 2. Contains year (2020-2029)
    // 3. Contains common article keywords
    // 4. Has a slug-like structure (words separated by hyphens)

    if (pathSegments.length >= 2) {
      const pathString = pathname;

      // Check for year patterns (2020-2029)
      if (/20[2-3]\d/.test(pathString)) {
        return true;
      }

      // Check for article-like URL structure (words with hyphens)
      if (/[a-z]+-[a-z]+/.test(pathString)) {
        return true;
      }

      // Check for common article URL patterns
      const articleKeywords = [
        'article', 'story', 'news', 'post', 'blog', 'feature',
        'analysis', 'opinion', 'editorial', 'commentary', 'review',
        'interview', 'profile', 'investigation', 'report'
      ];

      if (articleKeywords.some(keyword => pathString.includes(keyword))) {
        return true;
      }
    }

    // If we reach here and have a substantial path, likely an article
    return pathSegments.length >= 3 || pathname.length > 20;

  } catch (error) {
    console.error('Error detecting article page:', error);
    // Default to true to be safe (better to redirect an occasional homepage than miss articles)
    return true;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PAYWALLED_SITES, isPaywalledSite, isArticlePage };
}