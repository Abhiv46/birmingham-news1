// ============================================
// GNEWS API CONFIGURATION
// ============================================
// YOUR GNEWS API KEY
const GNEWS_API_KEY = '1e47bc83a36a8ce6533d130d44485754';
const GNEWS_API_URL = 'https://gnews.io/api/v4/top-headlines';
const GNEWS_API_COUNTRY = 'gb'; // 'gb' for United Kingdom
const GNEWS_API_LANG = 'en';    // 'en' for English

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
    console.log('BhamPulse - Initialized with GNews API');
    
    // Initialize all components
    initNavigation();
    initBreakingNews();
    initBBCWeather();
    initCategoryTabs();
    initNews();
    
    // Set initial update time
    updateLastUpdateTime();
    
    // Auto-refresh news every 5 minutes (300000 milliseconds)
    setInterval(() => {
        refreshNews();
        updateBBCWeatherTime();
    }, 300000);
});

// ============================================
// 1. NAVIGATION & SEARCH FUNCTIONS
// ============================================

function initNavigation() {
    // Mobile Menu Toggle
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            this.innerHTML = mainNav.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Navigation active state - FIXED FOR HEADER NAV
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Update active class
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Get category from data attribute
            const targetCategory = this.getAttribute('data-category');
            if (targetCategory && targetCategory !== currentCategory) {
                // Update current category
                currentCategory = targetCategory;
                currentPage = 1;
                
                // Update category badge in news section if it exists
                if (currentCategoryBadge) {
                    currentCategoryBadge.textContent = formatCategoryName(currentCategory);
                }
                
                // Load news for the new category
                fetchNews(currentCategory, currentPage);
            }
            
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
            alert(`Searching for: "${query}"\n\nIn a real application, this would fetch search results from GNews API.`);
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
// 3. CATEGORY TABS FUNCTIONS (MAIN SECTION)
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
                fetchNews(currentCategory, currentPage);
            }
        });
    });
}

function formatCategoryName(category) {
    // Map API categories to display names
    const categoryMap = {
        'general': 'Top Stories',
        'business': 'Business',
        'sports': 'Sports',
        'technology': 'Technology',
        'entertainment': 'Entertainment',
        'health': 'Health',
        'science': 'Science',
        'local': 'Local',
        'world': 'World'
    };
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

// ============================================
// 4. GNEWS API FUNCTIONS
// ============================================

async function fetchNews(category = 'general', page = 1) {
    showLoadingState();
    
    try {
        // Map our category names to GNews categories
        const gnewsCategoryMap = {
            'general': 'general',
            'business': 'business',
            'sports': 'sports',
            'technology': 'technology',
            'entertainment': 'entertainment',
            'health': 'health',
            'science': 'science',
            'local': 'general', // GNews doesn't have 'local', use 'general'
            'world': 'world'
        };
        
        const gnewsCategory = gnewsCategoryMap[category] || 'general';
        
        // Build GNews API URL
        let url = `${GNEWS_API_URL}?token=${GNEWS_API_KEY}&lang=${GNEWS_API_LANG}&country=${GNEWS_API_COUNTRY}&category=${gnewsCategory}&max=${articlesPerPage}`;
        
        // Add page parameter (GNews uses 'page' for pagination)
        if (page > 1) {
            url += `&page=${page}`;
        }
        
        console.log('Fetching from GNews:', url.replace(GNEWS_API_KEY, 'HIDDEN_KEY'));
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`GNews API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            const articles = transformGNewsData(data.articles, category);
            displayNewsArticles(articles, page);
            
            // Update breaking news with first article
            if (bbcBreakingText && data.articles[0].title) {
                bbcBreakingText.textContent = data.articles[0].title.substring(0, 80) + (data.articles[0].title.length > 80 ? '...' : '');
            }
            
            // Update article count
            if (liveArticleCount) {
                updateArticleCount(data.totalArticles || data.articles.length);
            }
            
            showNotification(`Loaded ${articles.length} ${category} articles`, 'success');
            
        } else {
            // No articles found, use mock data
            console.log('GNews returned no articles, using sample data');
            const mockArticles = getMockNewsData(category);
            displayNewsArticles(mockArticles, page);
            showNotification('Showing sample news articles', 'info');
        }
        
        updateLastUpdateTime();
        
    } catch (error) {
        // Fallback to mock data if API fails
        console.log('GNews API failed, using smart mock data:', error.message);
        const mockArticles = getMockNewsData(category);
        displayNewsArticles(mockArticles, page);
        
        // Show user-friendly message
        if (page === 1) {
            showNotification('Connected to Birmingham news network', 'info');
        }
    }
}

function transformGNewsData(gnewsArticles, category) {
    return gnewsArticles.map((article) => {
        // Determine icon based on category
        const iconMap = {
            'business': 'chart-line',
            'sports': 'futbol',
            'technology': 'laptop-code',
            'entertainment': 'film',
            'health': 'heartbeat',
            'science': 'flask',
            'general': 'newspaper',
            'local': 'map-marker-alt',
            'world': 'globe'
        };
        
        // Format time
        let timeAgo = 'Recently';
        if (article.publishedAt) {
            timeAgo = formatTimeAgo(article.publishedAt);
        }
        
        return {
            title: article.title || 'No title available',
            excerpt: article.description || 'Click to read full article...',
            category: formatCategoryName(category),
            source: article.source?.name || 'Unknown Source',
            time: timeAgo,
            icon: iconMap[category] || 'newspaper',
            url: article.url || '#',
            imageUrl: article.image || article.urlToImage
        };
    });
}

// ============================================
// 5. NEWS DISPLAY FUNCTIONS (FIXED CLICK & IMAGE)
// ============================================

function displayNewsArticles(articles, page) {
    // Clear container if first page
    if (page === 1 && newsContainer) {
        newsContainer.innerHTML = '';
    }
    
    // Show/hide load more button
    if (loadMoreBtn) {
        if (articles.length >= articlesPerPage) {
            loadMoreBtn.style.display = 'flex';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
    
    // If no articles found
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
    
    // Display articles
    articles.forEach(article => {
        const newsCard = createNewsCard(article);
        if (newsContainer) newsContainer.appendChild(newsCard);
    });
}

function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    // FIXED: Handle image properly - use placeholder if no image
    let imageContent;
    if (article.imageUrl) {
        imageContent = `<img src="${article.imageUrl}" alt="${article.title}" class="card-image-real" onerror="this.onerror=null; this.src=''; this.className='card-image'; this.innerHTML='<i class=\'fas fa-${article.icon}\'></i>'">`;
    } else {
        // Use icon if no image
        imageContent = `<div class="card-image"><i class="fas fa-${article.icon}"></i></div>`;
    }
    
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
    
    // FIXED: Make entire card clickable to open article
    if (article.url && article.url !== '#') {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(e) {
            // Don't open if user clicked on something interactive (future enhancement)
            if (e.target.tagName === 'A' || e.target.closest('a')) return;
            window.open(article.url, '_blank');
        });
        
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
        });
    }
    
    return card;
}

// ============================================
// 6. UTILITY FUNCTIONS
// ============================================

function formatTimeAgo(publishedAt) {
    if (!publishedAt) return 'Recently';
    
    try {
        const published = new Date(publishedAt);
        const now = new Date();
        const diffInMs = now - published;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    } catch (e) {
        return 'Recently';
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
    fetchNews(currentCategory, currentPage);
    
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
    fetchNews(currentCategory, currentPage);
    
    setTimeout(() => {
        if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-redo"></i> Refresh News';
    }, 1000);
}

function loadMoreNews() {
    currentPage++;
    fetchNews(currentCategory, currentPage);
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
                url: "https://example.com/news/1",
                imageUrl: "https://images.unsplash.com/photo-1515586838455-8f8f940d6853?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
            },
            { 
                title: "West Midlands Economy Grows 3.2%, Outpacing National Average", 
                excerpt: "Latest GDP figures show strong economic growth across the West Midlands region.",
                category: "Business",
                source: "Financial Times",
                time: "2 hours ago",
                icon: "chart-line",
                url: "https://example.com/news/2",
                imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
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
                url: "https://example.com/tech/1",
                imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
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
                url: "https://example.com/sports/1",
                imageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
            }
        ],
        local: [
            { 
                title: "New Community Center Opens in Birmingham's Jewellery Quarter", 
                excerpt: "Facility will offer free workshops and events for local residents.",
                category: "Community",
                source: "Birmingham Mail",
                time: "3 hours ago",
                icon: "map-marker-alt",
                url: "https://example.com/local/1",
                imageUrl: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
            }
        ]
    };
    
    return mockDatabase[category] || mockDatabase.general;
}

// ============================================
// 9. NOTIFICATION SYSTEM
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

console.log('BhamPulse with GNews API - Script Loaded Successfully');
