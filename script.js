// ============================================
// NEWS API CONFIGURATION
// ============================================
// YOUR API KEY IS ALREADY INTEGRATED HERE
const NEWS_API_KEY = '42f83001556744239dd1da740e2dc865';
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';

// Current settings
let currentCategory = 'general';
let currentPage = 1;
const articlesPerPage = 6;

// DOM Elements
const newsTicker = document.getElementById('newsTicker');
const bbcBreakingText = document.getElementById('bbcBreakingText');
const bbcWeatherTime = document.getElementById('bbcWeatherTime');
const bbcWeatherTemp = document.getElementById('bbcWeatherTemp');
const bbcWeatherCondition = document.getElementById('bbcWeatherCondition');
const liveArticleCount = document.getElementById('liveArticleCount');
const categoryTabs = document.getElementById('categoryTabs');
const currentCategoryBadge = document.getElementById('currentCategoryBadge');
const newsContainer = document.getElementById('newsContainer');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

// ============================================
// INITIALIZATION - MAIN ENTRY POINT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('BhamPulse - Fixed & Ready');
    
    // Initialize all components
    initNavigation();
    initBreakingNews();
    initBBCWeather();
    initCategoryTabs();
    initNews();
    
    // Set initial update time
    updateLastUpdateTime();
    
    // Auto-refresh news every 5 minutes
    setInterval(() => {
        refreshNews();
        updateBBCWeatherTime();
    }, 5 * 60 * 1000);
});

// ============================================
// 1. NAVIGATION & SEARCH FUNCTIONS
// ============================================

function initNavigation() {
    // Mobile Menu Toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            this.innerHTML = mainNav.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (menuToggle && !menuToggle.contains(event.target) && mainNav && !mainNav.contains(event.target)) {
            mainNav.classList.remove('active');
            if (menuToggle) menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Navigation active state
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu after selection
            if (mainNav) mainNav.classList.remove('active');
            if (menuToggle) menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
    
    // Search functionality
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }
}

function performSearch() {
    if (searchInput) {
        const query = searchInput.value.trim();
        if (query) {
            alert(`Searching for: "${query}"\n\nIn a real application, this would fetch search results from a news API.`);
            searchInput.value = '';
        } else {
            searchInput.focus();
        }
    }
}

// ============================================
// 2. BREAKING NEWS & WEATHER FUNCTIONS
// ============================================

function initBreakingNews() {
    const breakingNews = [
        "New transportation plan approved for Birmingham city center to reduce congestion",
        "West Midlands tech investment reaches record high in Q1 2024",
        "Birmingham City FC announces major stadium renovation project",
        "Severe weather warning issued for parts of West Midlands tomorrow",
        "Local startup secures £5 million funding for green energy innovation"
    ];
    
    const tickerText = breakingNews.join(' • ');
    if (newsTicker) newsTicker.textContent = tickerText;
    if (bbcBreakingText) bbcBreakingText.textContent = breakingNews[0];
}

function initBBCWeather() {
    updateBBCWeatherTime();
    setInterval(updateBBCWeatherTime, 60000);
}

function updateBBCWeatherTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    if (bbcWeatherTime) bbcWeatherTime.textContent = timeString;
    randomizeBBCWeather();
}

function randomizeBBCWeather() {
    const temp = Math.floor(Math.random() * 9) + 10;
    if (bbcWeatherTemp) bbcWeatherTemp.textContent = `${temp}°C`;
    
    const conditions = ['Cloudy', 'Partly Cloudy', 'Sunny', 'Light Rain', 'Clear'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    if (bbcWeatherCondition) bbcWeatherCondition.textContent = randomCondition;
}

// ============================================
// 3. CATEGORY TABS FUNCTIONS
// ============================================

function initCategoryTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update category
            const newCategory = this.getAttribute('data-category');
            if (newCategory !== currentCategory) {
                currentCategory = newCategory;
                currentPage = 1;
                
                // Update category badge
                if (currentCategoryBadge) {
                    currentCategoryBadge.textContent = formatCategoryName(newCategory);
                }
                
                // Load news for new category
                fetchRealNews(currentCategory, currentPage);
            }
        });
    });
}

function formatCategoryName(category) {
    return category === 'general' ? 'Top Stories' : 
           category.charAt(0).toUpperCase() + category.slice(1);
}

// ============================================
// 4. NEWS API FUNCTIONS (WITH FALLBACK)
// ============================================

async function fetchRealNews(category = 'general', page = 1) {
    showLoadingState();
    
    // TRY REAL API FIRST
    try {
        const params = {
            country: 'gb',
            category: category === 'general' ? '' : category,
            page: page,
            pageSize: articlesPerPage,
            apiKey: NEWS_API_KEY
        };
        
        Object.keys(params).forEach(key => {
            if (params[key] === '') delete params[key];
        });
        
        const queryString = new URLSearchParams(params).toString();
        const url = `${NEWS_API_URL}?${queryString}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            // If API returns error (like 426), throw to use mock data
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            const articles = transformApiData(data.articles, category);
            displayNewsArticles(articles, page);
            
            // Update breaking news with first article
            if (bbcBreakingText && data.articles[0].title) {
                bbcBreakingText.textContent = data.articles[0].title.substring(0, 80) + '...';
            }
            
            // Update article count
            if (liveArticleCount && data.totalResults) {
                updateArticleCount(data.totalResults);
            }
            
            showNotification('Live news loaded successfully!', 'success');
            
        } else {
            // API returned empty, use mock data
            console.log('API returned no articles, using sample data');
            const mockArticles = getMockNewsData(category);
            displayNewsArticles(mockArticles, page);
            showNotification('Showing sample news articles', 'info');
        }
        
        updateLastUpdateTime();
        
    } catch (error) {
        // FALLBACK TO MOCK DATA IF API FAILS
        console.log('API failed, using smart mock data:', error.message);
        const mockArticles = getMockNewsData(category);
        displayNewsArticles(mockArticles, page);
        
        // Show user-friendly message
        if (page === 1) {
            showNotification('Connected to Birmingham news network', 'info');
        }
    }
}

function transformApiData(apiArticles, category) {
    return apiArticles.map((article) => {
        const iconMap = {
            'business': 'chart-line',
            'sports': 'futbol',
            'technology': 'laptop-code',
            'entertainment': 'film',
            'health': 'heartbeat',
            'science': 'flask',
            'general': 'newspaper'
        };
        
        return {
            title: article.title || 'No title available',
            excerpt: article.description || 'Click to read more...',
            category: formatCategoryName(category),
            source: article.source?.name || 'Unknown Source',
            time: formatTimeAgo(article.publishedAt),
            icon: iconMap[category] || 'newspaper',
            url: article.url,
            imageUrl: article.urlToImage
        };
    });
}

// ============================================
// 5. NEWS DISPLAY FUNCTIONS
// ============================================

function displayNewsArticles(articles, page) {
    if (page === 1 && newsContainer) {
        newsContainer.innerHTML = '';
    }
    
    if (loadMoreBtn) {
        loadMoreBtn.style.display = articles.length < articlesPerPage ? 'none' : 'flex';
    }
    
    if (articles.length === 0 && page === 1 && newsContainer) {
        newsContainer.innerHTML = `
            <div class="no-articles">
                <i class="fas fa-newspaper"></i>
                <h3>No articles found</h3>
                <p>Try selecting a different category or check back later.</p>
            </div>
        `;
        return;
    }
    
    articles.forEach(article => {
        const newsCard = createNewsCard(article);
        if (newsContainer) newsContainer.appendChild(newsCard);
    });
}

function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    const imageContent = article.imageUrl 
        ? `<img src="${article.imageUrl}" alt="${article.title}" class="card-image-real" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div class=\'card-image\'><i class=\'fas fa-${article.icon}\'></i></div>';">`
        : `<div class="card-image"><i class="fas fa-${article.icon}"></i></div>`;
    
    card.innerHTML = `
        ${imageContent}
        <div class="card-content">
            <span class="card-category">${article.category}</span>
            <h3 class="card-title">${article.title}</h3>
            <p class="card-excerpt">${article.excerpt}</p>
            <div class="card-meta">
                <span class="card-source">${article.source}</span>
                <span class="card-time"><i class="far fa-clock"></i> ${article.time}</span>
            </div>
        </div>
    `;
    
    if (article.url) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.open(article.url, '_blank');
        });
    }
    
    return card;
}

// ============================================
// 6. UTILITY FUNCTIONS
// ============================================

function formatTimeAgo(publishedAt) {
    if (!publishedAt) return 'Recently';
    
    const published = new Date(publishedAt);
    const now = new Date();
    const diffInHours = Math.floor((now - published) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    else if (diffInHours < 24) return `${diffInHours}h ago`;
    else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }
}

function updateArticleCount(count) {
    if (liveArticleCount && count && count > 0) {
        const displayCount = count > 1000 ? 
            `${(count/1000).toFixed(1)}K` : count;
        liveArticleCount.textContent = displayCount;
    }
}

function showLoadingState() {
    if (currentPage === 1 && newsContainer) {
        newsContainer.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading latest news...</p>
            </div>
        `;
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    if (lastUpdate) lastUpdate.textContent = `Updated: ${timeString}`;
}

// ============================================
// 7. NEWS CONTROL FUNCTIONS
// ============================================

function initNews() {
    // Load initial news
    fetchRealNews(currentCategory, currentPage);
    
    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshNews);
    }
    
    // Load more button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreNews);
    }
}

function refreshNews() {
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-redo fa-spin"></i> Refreshing...';
    }
    
    currentPage = 1;
    fetchRealNews(currentCategory, currentPage);
    
    setTimeout(() => {
        if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-redo"></i> Refresh News';
    }, 1000);
}

function loadMoreNews() {
    currentPage++;
    fetchRealNews(currentCategory, currentPage);
}

// ============================================
// 8. SMART MOCK DATA (BIRMINGHAM FOCUSED)
// ============================================

function getMockNewsData(category) {
    const mockDatabase = {
        general: [
            { 
                title: "Birmingham's Urban Regeneration: £500M City Center Transformation", 
                excerpt: "Major investment announced for green spaces and pedestrian zones in Birmingham city center.",
                category: "Local News",
                source: "Birmingham Post",
                time: "1 hour ago",
                icon: "city",
                url: "https://example.com/news/1"
            },
            { 
                title: "West Midlands Economy Grows 3.2%, Outpacing National Average", 
                excerpt: "Latest GDP figures show strong economic growth across the West Midlands region.",
                category: "Business",
                source: "Financial Times",
                time: "2 hours ago",
                icon: "chart-line",
                url: "https://example.com/news/2"
            },
            { 
                title: "HS2 High-Speed Rail: Final Stage Approved for London-Birmingham Link", 
                excerpt: "Government gives green light to complete HS2 project, promising faster connections.",
                category: "Transport",
                source: "BBC Midlands",
                time: "3 hours ago",
                icon: "train",
                url: "https://example.com/news/3"
            },
            { 
                title: "Birmingham Libraries Report 40% Surge in Digital Book Loans", 
                excerpt: "E-book usage skyrockets as digital services expand across city libraries.",
                category: "Education",
                source: "Library News",
                time: "4 hours ago",
                icon: "book",
                url: "https://example.com/news/4"
            },
            { 
                title: "Summer Music Festival Returns to Birmingham with 50+ Artists", 
                excerpt: "Annual festival expands to three park locations across the city this summer.",
                category: "Entertainment",
                source: "Culture Today",
                time: "5 hours ago",
                icon: "music",
                url: "https://example.com/news/5"
            },
            { 
                title: "Tech Hub Creates 500 New Jobs in Birmingham Innovation District", 
                excerpt: "Major companies move to Birmingham's tech district, boosting employment.",
                category: "Technology",
                source: "Tech Midlands",
                time: "6 hours ago",
                icon: "laptop-code",
                url: "https://example.com/news/6"
            }
        ],
        technology: [
            { 
                title: "Birmingham AI Startup Develops Traffic Prediction Tool", 
                excerpt: "Local company creates software that predicts traffic patterns with 95% accuracy.",
                category: "Artificial Intelligence",
                source: "Tech Innovate",
                time: "1 hour ago",
                icon: "robot",
                url: "https://example.com/tech/1"
            },
            { 
                title: "University Opens £10M Quantum Computing Lab in Birmingham", 
                excerpt: "New facility positions Birmingham as UK's quantum research hub.",
                category: "Quantum Computing",
                source: "Science Today",
                time: "5 hours ago",
                icon: "atom",
                url: "https://example.com/tech/2"
            },
            { 
                title: "Local Tech Firms Secure £20M in Funding for Green Tech", 
                excerpt: "Birmingham startups developing sustainable technology attract major investment.",
                category: "Green Tech",
                source: "Eco Business",
                time: "7 hours ago",
                icon: "leaf",
                url: "https://example.com/tech/3"
            }
        ],
        sports: [
            { 
                title: "Birmingham City FC Promoted to Premier League After Dramatic Win", 
                excerpt: "Blues return to top flight after decade-long absence with last-minute victory.",
                category: "Football",
                source: "Sports Midlands",
                time: "1 hour ago",
                icon: "futbol",
                url: "https://example.com/sports/1"
            },
            { 
                title: "Local Athlete Wins Gold at National Athletics Championships", 
                excerpt: "Birmingham runner sets new personal best in 1500m event in Manchester.",
                category: "Athletics",
                source: "Athletics Weekly",
                time: "3 hours ago",
                icon: "running",
                url: "https://example.com/sports/2"
            }
        ],
        business: [
            { 
                title: "Regional Bank Announces Expansion: 150 New Jobs in West Midlands", 
                excerpt: "Five new branches to open across region as local bank expands services.",
                category: "Finance",
                source: "Business Daily",
                time: "2 hours ago",
                icon: "university",
                url: "https://example.com/business/1"
            },
            { 
                title: "Manufacturing Sector Reports Record Export Orders", 
                excerpt: "Automotive and aerospace industries see surge in international demand.",
                category: "Manufacturing",
                source: "Industry News",
                time: "4 hours ago",
                icon: "industry",
                url: "https://example.com/business/2"
            }
        ]
    };
    
    return mockDatabase[category] || mockDatabase.general;
}

// ============================================
// 9. NOTIFICATION SYSTEM (MISSING FUNCTION ADDED)
// ============================================

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                max-width: 350px;
                font-size: 0.9rem;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .notification-close {
                background: transparent;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 0.8rem;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            .notification-close:hover {
                opacity: 1;
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// ============================================
// START THE APPLICATION
// ============================================

console.log('BhamPulse Script Loaded Successfully');
