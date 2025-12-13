// News Configuration
const NEWS_API_KEY = '42f83001556744239dd1da740e2dc865';
const NEWS_API_URL = 'https://newsapi.org/v2';

// Weather API (OpenWeatherMap - Free)
const WEATHER_API_KEY = 'bd5e378503939ddaee76f12ad7a97608'; // Free public key
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';

// Application State
let currentCategory = 'general';
let currentPage = 1;
let articles = [];
let isUsingRSS = false;
let weatherData = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('BhamPulse Professional Edition Initialized');
    setupEventListeners();
    loadInitialData();
    updateStats();
    loadWeatherData();
});

// ==================== NAVIGATION SYSTEM ====================
function setupEventListeners() {
    // Main Navigation (Header Menu)
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get category from data attribute
            const category = this.dataset.category;
            
            // Handle special categories
            if (category === 'weather') {
                showWeatherDetails();
            } else if (category === 'home') {
                loadNews('general');
            } else {
                loadNews(category);
            }
            
            // Update category badge
            updateCategoryBadge(category);
            
            // Scroll to news section
            document.querySelector('.news-section').scrollIntoView({
                behavior: 'smooth'
            });
            
            console.log(`Navigated to: ${category}`);
        });
    });
    
    // Category Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Load news for this category
            const category = this.dataset.category;
            currentCategory = category;
            currentPage = 1;
            loadNews(category);
            
            // Update category badge
            updateCategoryBadge(category);
            
            console.log(`Category changed to: ${category}`);
        });
    });
    
    // Quick Links in Sidebar
    document.getElementById('weatherDetailsBtn').addEventListener('click', showWeatherDetails);
    document.getElementById('sportsHubBtn').addEventListener('click', () => loadNews('sports'));
    document.getElementById('localNewsBtn').addEventListener('click', () => loadNews('local'));
    document.getElementById('businessNewsBtn').addEventListener('click', () => loadNews('business'));
    
    // Refresh Button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadNews(currentCategory, true);
        showNotification('Refreshing news...', 'info');
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-redo"></i> Refresh News';
        }, 2000);
    });
    
    // Load More Button
    document.getElementById('loadMoreBtn').addEventListener('click', function() {
        currentPage++;
        loadNews(currentCategory, false, true);
    });
    
    // Search
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    
    // Newsletter
    document.getElementById('newsletterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('emailInput').value.trim();
        if (validateEmail(email)) {
            subscribeNewsletter(email);
        } else {
            showNotification('Please enter a valid email', 'error');
        }
    });
    
    // Mobile Menu Toggle
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('mainNav').classList.toggle('show');
    });
    
    // Auto-refresh every 5 minutes
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadNews(currentCategory, true);
            loadWeatherData();
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// ==================== NEWS LOADING ====================
async function loadNews(category, forceRefresh = false, loadMore = false) {
    console.log(`Loading ${category} news...`);
    
    // Update UI
    if (!loadMore) {
        document.getElementById('newsContainer').innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading ${category} news...</p>
            </div>
        `;
    }
    
    // Update current category
    currentCategory = category;
    
    try {
        // Try NewsAPI first
        const url = `${NEWS_API_URL}/top-headlines?country=gb&category=${category}&pageSize=20&page=${currentPage}&apiKey=${NEWS_API_KEY}`;
        const response = await fetch(url);
        
        if (response.status === 429) {
            throw new Error('API limit reached');
        }
        
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles.length > 0) {
            isUsingRSS = false;
            
            if (loadMore) {
                articles = [...articles, ...data.articles];
            } else {
                articles = data.articles;
            }
            
            displayNews(articles, loadMore);
            updateLastUpdateTime();
            updateStats();
            
            // Update breaking news ticker
            if (articles.length > 0 && !loadMore) {
                updateNewsTicker(articles[0]);
            }
            
            // Load trending from first 5 articles
            loadTrendingNews(data.articles.slice(0, 5));
            
            return;
        }
    } catch (error) {
        console.log('NewsAPI failed, trying RSS...', error);
    }
    
    // If NewsAPI fails, try RSS
    try {
        const rssData = await fetchFromRSS(category);
        
        if (rssData && rssData.length > 0) {
            isUsingRSS = true;
            
            if (loadMore) {
                articles = [...articles, ...rssData];
            } else {
                articles = rssData;
            }
            
            displayNews(articles, loadMore);
            updateLastUpdateTime();
            updateStats();
            
            showNotification('Using RSS feeds (NewsAPI limit reached)', 'info');
            return;
        }
    } catch (rssError) {
        console.log('RSS also failed:', rssError);
    }
    
    // If both fail, show sample data
    loadSampleData();
    showNotification('Showing sample news', 'warning');
}

// ==================== WEATHER SYSTEM ====================
async function loadWeatherData() {
    try {
        // Using Birmingham coordinates
        const response = await fetch(
            `${WEATHER_API_URL}/weather?q=Birmingham,UK&units=metric&appid=${WEATHER_API_KEY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            weatherData = data;
            updateWeatherDisplay(data);
            
            // Load forecast
            loadWeatherForecast();
        }
    } catch (error) {
        console.log('Weather API failed:', error);
        updateWeatherDisplay(null);
    }
}

async function loadWeatherForecast() {
    try {
        const response = await fetch(
            `${WEATHER_API_URL}/forecast?q=Birmingham,UK&units=metric&cnt=4&appid=${WEATHER_API_KEY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            updateForecastDisplay(data.list);
        }
    } catch (error) {
        console.log('Forecast API failed:', error);
    }
}

function updateWeatherDisplay(data) {
    if (!data) {
        // Use mock data if API fails
        document.getElementById('currentTemp').textContent = '14°C';
        document.getElementById('weatherCondition').textContent = 'Partly Cloudy';
        document.getElementById('windSpeed').textContent = '12 km/h';
        document.getElementById('humidity').textContent = '65%';
        document.getElementById('feelsLike').textContent = '13°C';
        document.getElementById('visibility').textContent = '10 km';
    } else {
        document.getElementById('currentTemp').textContent = `${Math.round(data.main.temp)}°C`;
        document.getElementById('weatherCondition').textContent = data.weather[0].main;
        document.getElementById('windSpeed').textContent = `${data.wind.speed} m/s`;
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
        document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
        document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    }
    
    document.getElementById('weatherUpdateTime').textContent = 
        `Updated: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
}

function updateForecastDisplay(forecastList) {
    const forecastGrid = document.getElementById('forecastGrid');
    forecastGrid.innerHTML = '';
    
    // Show next 3 forecasts
    forecastList.slice(0, 3).forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
        const temp = Math.round(item.main.temp);
        
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        forecastDay.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-condition">
                <i class="fas fa-cloud-sun"></i>
            </div>
            <div class="day-temp">${temp}°C</div>
        `;
        
        forecastGrid.appendChild(forecastDay);
    });
}

function showWeatherDetails() {
    const modal = document.createElement('div');
    modal.className = 'weather-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div class="weather-modal-content" style="
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <div class="modal-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
            ">
                <h2 style="font-size: 28px; color: #1a237e; margin: 0;">
                    <i class="fas fa-cloud-sun"></i>
                    Birmingham Weather Details
                </h2>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="background:none; border:none; font-size:24px; cursor:pointer; color:#666;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="weather-details-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            ">
                ${weatherData ? `
                    <div class="detail-card" style="background:#f5f7fa; padding:20px; border-radius:12px;">
                        <h4 style="color:#666; margin-bottom:10px;">Temperature</h4>
                        <p style="font-size:32px; font-weight:bold; color:#1a237e;">
                            ${Math.round(weatherData.main.temp)}°C
                        </p>
                        <p style="color:#666; font-size:14px;">
                            Feels like: ${Math.round(weatherData.main.feels_like)}°C
                        </p>
                    </div>
                    <div class="detail-card" style="background:#f5f7fa; padding:20px; border-radius:12px;">
                        <h4 style="color:#666; margin-bottom:10px;">Humidity</h4>
                        <p style="font-size:32px; font-weight:bold; color:#0288d1;">
                            ${weatherData.main.humidity}%
                        </p>
                        <p style="color:#666; font-size:14px;">Current humidity level</p>
                    </div>
                    <div class="detail-card" style="background:#f5f7fa; padding:20px; border-radius:12px;">
                        <h4 style="color:#666; margin-bottom:10px;">Wind</h4>
                        <p style="font-size:32px; font-weight:bold; color:#388e3c;">
                            ${weatherData.wind.speed} m/s
                        </p>
                        <p style="color:#666; font-size:14px;">Direction: ${weatherData.wind.deg}°</p>
                    </div>
                    <div class="detail-card" style="background:#f5f7fa; padding:20px; border-radius:12px;">
                        <h4 style="color:#666; margin-bottom:10px;">Pressure</h4>
                        <p style="font-size:32px; font-weight:bold; color:#f57c00;">
                            ${weatherData.main.pressure} hPa
                        </p>
                        <p style="color:#666; font-size:14px;">Atmospheric pressure</p>
                    </div>
                ` : `
                    <p>Weather data loading...</p>
                `}
            </div>
            
            <div class="weather-alerts" style="
                background: #fff3e0;
                border-left: 4px solid #f57c00;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            ">
                <h3 style="color:#f57c00; margin-bottom:10px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    Weather Alerts
                </h3>
                <p>No severe weather alerts for Birmingham at this time.</p>
            </div>
            
            <button onclick="this.closest('.weather-modal').remove()" 
                    style="
                        background: #1a237e;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        width: 100%;
                        transition: all 0.3s;
                    "
                    onmouseover="this.style.background='#283593'"
                    onmouseout="this.style.background='#1a237e'">
                Close Weather Details
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ==================== DISPLAY FUNCTIONS ====================
function displayNews(articles, append = false) {
    const container = document.getElementById('newsContainer');
    
    if (!append) {
        container.innerHTML = '';
    }
    
    if (!articles || articles.length === 0) {
        container.innerHTML = `
            <div class="no-news" style="text-align:center; padding:60px 20px;">
                <i class="fas fa-newspaper" style="font-size:48px; color:#ccc; margin-bottom:20px;"></i>
                <h3 style="color:#666; margin-bottom:10px;">No news articles found</h3>
                <p style="color:#999;">Try refreshing or selecting a different category</p>
            </div>
        `;
        return;
    }
    
    // Create featured first article
    if (!append && articles.length > 0) {
        const featuredArticle = articles[0];
        const featuredCard = createNewsCard(featuredArticle, 0, true);
        container.appendChild(featuredCard);
        
        // Remove featured from regular articles
        articles = articles.slice(1);
    }
    
    // Create regular articles
    articles.forEach((article, index) => {
        const card = createNewsCard(article, index + 1);
        container.appendChild(card);
    });
    
    // Show/hide load more button
    document.getElementById('loadMoreBtn').style.display = articles.length >= 20 ? 'block' : 'none';
}

function createNewsCard(article, index, isFeatured = false) {
    const card = document.createElement('div');
    card.className = `news-card ${isFeatured ? 'featured' : ''}`;
    
    const imageUrl = article.urlToImage || getDefaultImage(article.category || currentCategory);
    const title = article.title || 'No title available';
    const description = article.description || 'Click to read full article...';
    const source = article.source?.name || 'Unknown Source';
    const publishedAt = formatDate(article.publishedAt);
    const category = article.category || currentCategory;
    
    card.innerHTML = `
        ${isFeatured ? `
            <div class="news-image" style="height:300px;">
                <img src="${imageUrl}" alt="${title}" style="width:100%; height:100%; object-fit:cover;">
            </div>
        ` : `
            <div class="news-image">
                <img src="${imageUrl}" alt="${title}" style="width:100%; height:100%; object-fit:cover;">
            </div>
        `}
        
        <div class="news-content">
            <div class="news-meta">
                <span class="news-category">${category.toUpperCase()}</span>
                <span class="news-time">
                    <i class="far fa-clock"></i>
                    ${publishedAt}
                </span>
            </div>
            
            <h3 class="news-title">
                <a href="${article.url}" target="_blank">${title}</a>
            </h3>
            
            <p class="news-excerpt">
                ${description.length > 150 ? description.substring(0, 150) + '...' : description}
            </p>
            
            <div class="news-footer">
                <div class="source-info">
                    <div class="source-logo">
                        ${source.substring(0, 2).toUpperCase()}
                    </div>
                    <span class="source-name">${source}</span>
                </div>
                <button class="read-more" onclick="openArticleModal(${JSON.stringify(article).replace(/"/g, '&quot;')})">
                    <i class="fas fa-external-link-alt"></i>
                    Read Full
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// ==================== UTILITY FUNCTIONS ====================
function updateCategoryBadge(category) {
    const badge = document.getElementById('currentCategoryBadge');
    const categoryNames = {
        'general': 'Top Stories',
        'business': 'Business',
        'sports': 'Sports',
        'technology': 'Technology',
        'entertainment': 'Entertainment',
        'health': 'Health',
        'local': 'Local News',
        'science': 'Science'
    };
    
    badge.textContent = categoryNames[category] || category.toUpperCase();
}

function updateLastUpdateTime() {
    document.getElementById('lastUpdate').textContent = 
        `Updated: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`;
}

function updateStats() {
    document.getElementById('liveArticleCount').textContent = articles.length;
}

function updateNewsTicker(article) {
    if (article && article.title) {
        const ticker = document.getElementById('newsTicker');
        const text = `BREAKING: ${article.title.substring(0, 100)}...`;
        ticker.textContent = text;
        
        // Animate the ticker
        ticker.style.animation = 'none';
        setTimeout(() => {
            ticker.style.animation = 'marquee 30s linear infinite';
        }, 10);
    }
}

function loadTrendingNews(trendingArticles) {
    const container = document.getElementById('trendingList');
    container.innerHTML = '';
    
    trendingArticles.slice(0, 5).forEach((article, index) => {
        const item = document.createElement('div');
        item.className = 'trending-item';
        item.innerHTML = `
            <div class="trending-rank">${index + 1}</div>
            <div class="trending-content">
                <div class="trending-title">${article.title.substring(0, 80)}...</div>
                <div class="trending-meta">
                    <span><i class="far fa-clock"></i> ${formatDate(article.publishedAt)}</span>
                </div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            openArticleModal(article);
        });
        
        container.appendChild(item);
    });
}

function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        showNotification(`Searching for: ${query}`, 'info');
        // Implement search functionality here
        document.getElementById('searchInput').value = '';
    }
}

// ==================== MODAL FUNCTIONS ====================
function openArticleModal(article) {
    const modal = document.createElement('div');
    modal.className = 'article-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div class="article-modal-content" style="
            background: white;
            border-radius: 20px;
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 30px 80px rgba(0,0,0,0.5);
        ">
            <div class="modal-header" style="
                background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
                color: white;
                padding: 30px;
                border-radius: 20px 20px 0 0;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h2 style="margin: 0; font-size: 28px; line-height: 1.3; flex: 1; padding-right: 20px;">
                        ${article.title}
                    </h2>
                    <button onclick="this.closest('.article-modal').remove()" 
                            style="
                                background: rgba(255,255,255,0.2);
                                border: none;
                                color: white;
                                width: 40px;
                                height: 40px;
                                border-radius: 50%;
                                cursor: pointer;
                                font-size: 20px;
                                flex-shrink: 0;
                            ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 20px;
                    font-size: 14px;
                    opacity: 0.9;
                ">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span><i class="fas fa-newspaper"></i> ${article.source?.name || 'Source'}</span>
                        <span><i class="far fa-clock"></i> ${formatDate(article.publishedAt)}</span>
                        <span style="
                            background: rgba(255,255,255,0.2);
                            padding: 4px 12px;
                            border-radius: 12px;
                        ">
                            ${article.category || currentCategory}
                        </span>
                    </div>
                    
                    <a href="${article.url}" target="_blank" 
                       style="
                            background: white;
                            color: #1a237e;
                            padding: 8px 20px;
                            border-radius: 20px;
                            text-decoration: none;
                            font-weight: bold;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: all 0.3s;
                       "
                       onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(255,255,255,0.2)'"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                        <i class="fas fa-external-link-alt"></i>
                        Visit Source
                    </a>
                </div>
            </div>
            
            <div class="modal-body" style="padding: 40px;">
                ${article.urlToImage ? `
                    <img src="${article.urlToImage}" 
                         alt="${article.title}"
                         style="
                            width: 100%;
                            max-height: 400px;
                            object-fit: cover;
                            border-radius: 12px;
                            margin-bottom: 30px;
                         ">
                ` : ''}
                
                <div style="
                    font-size: 18px;
                    line-height: 1.8;
                    color: #333;
                    margin-bottom: 30px;
                    padding-bottom: 30px;
                    border-bottom: 2px solid #f5f7fa;
                ">
                    ${article.description || article.content || 'No content available.'}
                </div>
                
                <div style="
                    font-size: 16px;
                    line-height: 1.7;
                    color: #555;
                ">
                    ${article.content ? 
                        article.content.replace(/\n/g, '<br>').replace(/\[\+\d+ chars\]/g, '') : 
                        '<p>For the complete article, please visit the original source using the link above.</p>'
                    }
                </div>
            </div>
            
            <div class="modal-footer" style="
                padding: 30px;
                background: #f5f7fa;
                border-radius: 0 0 20px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <button onclick="shareArticle('${article.title}', '${article.url}')"
                        style="
                            background: #388e3c;
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-weight: bold;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: all 0.3s;
                        "
                        onmouseover="this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.transform='translateY(0)'">
                    <i class="fas fa-share-alt"></i>
                    Share Article
                </button>
                
                <button onclick="this.closest('.article-modal').remove()"
                        style="
                            background: #d32f2f;
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            border-radius: 10px;
                            cursor: pointer;
                            font-weight: bold;
                            transition: all 0.3s;
                        "
                        onmouseover="this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.transform='translateY(0)'">
                    Close Article
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function shareArticle(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: 'Check out this article from BhamPulse',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        showNotification('Link copied to clipboard!', 'success');
    }
}

// ==================== HELPER FUNCTIONS ====================
function formatDate(dateString) {
    if (!dateString) return 'Recently';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return 'Recently';
    }
}

function getDefaultImage(category) {
    const images = {
        general: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        business: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        technology: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        entertainment: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    };
    
    return images[category] || images.general;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#d32f2f' : type === 'success' ? '#388e3c' : '#0288d1'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function subscribeNewsletter(email) {
    const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
    subscribers.push({
        email: email,
        date: new Date().toISOString()
    });
    localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
    
    document.getElementById('emailInput').value = '';
    showNotification('Thank you for subscribing!', 'success');
}

// RSS function (backup)
async function fetchFromRSS(category) {
    // RSS implementation as backup
    return [];
}

// Sample data fallback
function loadSampleData() {
    // Sample data implementation
    articles = [];
    displayNews(articles);
}

// Initial data loading
function loadInitialData() {
    loadNews('general');
    loadTrendingNews([]);
}

// Add CSS for notifications
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyle);

console.log('BhamPulse Professional Edition Loaded Successfully!');
