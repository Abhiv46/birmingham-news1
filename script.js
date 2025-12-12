// News API Configuration
const API_KEY = '42f83001556744239dd1da740e2dc865';
const BASE_URL = 'https://newsapi.org/v2';

// Smart Caching System
let newsCache = {};
let cacheTimestamp = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache

// Application State
let currentCategory = 'general';
let currentPage = 1;
let articles = [];

// DOM Elements
const newsContainer = document.getElementById('newsContainer');
const categoryTabs = document.getElementById('categoryTabs');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const articleCountEl = document.getElementById('articleCount');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadInitialData();
    updateStats();
});

// Smart News Loader - CACHE FIRST
async function loadNews(category, forceRefresh = false) {
    const now = Date.now();
    const cacheKey = `${category}_${currentPage}`;
    
    // Check cache first (unless forced refresh)
    if (!forceRefresh && newsCache[cacheKey] && cacheTimestamp[cacheKey]) {
        const cacheAge = now - cacheTimestamp[cacheKey];
        if (cacheAge < CACHE_DURATION) {
            console.log(`Using cached data for ${category} (${Math.floor(cacheAge/1000)}s old)`);
            articles = newsCache[cacheKey];
            displayNews(articles);
            updateLastUpdateTime();
            return; // Cache se hi data de diya, API call nahi kiya!
        }
    }
    
    // Show loading
    newsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading ${category} news...</p>
        </div>
    `;
    
    try {
        // API Call - with pageSize=20 for maximum articles
        const url = `${BASE_URL}/top-headlines?country=gb&category=${category}&pageSize=20&page=${currentPage}&apiKey=${API_KEY}`;
        
        console.log('Making API call for:', category);
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles.length > 0) {
            // Store in cache
            articles = data.articles;
            newsCache[cacheKey] = articles;
            cacheTimestamp[cacheKey] = now;
            
            displayNews(articles);
            updateLastUpdateTime();
            updateStats();
            
            // Also cache other categories for 2 minutes (pre-fetch)
            if (!forceRefresh) {
                setTimeout(() => preFetchOtherCategories(category), 2000);
            }
            
        } else {
            throw new Error('No articles found');
        }
        
    } catch (error) {
        console.error('Error:', error);
        // Try to show cached data even if expired
        if (newsCache[cacheKey]) {
            articles = newsCache[cacheKey];
            displayNews(articles);
            showNotification('Showing cached news (offline mode)', 'info');
        } else {
            loadSampleData();
        }
    }
}

// Pre-fetch other categories (when user is idle)
async function preFetchOtherCategories(currentCat) {
    const categories = ['business', 'sports', 'technology', 'entertainment', 'health'];
    
    for (let category of categories) {
        if (category !== currentCat && !newsCache[category]) {
            try {
                const url = `${BASE_URL}/top-headlines?country=gb&category=${category}&pageSize=5&apiKey=${API_KEY}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.status === 'ok') {
                    newsCache[category] = data.articles.slice(0, 5);
                    cacheTimestamp[category] = Date.now();
                    console.log(`Pre-fetched ${category} news`);
                }
            } catch (error) {
                // Silent fail - it's just pre-fetch
            }
        }
    }
}

// Display News
function displayNews(articles) {
    newsContainer.innerHTML = '';
    
    if (articles.length === 0) {
        newsContainer.innerHTML = `
            <div class="no-news">
                <i class="fas fa-newspaper"></i>
                <h3>No news articles found</h3>
                <p>Try refreshing or check back later</p>
            </div>
        `;
        return;
    }
    
    // Show first 10 articles (optimized for mobile)
    const articlesToShow = articles.slice(0, 10);
    
    articlesToShow.forEach((article, index) => {
        const newsCard = createNewsCard(article, index + 1);
        newsContainer.appendChild(newsCard);
    });
    
    // Show "Load More" only if we have more articles
    if (articles.length > 10) {
        document.getElementById('loadMoreBtn').style.display = 'block';
    } else {
        document.getElementById('loadMoreBtn').style.display = 'none';
    }
}

// Create News Card
function createNewsCard(article, index) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    const imageUrl = article.urlToImage || getDefaultImage();
    const title = article.title || 'No title available';
    const description = article.description || 'Click to read more...';
    const source = article.source?.name || 'Unknown Source';
    const publishedAt = formatDate(article.publishedAt);
    
    card.innerHTML = `
        <div class="news-card-header">
            <span class="news-index">#${index}</span>
            <span class="news-time">${publishedAt}</span>
        </div>
        <img src="${imageUrl}" alt="${title}" class="news-image" loading="lazy">
        <div class="news-content">
            <h3 class="news-title">
                <a href="${article.url}" target="_blank">${title}</a>
            </h3>
            <p class="news-description">${description}</p>
            <div class="news-footer">
                <span class="news-source">${source}</span>
                <span class="news-cache-badge" title="Cached for 10 minutes">
                    <i class="fas fa-bolt"></i> Fast Load
                </span>
            </div>
        </div>
    `;
    
    return card;
}

// Event Listeners
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
    
    // Refresh button - WITH COOLDOWN
    refreshBtn.addEventListener('click', function() {
        const now = Date.now();
        const lastRefresh = parseInt(localStorage.getItem('lastRefresh') || '0');
        const cooldown = 2 * 60 * 1000; // 2 minutes cooldown
        
        if (now - lastRefresh < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastRefresh)) / 1000);
            showNotification(`Please wait ${remaining} seconds before refreshing again`, 'warning');
            return;
        }
        
        localStorage.setItem('lastRefresh', now);
        loadNews(currentCategory, true);
        showNotification('News refreshed!', 'success');
    });
    
    // Auto-refresh every 30 minutes (not 15!)
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadNews(currentCategory, true);
        }
    }, 30 * 60 * 1000); // 30 minutes
}

// Load initial data
async function loadInitialData() {
    await loadNews(currentCategory);
    updateWeather();
    
    // Load trending from cache if available
    setTimeout(loadTrendingNews, 1000);
}

// Helper Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / 3600000);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getDefaultImage() {
    const images = [
        'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1',
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c',
        'https://images.unsplash.com/photo-1495020689067-958852a7765e'
    ];
    return images[Math.floor(Math.random() * images.length)] + '?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
}

function updateLastUpdateTime() {
    const now = new Date();
    lastUpdate.textContent = `Updated: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function updateStats() {
    articleCountEl.textContent = articles.length;
}

function showNotification(message, type = 'info') {
    // Your existing notification code
}

// Sample data fallback
function loadSampleData() {
    // Your existing sample data
}

// Load trending news (from cache if possible)
async function loadTrendingNews() {
    // Try cache first
    if (newsCache['trending']) {
        displayTrendingNews(newsCache['trending']);
        return;
    }
    
    // Fetch if not in cache
    try {
        const url = `${BASE_URL}/top-headlines?country=gb&pageSize=5&apiKey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'ok') {
            newsCache['trending'] = data.articles.slice(0, 5);
            displayTrendingNews(newsCache['trending']);
        }
    } catch (error) {
        // Use sample trending
    }
}
