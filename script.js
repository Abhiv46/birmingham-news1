// News API Configuration - YOUR API KEY IS HERE!
const API_KEY = '42f83001556744239dd1da740e2dc865';
const BASE_URL = 'https://newsapi.org/v2';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Application State
let currentCategory = 'general';
let currentPage = 1;
let totalResults = 0;
let articles = [];
let updateCount = 0;
let articleCount = 0;
let lastUpdateTime = new Date();

// DOM Elements
const newsContainer = document.getElementById('newsContainer');
const newsTicker = document.getElementById('newsTicker');
const trendingList = document.getElementById('trendingList');
const localNews = document.getElementById('localNews');
const categoryTabs = document.getElementById('categoryTabs');
const refreshBtn = document.getElementById('refreshBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const lastUpdate = document.getElementById('lastUpdate');
const articleCountEl = document.getElementById('articleCount');
const updateCountEl = document.getElementById('updateCount');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const backToTop = document.getElementById('backToTop');
const menuToggle = document.getElementById('menuToggle');
const navbar = document.getElementById('navbar');
const newsletterForm = document.getElementById('newsletterForm');
const emailInput = document.getElementById('emailInput');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
    
    // Check for saved preferences
    loadUserPreferences();
});

function initializeApp() {
    // Set initial time display
    updateTimeDisplay();
    
    // Set up auto-update intervals
    setInterval(updateTimeDisplay, 60000); // Update time every minute
    setInterval(checkForUpdates, 900000);  // Check for updates every 15 minutes
    
    // Initialize counters
    updateCount = parseInt(localStorage.getItem('updateCount')) || 0;
    updateCountEl.textContent = updateCount;
}

function setupEventListeners() {
    // Category tabs
    categoryTabs.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-btn')) {
            // Update active tab
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Load new category
            currentCategory = e.target.dataset.category;
            currentPage = 1;
            loadNews(currentCategory);
            
            // Save preference
            localStorage.setItem('lastCategory', currentCategory);
        }
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', function() {
        loadNews(currentCategory, true);
        this.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            this.style.transform = 'rotate(0deg)';
        }, 500);
    });
    
    // Load more button
    loadMoreBtn.addEventListener('click', function() {
        currentPage++;
        loadNews(currentCategory, false, true);
    });
    
    // Search functionality
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
    
    // Mobile menu toggle
    menuToggle.addEventListener('click', function() {
        navbar.classList.toggle('show');
        document.querySelector('.header-controls').classList.toggle('show');
    });
    
    // Newsletter subscription
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        if (validateEmail(email)) {
            subscribeNewsletter(email);
        } else {
            showNotification('Please enter a valid email address', 'error');
        }
    });
    
    // Back to top button
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Show/hide back to top button on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.navbar') && !e.target.closest('.menu-toggle')) {
            navbar.classList.remove('show');
            document.querySelector('.header-controls').classList.remove('show');
        }
    });
}

// Load user preferences from localStorage
function loadUserPreferences() {
    const savedCategory = localStorage.getItem('lastCategory');
    if (savedCategory) {
        currentCategory = savedCategory;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === savedCategory) {
                btn.classList.add('active');
            }
        });
    }
}

// Load initial data
async function loadInitialData() {
    await loadNews(currentCategory);
    await loadTrendingNews();
    await loadLocalNews();
    updateWeather();
    
    // Show welcome notification
    setTimeout(() => {
        showNotification('Welcome to Bham Pulse! News loaded successfully.', 'success');
    }, 1000);
}

// Main news loading function
async function loadNews(category, forceRefresh = false, loadMore = false) {
    try {
        if (!loadMore) {
            newsContainer.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading ${category} news...</p>
                </div>
            `;
            loadMoreBtn.style.display = 'none';
        }
        
        const url = `${BASE_URL}/top-headlines?country=gb&category=${category}&pageSize=${loadMore ? 6 : 12}&page=${currentPage}&apiKey=${API_KEY}`;
        
        console.log('Fetching news from:', url);
        
        const response = await fetch(CORS_PROXY + encodeURIComponent(url));
        const data = await response.json();
        
        if (data.status === 'ok') {
            if (loadMore) {
                articles = [...articles, ...data.articles];
            } else {
                articles = data.articles;
            }
            
            totalResults = data.totalResults;
            articleCount = articles.length;
            articleCountEl.textContent = articleCount;
            
            displayNews(articles, loadMore);
            
            if (forceRefresh) {
                updateCount++;
                updateCountEl.textContent = updateCount;
                localStorage.setItem('updateCount', updateCount);
                showNotification('News updated successfully!', 'success');
            }
            
            lastUpdateTime = new Date();
            updateLastUpdateTime();
            
            // Update breaking news ticker with latest article
            if (articles.length > 0 && !loadMore) {
                updateNewsTicker(articles[0]);
            }
            
            // Save to localStorage for offline access
            localStorage.setItem(`news_${category}`, JSON.stringify({
                articles: data.articles,
                timestamp: new Date().toISOString()
            }));
            
        } else {
            throw new Error(data.message || 'Failed to load news');
        }
        
    } catch (error) {
        console.error('Error loading news:', error);
        showNotification('Failed to load news. Trying offline data...', 'error');
        
        // Try to load from localStorage
        const cached = localStorage.getItem(`news_${category}`);
        if (cached) {
            const data = JSON.parse(cached);
            articles = data.articles;
            displayNews(articles, loadMore);
            showNotification('Showing cached news (offline mode)', 'info');
        } else {
            // Fallback to sample data
            loadSampleData();
        }
    }
}

// Display news articles
function displayNews(articles, append = false) {
    if (!append) {
        newsContainer.innerHTML = '';
    }
    
    if (articles.length === 0) {
        newsContainer.innerHTML = `
            <div class="no-news" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-newspaper" style="font-size: 48px; color: var(--gray); margin-bottom: 20px;"></i>
                <h3 style="color: var(--dark); margin-bottom: 10px;">No news articles found</h3>
                <p style="color: var(--gray);">Try refreshing or selecting a different category</p>
            </div>
        `;
        return;
    }
    
    articles.forEach((article, index) => {
        const newsCard = createNewsCard(article, index + (currentPage - 1) * 12 + 1);
        newsContainer.appendChild(newsCard);
    });
    
    // Show/hide load more button
    loadMoreBtn.style.display = articles.length < totalResults ? 'block' : 'none';
}

// Create individual news card
function createNewsCard(article, index) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    // Use default image if none provided
    const imageUrl = article.urlToImage || getDefaultImage(article.category || currentCategory);
    const title = article.title || 'No title available';
    const description = article.description || 'Click to read more...';
    const source = article.source?.name || 'Unknown Source';
    const publishedAt = formatDate(article.publishedAt);
    const category = getCategoryFromSource(source);
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" class="news-image" loading="lazy" 
             onerror="this.src='https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'">
        <div class="news-content">
            <span class="news-category">${category}</span>
            <h3 class="news-title">
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">${title}</a>
            </h3>
            <p class="news-description">${description.length > 120 ? description.substring(0, 120) + '...' : description}</p>
            <div class="news-meta">
                <span><i class="far fa-clock"></i> ${publishedAt}</span>
                <span class="source-badge">${source}</span>
            </div>
        </div>
    `;
    
    return card;
}

// Get default image based on category
function getDefaultImage(category) {
    const images = {
        'general': 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'business': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'sports': 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'entertainment': 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        'health': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    };
    
    return images[category] || images['general'];
}

// Load trending news
async function loadTrendingNews() {
    try {
        const url = `${BASE_URL}/top-headlines?country=gb&pageSize=5&apiKey=${API_KEY}`;
        const response = await fetch(CORS_PROXY + encodeURIComponent(url));
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles.length > 0) {
            displayTrendingNews(data.articles.slice(0, 5));
        } else {
            throw new Error('No trending news found');
        }
    } catch (error) {
        console.error('Error loading trending news:', error);
        // Sample trending news
        const sampleTrending = [
            {title: "Birmingham Development Updates", url: "#"},
            {title: "West Midlands Tech Investments", url: "#"},
            {title: "Local Sports Highlights", url: "#"},
            {title: "Weather Forecast Changes", url: "#"},
            {title: "Business Growth in Midlands", url: "#"}
        ];
        displayTrendingNews(sampleTrending);
    }
}

function displayTrendingNews(articles) {
    trendingList.innerHTML = '';
    
    articles.forEach((article, index) => {
        const item = document.createElement('div');
        item.className = 'trending-item';
        item.innerHTML = `
            <a href="${article.url || '#'}" target="_blank">
                <span class="trending-rank">${index + 1}</span>
                ${article.title || 'Trending News'}
            </a>
        `;
        trendingList.appendChild(item);
    });
}

// Load local Birmingham news
async function loadLocalNews() {
    try {
        const query = 'Birmingham OR "West Midlands" OR Midlands';
        const url = `${BASE_URL}/everything?q=${encodeURIComponent(query)}&pageSize=5&sortBy=publishedAt&apiKey=${API_KEY}`;
        const response = await fetch(CORS_PROXY + encodeURIComponent(url));
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles.length > 0) {
            displayLocalNews(data.articles.slice(0, 5));
        } else {
            throw new Error('No local news found');
        }
    } catch (error) {
        console.error('Error loading local news:', error);
        // Sample local news
        const sampleLocal = [
            {title: "City Council Meeting Updates", url: "#"},
            {title: "New Transport Plans for Birmingham", url: "#"},
            {title: "University Expansion News", url: "#"},
            {title: "Community Events This Weekend", url: "#"},
            {title: "Business Park Development Plans", url: "#"}
        ];
        displayLocalNews(sampleLocal);
    }
}

function displayLocalNews(articles) {
    localNews.innerHTML = '';
    
    articles.forEach((article) => {
        const item = document.createElement('div');
        item.className = 'local-item';
        item.innerHTML = `
            <a href="${article.url || '#'}" target="_blank">
                ${article.title || 'Local News Update'}
            </a>
        `;
        localNews.appendChild(item);
    });
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
        
        const url = `${BASE_URL}/everything?q=${encodeURIComponent(query)}&pageSize=12&sortBy=publishedAt&apiKey=${API_KEY}`;
        const response = await fetch(CORS_PROXY + encodeURIComponent(url));
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles.length > 0) {
            articles = data.articles;
            displayNews(articles);
            showNotification(`Found ${data.articles.length} results for "${query}"`, 'success');
            
            // Save search history
            saveSearchHistory(query);
        } else {
            newsContainer.innerHTML = `
                <div class="no-news" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 48px; color: var(--gray); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--dark); margin-bottom: 10px;">No results found for "${query}"</h3>
                    <p style="color: var(--gray);">Try different keywords or browse categories</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error searching news:', error);
        showNotification('Search failed. Please try again.', 'error');
    }
}

// Update breaking news ticker
function updateNewsTicker(article) {
    if (article && article.title) {
        const tickerText = `BREAKING: ${article.title} | `;
        newsTicker.innerHTML = tickerText.repeat(5); // Repeat for continuous effect
    }
}

// Update weather widget (mock data - can integrate real API later)
function updateWeather() {
    const tempMain = document.querySelector('.temp-main');
    const weatherDesc = document.querySelector('.weather-desc');
    const updateTime = document.querySelector('.update-time');
    
    // Mock weather data (in production, use real weather API)
    const temps = [12, 13, 14, 15, 16, 17];
    const conditions = ['Partly Cloudy', 'Sunny Intervals', 'Light Rain', 'Cloudy', 'Clear'];
    
    const randomTemp = temps[Math.floor(Math.random() * temps.length)];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    tempMain.textContent = `${randomTemp}°C`;
    weatherDesc.textContent = randomCondition;
    updateTime.textContent = `Updated: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    // Update every 30 minutes
    setTimeout(updateWeather, 1800000);
}

// Check for updates automatically
function checkForUpdates() {
    loadNews(currentCategory, true);
    updateWeather();
    showNotification('Auto-update: News refreshed', 'info');
}

// Newsletter subscription
function subscribeNewsletter(email) {
    // In production, send to backend
    // For now, save to localStorage
    const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers')) || [];
    subscribers.push({
        email: email,
        subscribedAt: new Date().toISOString()
    });
    
    localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
    localStorage.setItem('subscribedEmail', email);
    
    showNotification(`Thank you! You're subscribed to Birmingham Pulse newsletter.`, 'success');
    newsletterForm.reset();
    
    // In production, send email to your backend
    console.log('New subscriber:', email);
}

// Save search history
function saveSearchHistory(query) {
    const searches = JSON.parse(localStorage.getItem('searchHistory')) || [];
    searches.unshift({
        query: query,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 searches
    if (searches.length > 10) {
        searches.pop();
    }
    
    localStorage.setItem('searchHistory', JSON.stringify(searches));
}

// Helper Functions
function formatDate(dateString) {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
        return `${diffMins} min ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
        });
    }
}

function getCategoryFromSource(source) {
    const sourceMap = {
        'BBC': 'National',
        'BBC News': 'National',
        'Sky News': 'Breaking',
        'The Guardian': 'Politics',
        'Reuters': 'World',
        'Associated Press': 'General',
        'CNN': 'International',
        'Al Jazeera': 'World',
        'Independent': 'Opinion',
        'Daily Mail': 'Popular',
        'Mirror': 'Entertainment',
        'ESPN': 'Sports',
        'TechCrunch': 'Technology',
        'Business Insider': 'Business'
    };
    
    return sourceMap[source] || 'General';
}

function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
    lastUpdate.textContent = `Last update: ${timeString}`;
}

function updateLastUpdateTime() {
    const timeString = lastUpdateTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    lastUpdate.textContent = `Updated: ${timeString}`;
}

function showNotification(message, type = 'info') {
    notificationText.textContent = message;
    notification.className = `notification show ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function hideNotification() {
    notification.classList.remove('show');
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Sample data fallback
function loadSampleData() {
    const sampleArticles = [
        {
            title: "Birmingham City Development Plans Approved",
            description: "Major regeneration project gets green light from city council, expected to create thousands of jobs",
            urlToImage: "https://images.unsplash.com/photo-1589810635657-232948472d98?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            source: { name: "BBC" },
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
    showNotification('Showing sample news (offline mode)', 'info');
}

// Modal functions for footer links
function showPrivacy() {
    alert('Privacy Policy:\n\nWe collect minimal data to improve your experience. We never sell your personal information. You can unsubscribe from newsletters at any time.');
}

function showTerms() {
    alert('Terms of Service:\n\nBy using our website, you agree to our terms. Content is sourced from NewsAPI and other reliable sources. We are not responsible for external website content.');
}

function showContact() {
    alert('Contact Us:\n\nEmail: contact@bhampulse.co.uk\nPhone: +44 121 123 4567\nAddress: Birmingham, West Midlands\n\nWe respond within 24 hours.');
}

function showAbout() {
    alert('About Birmingham Pulse:\n\nYour premier source for Birmingham and West Midlands news. Providing real-time updates, weather, sports, and local events since 2024.');
}

function showAdvertise() {
    alert('Advertise With Us:\n\nReach Birmingham audience effectively. Contact: ads@bhampulse.co.uk\n\nHigh visibility ad placements available. Competitive rates.');
}
