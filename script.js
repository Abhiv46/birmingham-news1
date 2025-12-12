// News API Configuration
const API_KEY = '42f83001556744239dd1da740e2dc865';
const BASE_URL = 'https://newsapi.org/v2';

// Application State
let currentCategory = 'general';
let currentPage = 1;
let articles = [];
let totalResults = 0;

// DOM Elements
const newsContainer = document.getElementById('newsContainer');
const newsTicker = document.getElementById('newsTicker');
const categoryTabs = document.getElementById('categoryTabs');
const refreshBtn = document.getElementById('refreshBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const lastUpdate = document.getElementById('lastUpdate');
const articleCountEl = document.getElementById('articleCount');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const backToTop = document.getElementById('backToTop');
const menuToggle = document.getElementById('menuToggle');
const navbar = document.getElementById('navbar');
const newsletterForm = document.getElementById('newsletterForm');
const emailInput = document.getElementById('emailInput');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

function initializeApp() {
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 60000);
    setInterval(checkForUpdates, 900000); // 15 minutes
}

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
        showNotification('News refreshed!', 'success');
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
    
    // Show/hide back to top button
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
}

// Load initial data
async function loadInitialData() {
    await loadNews(currentCategory);
    updateWeather();
    showNotification('Welcome to Bham Pulse!', 'success');
}

// Load news from API
async function loadNews(category, forceRefresh = false, loadMore = false) {
    try {
        if (!loadMore) {
            newsContainer.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading ${category} news...</p>
                </div>
            `;
        }
        
        const url = `${BASE_URL}/top-headlines?country=gb&category=${category}&pageSize=20&page=${currentPage}&apiKey=${API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'ok') {
            if (loadMore) {
                articles = [...articles, ...data.articles];
            } else {
                articles = data.articles;
            }
            
            totalResults = data.totalResults;
            articleCountEl.textContent = articles.length;
            
            displayNews(articles, loadMore);
            updateLastUpdateTime();
            
            if (articles.length > 0 && !loadMore) {
                updateNewsTicker(articles[0]);
            }
            
        } else {
            throw new Error(data.message || 'Failed to load news');
        }
        
    } catch (error) {
        console.error('Error loading news:', error);
        showNotification('Failed to load news. Showing sample data...', 'error');
        loadSampleData();
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
        const newsCard = createNewsCard(article, index + 1);
        newsContainer.appendChild(newsCard);
    });
    
    loadMoreBtn.style.display = articles.length < totalResults ? 'block' : 'none';
}

// Create news card
function createNewsCard(article, index) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    const imageUrl = article.urlToImage || getDefaultImage();
    const title = article.title || 'No title available';
    const description = article.description || 'Click to read more...';
    const source = article.source?.name || 'Unknown Source';
    const publishedAt = formatDate(article.publishedAt);
    const category = getCategoryFromSource(source);
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" class="news-image" loading="lazy">
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
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles.length > 0) {
            articles = data.articles;
            displayNews(articles);
            showNotification(`Found ${data.articles.length} results for "${query}"`, 'success');
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
        newsTicker.innerHTML = tickerText.repeat(3);
    }
}

// Update weather (mock)
function updateWeather() {
    const tempMain = document.querySelector('.temp-main');
    const weatherDesc = document.querySelector('.weather-desc');
    const weatherTime = document.getElementById('weatherTime');
    
    const temps = [12, 13, 14, 15, 16];
    const conditions = ['Partly Cloudy', 'Sunny Intervals', 'Light Rain', 'Cloudy', 'Clear'];
    
    const randomTemp = temps[Math.floor(Math.random() * temps.length)];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    tempMain.textContent = `${randomTemp}°C`;
    weatherDesc.textContent = randomCondition;
    weatherTime.textContent = `Updated: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    setTimeout(updateWeather, 1800000);
}

// Check for updates
function checkForUpdates() {
    loadNews(currentCategory, true);
    updateWeather();
    showNotification('Auto-update: News refreshed', 'info');
}

// Newsletter subscription
function subscribeNewsletter(email) {
    localStorage.setItem('subscribedEmail', email);
    showNotification(`Thank you! You're subscribed to Birmingham Pulse newsletter.`, 'success');
    newsletterForm.reset();
}

// Helper functions
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

function getDefaultImage() {
    const images = [
        'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1',
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c',
        'https://images.unsplash.com/photo-1495020689067-958852a7765e'
    ];
    return images[Math.floor(Math.random() * images.length)] + '?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
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
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    lastUpdate.textContent = `Updated: ${timeString}`;
}

function showNotification(message, type = 'info') {
    notificationText.textContent = message;
    notification.className = `notification show ${type}`;
    
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
            url: "#"
        },
        {
            title: "West Midlands Tech Sector Sees Record Growth",
            description: "Technology companies in the region attract significant investment this quarter",
            urlToImage: "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            source: { name: "TechCrunch" },
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
            url: "#"
        },
        {
            title: "Aston Villa Prepares for Important Match",
            description: "Local football team aims for European qualification in upcoming game",
            urlToImage: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            source: { name: "Sky Sports" },
            publishedAt: new Date(Date.now() - 7200000).toISOString(),
            url: "#"
        },
        {
            title: "New Cultural Festival Announced for Birmingham",
            description: "Annual arts festival returns with expanded program and international artists",
            urlToImage: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            source: { name: "The Guardian" },
            publishedAt: new Date(Date.now() - 10800000).toISOString(),
            url: "#"
        },
        {
            title: "Business Confidence Rises in West Midlands",
            description: "Survey shows increased optimism among local businesses for economic growth",
            urlToImage: "https://images.unsplash.com/photo-1556761175-4b5db5a1b0c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            source: { name: "Financial Times" },
            publishedAt: new Date(Date.now() - 14400000).toISOString(),
            url: "#"
        },
        {
            title: "Healthcare Improvements Planned for Region",
            description: "New facilities and services announced to improve local healthcare access",
            urlToImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            source: { name: "BBC Health" },
            publishedAt: new Date(Date.now() - 18000000).toISOString(),
            url: "#"
        }
    ];
    
    articles = sampleArticles;
    displayNews(articles);
    showNotification('Showing sample news (offline mode)', 'info');
}

// Modal functions
function showPrivacy() {
    alert('Privacy Policy: We value your privacy and protect your data.');
}

function showTerms() {
    alert('Terms of Service: By using our site, you agree to our terms.');
}

function showContact() {
    alert('Contact us at: contact@bhampulse.co.uk');
}

function showAbout() {
    alert('About Birmingham Pulse: Your local news source since 2024.');
}

function showAdvertise() {
    alert('Advertise with us: Reach Birmingham audience. Email: ads@bhampulse.co.uk');
}
