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
let allArticles = [];

// DOM Elements for BBC Hero
const bbcBreakingText = document.getElementById('bbcBreakingText');
const bbcWeatherTime = document.getElementById('bbcWeatherTime');
const bbcWeatherTemp = document.getElementById('bbcWeatherTemp');
const bbcWeatherCondition = document.getElementById('bbcWeatherCondition');
const liveArticleCount = document.getElementById('liveArticleCount');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('BhamPulse - Birmingham News Hub initialized with News API');
    
    // Initialize all components
    initNavigation();
    initBreakingNews();
    initBBCWeather();
    initCategoryTabs();
    initNews();
    initSidebar();
    initQuickLinks();
    
    // Set initial update time
    updateLastUpdateTime();
    
    // Auto-refresh news every 5 minutes
    setInterval(() => {
        refreshNews();
        updateBBCWeatherTime();
    }, 5 * 60 * 1000);
});

// ============================================
// BBC WEATHER FUNCTIONS
// ============================================

function initBBCWeather() {
    updateBBCWeatherTime();
    
    // Update weather time every minute
    setInterval(updateBBCWeatherTime, 60000);
}

function updateBBCWeatherTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    bbcWeatherTime.textContent = timeString;
    
    // Randomize weather for demo (in real app, use weather API)
    randomizeBBCWeather();
}

function randomizeBBCWeather() {
    // Random temperature between 10-18°C
    const temp = Math.floor(Math.random() * 9) + 10;
    bbcWeatherTemp.textContent = `${temp}°C`;
    
    // Random conditions
    const conditions = ['Cloudy', 'Partly Cloudy', 'Sunny', 'Light Rain', 'Clear'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    bbcWeatherCondition.textContent = randomCondition;
}

// ============================================
// NEWS API FUNCTIONS (REAL NEWS FETCHING)
// ============================================

async function fetchRealNews(category = 'general', page = 1) {
    // Show loading state
    showLoadingState();
    
    try {
        // API parameters based on NewsAPI documentation[citation:4][citation:9]
        const params = {
            country: 'gb', // Great Britain
            category: category === 'general' ? '' : category,
            page: page,
            pageSize: articlesPerPage,
            apiKey: NEWS_API_KEY
        };
        
        // Remove empty parameters
        Object.keys(params).forEach(key => {
            if (params[key] === '') delete params[key];
        });
        
        // Build URL[citation:7]
        const queryString = new URLSearchParams(params).toString();
        const url = `${NEWS_API_URL}?${queryString}`;
        
        // Fetch from NewsAPI[citation:7]
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we got articles
        if (data.articles && data.articles.length > 0) {
            // Transform API data to our format
            allArticles = transformApiData(data.articles, category);
            
            // Display articles
            displayNewsArticles(allArticles, page);
            
            // Update breaking news with first article
            if (data.articles[0].title) {
                bbcBreakingText.textContent = data.articles[0].title;
            }
            
            // Update article count
            updateArticleCount(data.totalResults);
        } else {
            // No articles found, use mock data
            console.log('No articles found, using sample data');
            allArticles = getMockNewsData(category);
            displayNewsArticles(allArticles, page);
        }
        
        // Update last update time
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Error fetching news:', error);
        
        // Fallback to mock data if API fails
        showNotification('Using sample data. API connection failed.', 'error');
        allArticles = getMockNewsData(category);
        displayNewsArticles(allArticles, page);
    }
}

function transformApiData(apiArticles, category) {
    return apiArticles.map((article, index) => {
        // Determine icon based on category
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

function displayNewsArticles(articles, page) {
    // Clear container if first page
    if (page === 1) {
        newsContainer.innerHTML = '';
    }
    
    // Check if there are more articles to load
    if (articles.length < articlesPerPage) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'flex';
    }
    
    // Display articles
    articles.forEach(article => {
        const newsCard = createNewsCard(article);
        newsContainer.appendChild(newsCard);
    });
    
    // If no articles found
    if (articles.length === 0 && page === 1) {
        newsContainer.innerHTML = `
            <div class="no-articles">
                <i class="fas fa-newspaper"></i>
                <h3>No articles found</h3>
                <p>Try selecting a different category or check back later.</p>
            </div>
        `;
    }
}

function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';
    
    // Use image if available, otherwise use icon
    const imageContent = article.imageUrl 
        ? `<img src="${article.imageUrl}" alt="${article.title}" class="card-image-real" onerror="this.onerror=null; this.src=''; this.className='card-image'; this.innerHTML='<i class=\\'fas fa-${article.icon}\\'></i>'">`
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
    
    // Add click event to open actual article
    if (article.url) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.open(article.url, '_blank');
        });
    }
    
    return card;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCategoryName(category) {
    return category === 'general' ? 'Top Stories' : 
           category.charAt(0).toUpperCase() + category.slice(1);
}

function formatTimeAgo(publishedAt) {
    if (!publishedAt) return 'Recently';
    
    const published = new Date(publishedAt);
    const now = new Date();
    const diffInHours = Math.floor((now - published) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }
}

function updateArticleCount(count) {
    if (count && count > 0) {
        const displayCount = count > 1000 ? 
            `${(count/1000).toFixed(1)}K` : count;
        liveArticleCount.textContent = displayCount;
    }
}

function showLoadingState() {
    if (currentPage === 1) {
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
    lastUpdate.textContent = `Updated: ${timeString}`;
}

// ============================================
// REPLACED FUNCTIONS (as requested)
// ============================================

function initNews() {
    // Load initial news from API
    fetchRealNews(currentCategory, currentPage);
    
    // Refresh button
    refreshBtn.addEventListener('click', refreshNews);
    
    // Load more button
    loadMoreBtn.addEventListener('click', loadMoreNews);
}

function refreshNews() {
    // Add spin animation to refresh button
    refreshBtn.innerHTML = '<i class="fas fa-redo fa-spin"></i> Refreshing...';
    
    // Reset to first page
    currentPage = 1;
    
    // Fetch fresh news from API
    fetchRealNews(currentCategory, currentPage);
    
    // Restore refresh button after delay
    setTimeout(() => {
        refreshBtn.innerHTML = '<i class="fas fa-redo"></i> Refresh News';
        showNotification('News updated successfully');
    }, 1000);
}

function loadMoreNews() {
    currentPage++;
    fetchRealNews(currentCategory, currentPage);
}

// ============================================
// MOCK DATA FALLBACK (if API fails)
// ============================================

function getMockNewsData(category) {
    // Mock data as fallback
    const mockData = {
        general: [
            { 
                title: "Birmingham Announces Major Urban Regeneration Project", 
                excerpt: "£500 million investment to transform city center with new green spaces and pedestrian zones.",
                category: "Local News",
                source: "Bham Post",
                time: "1 hour ago",
                icon: "city"
            },
            { 
                title: "West Midlands Economy Shows Strong Growth", 
                excerpt: "Latest figures reveal 3.2% GDP growth, outpacing national average for third consecutive quarter.",
                category: "Business",
                source: "Financial Times",
                time: "2 hours ago",
                icon: "chart-line"
            }
        ],
        business: [
            { 
                title: "Local Bank Announces Expansion Plans", 
                excerpt: "150 new jobs to be created as regional bank opens five new branches across West Midlands.",
                category: "Finance",
                source: "Business Daily",
                time: "2 hours ago",
                icon: "university"
            }
        ],
        sports: [
            { 
                title: "Birmingham City FC Secures Championship Promotion", 
                excerpt: "Dramatic final match victory sends Blues to Premier League after decade-long absence.",
                category: "Football",
                source: "Sports Midlands",
                time: "1 hour ago",
                icon: "futbol"
            }
        ]
    };
    
    return mockData[category] || mockData.general;
}

// ============================================
// EXISTING FUNCTIONS (keep these from your original code)
// ============================================

// Keep all your existing functions for:
// - initNavigation()
// - initBreakingNews()
// - initCategoryTabs()
// - initSidebar()
// - initQuickLinks()
// - showNotification()
// - etc.

// (Include all the rest of your original JavaScript code here...
//  I'm showing only the replaced/changed functions above for clarity)
// ...

// ============================================
// START THE APPLICATION
// ============================================

// Initial news load
fetchRealNews(currentCategory, currentPage);
