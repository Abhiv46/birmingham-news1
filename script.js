// News Configuration - MULTIPLE SOURCES
const NEWS_API_KEY = '42f83001556744239dd1da740e2dc865';
const NEWS_API_URL = 'https://newsapi.org/v2';

// RSS Feeds for FREE backup
const RSS_FEEDS = {
  bbc: 'https://feeds.bbci.co.uk/news/england/rss.xml',
  guardian: 'https://www.theguardian.com/uk/rss',
  birmingham: 'https://www.birminghammail.co.uk/?service=rss'
};

// Smart News Cache - 10 minutes
let newsCache = {};
let cacheTimestamp = {};

// Application State
let currentCategory = 'general';
let currentPage = 1;
let articles = [];
let isUsingRSS = false; // Track if using RSS

// DOM Elements
const newsContainer = document.getElementById('newsContainer');
const newsTicker = document.getElementById('newsTicker');
const categoryTabs = document.getElementById('categoryTabs');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const articleCountEl = document.getElementById('articleCount');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const backToTop = document.getElementById('backToTop');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  console.log('BhamPulse Initializing...');
  setupEventListeners();
  loadInitialData();
});

// Setup all event listeners
function setupEventListeners() {
  // Category tabs
  categoryTabs.addEventListener('click', function(e) {
    if (e.target.classList.contains('tab-btn')) {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      e.target.classList.add('active');
      
      currentCategory = e.target.dataset.category;
      currentPage = 1;
      loadNews(currentCategory);
    }
  });
  
  // Refresh button
  refreshBtn.addEventListener('click', function() {
    loadNews(currentCategory, true);
    showNotification('Refreshing news...', 'info');
  });
  
  // Load more button
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      currentPage++;
      loadNews(currentCategory, false, true);
    });
  }
  
  // Search functionality
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', function() {
      const query = searchInput.value.trim();
      if (query) {
        searchNews(query);
        searchInput.value = '';
      }
    });
    
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          searchNews(query);
          searchInput.value = '';
        }
      }
    });
  }
  
  // Mobile menu
  const menuToggle = document.getElementById('menuToggle');
  const navbar = document.getElementById('navbar');
  
  if (menuToggle && navbar) {
    menuToggle.addEventListener('click', function() {
      navbar.classList.toggle('show');
    });
  }
  
  // Newsletter
  const newsletterForm = document.getElementById('newsletterForm');
  const emailInput = document.getElementById('emailInput');
  
  if (newsletterForm && emailInput) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (validateEmail(email)) {
        subscribeNewsletter(email);
      } else {
        showNotification('Please enter valid email', 'error');
      }
    });
  }
  
  // Back to top
  if (backToTop) {
    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    });
  }
  
  // Auto-refresh every 30 minutes
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadNews(currentCategory, true);
    }
  }, 30 * 60 * 1000);
}

// Load initial data
async function loadInitialData() {
  console.log('Loading initial data...');
  await loadNews(currentCategory);
  updateWeather();
  
  // Show status
  if (isUsingRSS) {
    showNotification('Using FREE RSS feeds for news', 'info');
  } else {
    showNotification('Live news loaded successfully!', 'success');
  }
}

// MAIN NEWS LOADER - SMART SOURCE SELECTION
async function loadNews(category, forceRefresh = false, loadMore = false) {
  console.log(`Loading ${category} news...`);
  
  // Check cache first
  const cacheKey = `${category}_${currentPage}`;
  const now = Date.now();
  
  if (!forceRefresh && newsCache[cacheKey] && cacheTimestamp[cacheKey]) {
    const cacheAge = now - cacheTimestamp[cacheKey];
    if (cacheAge < 10 * 60 * 1000) { // 10 minutes cache
      console.log(`Using cached ${category} news`);
      articles = newsCache[cacheKey];
      displayNews(articles, loadMore);
      updateLastUpdateTime();
      return;
    }
  }
  
  // Show loading
  if (!loadMore) {
    newsContainer.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading ${category} news...</p>
      </div>
    `;
  }
  
  // TRY 1: First try NewsAPI
  try {
    console.log('Trying NewsAPI...');
    const newsApiData = await fetchFromNewsAPI(category);
    
    if (newsApiData && newsApiData.articles && newsApiData.articles.length > 0) {
      console.log('NewsAPI success!');
      isUsingRSS = false;
      articles = loadMore ? [...articles, ...newsApiData.articles] : newsApiData.articles;
      
      // Cache the data
      newsCache[cacheKey] = articles;
      cacheTimestamp[cacheKey] = now;
      
      displayNews(articles, loadMore);
      updateLastUpdateTime();
      updateStats();
      
      // Update ticker
      if (articles.length > 0 && !loadMore) {
        updateNewsTicker(articles[0]);
      }
      
      return; // Success, exit function
    }
  } catch (newsApiError) {
    console.log('NewsAPI failed:', newsApiError.message);
  }
  
  // TRY 2: If NewsAPI fails, try RSS
  try {
    console.log('Trying RSS feeds...');
    const rssData = await fetchFromRSS(category);
    
    if (rssData && rssData.length > 0) {
      console.log('RSS success!');
      isUsingRSS = true;
      articles = loadMore ? [...articles, ...rssData] : rssData;
      
      // Cache the data
      newsCache[cacheKey] = articles;
      cacheTimestamp[cacheKey] = now;
      
      displayNews(articles, loadMore);
      updateLastUpdateTime();
      updateStats();
      
      // Update ticker with RSS news
      if (articles.length > 0 && !loadMore) {
        updateNewsTicker(articles[0]);
      }
      
      showNotification('Using free RSS feeds (NewsAPI limit reached)', 'info');
      return;
    }
  } catch (rssError) {
    console.log('RSS also failed:', rssError.message);
  }
  
  // TRY 3: If both fail, use sample data
  console.log('All sources failed, using sample data');
  loadSampleData();
  showNotification('Showing sample news (offline mode)', 'warning');
}

// Fetch from NewsAPI
async function fetchFromNewsAPI(category) {
  const url = `${NEWS_API_URL}/top-headlines?country=gb&category=${category}&pageSize=20&page=${currentPage}&apiKey=${NEWS_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`NewsAPI error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.status !== 'ok') {
    throw new Error(data.message || 'NewsAPI returned error');
  }
  
  return data;
}

// Fetch from RSS feeds (FREE BACKUP)
async function fetchFromRSS(category) {
  try {
    // Select RSS feed based on category
    let rssUrl;
    switch(category) {
      case 'sports':
        rssUrl = 'https://feeds.bbci.co.uk/sport/rss.xml';
        break;
      case 'business':
        rssUrl = 'https://feeds.bbci.co.uk/news/business/rss.xml';
        break;
      case 'technology':
        rssUrl = 'https://feeds.bbci.co.uk/news/technology/rss.xml';
        break;
      case 'entertainment':
        rssUrl = 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml';
        break;
      default:
        rssUrl = RSS_FEEDS.bbc; // Default to BBC England
    }
    
    // Convert RSS to JSON using free service
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const rssToJsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    
    const response = await fetch(rssToJsonUrl);
    
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No RSS items found');
    }
    
    // Convert RSS format to our article format
    return data.items.map(item => ({
      title: item.title || 'No title',
      description: item.description || item.content || 'Click to read more...',
      url: item.link || '#',
      urlToImage: item.enclosure?.link || item.thumbnail || getDefaultImage(category),
      publishedAt: item.pubDate || new Date().toISOString(),
      source: { name: data.feed?.title || 'RSS Feed' },
      category: category,
      isRSS: true // Flag to identify RSS articles
    }));
    
  } catch (error) {
    console.error('RSS fetch error:', error);
    throw error;
  }
}

// Display news articles
function displayNews(articles, append = false) {
  if (!append) {
    newsContainer.innerHTML = '';
  }
  
  if (!articles || articles.length === 0) {
    newsContainer.innerHTML = `
      <div class="no-news">
        <i class="fas fa-newspaper"></i>
        <h3>No news articles found</h3>
        <p>Try refreshing or check back later</p>
      </div>
    `;
    return;
  }
  
  // Show first 10-15 articles
  const articlesToShow = articles.slice(0, 15);
  
  articlesToShow.forEach((article, index) => {
    const newsCard = createNewsCard(article, index + 1);
    newsContainer.appendChild(newsCard);
  });
  
  // Show "Load More" if we have more articles
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    if (articles.length > 15) {
      loadMoreBtn.style.display = 'block';
    } else {
      loadMoreBtn.style.display = 'none';
    }
  }
  
  // Update article count
  if (articleCountEl) {
    articleCountEl.textContent = articles.length;
  }
}

// Create individual news card
function createNewsCard(article, index) {
  const card = document.createElement('div');
  card.className = 'news-card';
  
  // Check if it's RSS or NewsAPI
  const isRSS = article.isRSS || false;
  const sourceBadge = isRSS ? 'RSS' : 'API';
  
  const imageUrl = article.urlToImage || getDefaultImage(article.category || currentCategory);
  const title = article.title || 'No title available';
  const description = article.description || 'Click to read more...';
  const source = article.source?.name || 'Unknown Source';
  const publishedAt = formatDate(article.publishedAt);
  
  card.innerHTML = `
    <div class="news-card-header">
      <span class="news-index">#${index}</span>
      <span class="news-source-badge ${isRSS ? 'rss-badge' : 'api-badge'}">
        ${sourceBadge}
      </span>
    </div>
    <img src="${imageUrl}" alt="${title}" class="news-image" loading="lazy"
         onerror="this.src='${getDefaultImage(article.category || 'general')}'">
    <div class="news-content">
      <span class="news-category">${article.category || currentCategory}</span>
      <h3 class="news-title">
        <a href="${article.url}" target="_blank" rel="noopener noreferrer">
          ${title}
        </a>
      </h3>
      <p class="news-description">
        ${description.length > 100 ? description.substring(0, 100) + '...' : description}
      </p>
      <div class="news-meta">
        <span><i class="far fa-clock"></i> ${publishedAt}</span>
        <span class="source-badge">${source}</span>
      </div>
    </div>
  `;
  
  return card;
}

// Search news
async function searchNews(query) {
  try {
    newsContainer.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Searching for "${query}"...</p>
      </div>
    `;
    
    // Try NewsAPI search first
    const url = `${NEWS_API_URL}/everything?q=${encodeURIComponent(query)}+Birmingham&pageSize=15&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ok' && data.articles.length > 0) {
      articles = data.articles;
      displayNews(articles);
      showNotification(`Found ${data.articles.length} results`, 'success');
    } else {
      // If NewsAPI fails, try RSS search
      await searchRSS(query);
    }
    
  } catch (error) {
    console.error('Search error:', error);
    // Fallback to showing current articles
    displayNews(articles);
    showNotification('Search failed. Showing all news.', 'error');
  }
}

// Search in RSS
async function searchRSS(query) {
  try {
    // Get RSS feed and filter locally
    const rssData = await fetchFromRSS('general');
    const filtered = rssData.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.description.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filtered.length > 0) {
      articles = filtered;
      displayNews(articles);
      showNotification(`Found ${filtered.length} RSS results for "${query}"`, 'info');
    } else {
      newsContainer.innerHTML = `
        <div class="no-news">
          <i class="fas fa-search"></i>
          <h3>No results found for "${query}"</h3>
          <p>Try different keywords</p>
        </div>
      `;
    }
  } catch (error) {
    throw error;
  }
}

// Update breaking news ticker
function updateNewsTicker(article) {
  if (article && article.title && newsTicker) {
    const tickerText = `BREAKING: ${article.title.substring(0, 80)}... | `;
    newsTicker.innerHTML = tickerText.repeat(3);
  }
}

// Update weather (mock)
function updateWeather() {
  const tempMain = document.querySelector('.temp-main');
  const weatherDesc = document.querySelector('.weather-desc');
  const weatherTime = document.querySelector('.update-time');
  
  if (tempMain && weatherDesc && weatherTime) {
    const temps = [12, 13, 14, 15, 16];
    const conditions = ['Partly Cloudy', 'Sunny', 'Light Rain', 'Cloudy', 'Clear'];
    
    const randomTemp = temps[Math.floor(Math.random() * temps.length)];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    tempMain.textContent = `${randomTemp}°C`;
    weatherDesc.textContent = randomCondition;
    weatherTime.textContent = `Updated: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  }
}

// Helper functions
function formatDate(dateString) {
  if (!dateString) return 'Recently';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  } catch (e) {
    return 'Recently';
  }
}

function getDefaultImage(category = 'general') {
  const images = {
    general: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    business: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    sports: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    entertainment: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    technology: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
  };
  
  return images[category] || images.general;
}

function updateLastUpdateTime() {
  const now = new Date();
  if (lastUpdate) {
    lastUpdate.textContent = `Updated: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`;
  }
}

function updateStats() {
  if (articleCountEl) {
    articleCountEl.textContent = articles.length;
  }
}

function showNotification(message, type = 'info') {
  if (notification && notificationText) {
    notificationText.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  } else {
    console.log(`Notification (${type}): ${message}`);
  }
}

function hideNotification() {
  if (notification) {
    notification.classList.remove('show');
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function subscribeNewsletter(email) {
  // Save to localStorage
  const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
  subscribers.push({
    email: email,
    date: new Date().toISOString()
  });
  localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
  
  showNotification(`Thanks for subscribing, ${email}!`, 'success');
  
  // Reset form
  const emailInput = document.getElementById('emailInput');
  if (emailInput) {
    emailInput.value = '';
  }
}

// Sample data fallback
function loadSampleData() {
  const sampleArticles = [
    {
      title: "Birmingham City Development Plans Approved",
      description: "Major regeneration project gets green light from city council, expected to create thousands of jobs",
      urlToImage: "https://images.unsplash.com/photo-1589810635657-232948472d98?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      source: { name: "BBC News" },
      publishedAt: new Date().toISOString(),
      url: "#",
      category: "general"
    },
    {
      title: "West Midlands Tech Sector Sees Record Growth",
      description: "Technology companies in the region attract significant investment this quarter",
      urlToImage: "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      source: { name: "TechCrunch" },
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      url: "#",
      category: "technology"
    },
    {
      title: "Aston Villa Prepares for Important Match",
      description: "Local football team aims for European qualification in upcoming game",
      urlToImage: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      source: { name: "Sky Sports" },
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      url: "#",
      category: "sports"
    },
    {
      title: "New Cultural Festival Announced for Birmingham",
      description: "Annual arts festival returns with expanded program and international artists",
      urlToImage: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      source: { name: "The Guardian" },
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      url: "#",
      category: "entertainment"
    },
    {
      title: "Business Confidence Rises in West Midlands",
      description: "Survey shows increased optimism among local businesses for economic growth",
      urlToImage: "https://images.unsplash.com/photo-1556761175-4b5db5a1b0c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      source: { name: "Financial Times" },
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      url: "#",
      category: "business"
    },
    {
      title: "Healthcare Improvements Planned for Region",
      description: "New facilities and services announced to improve local healthcare access",
      urlToImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      source: { name: "BBC Health" },
      publishedAt: new Date(Date.now() - 18000000).toISOString(),
      url: "#",
      category: "health"
    }
  ];
  
  articles = sampleArticles;
  displayNews(articles);
}

// CSS for RSS/API badges (add this to your style.css)
const style = document.createElement('style');
style.textContent = `
  .news-source-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: bold;
  }
  .rss-badge {
    background-color: #ff6600;
    color: white;
  }
  .api-badge {
    background-color: #2a9d8f;
    color: white;
  }
  .news-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }
`;
document.head.appendChild(style);

console.log('BhamPulse News Script Loaded Successfully!');
