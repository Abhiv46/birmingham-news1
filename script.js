// ============================================
// DOM ELEMENTS
// ============================================

// Header & Navigation
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Breaking News Ticker
const newsTicker = document.getElementById('newsTicker');

// Weather Elements
const weatherUpdateTime = document.getElementById('weatherUpdateTime');
const currentTemp = document.getElementById('currentTemp');
const weatherCondition = document.getElementById('weatherCondition');
const windSpeed = document.getElementById('windSpeed');
const humidity = document.getElementById('humidity');
const feelsLike = document.getElementById('feelsLike');
const visibility = document.getElementById('visibility');
const forecastGrid = document.getElementById('forecastGrid');

// Stats
const liveArticleCount = document.getElementById('liveArticleCount');
const readerCount = document.getElementById('readerCount');

// Category Tabs & News
const categoryTabs = document.getElementById('categoryTabs');
const currentCategoryBadge = document.getElementById('currentCategoryBadge');
const newsContainer = document.getElementById('newsContainer');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Sidebar Elements
const trendingList = document.getElementById('trendingList');
const newsletterForm = document.getElementById('newsletterForm');
const emailInput = document.getElementById('emailInput');

// Quick Links
const weatherDetailsBtn = document.getElementById('weatherDetailsBtn');
const sportsHubBtn = document.getElementById('sportsHubBtn');
const localNewsBtn = document.getElementById('localNewsBtn');
const businessNewsBtn = document.getElementById('businessNewsBtn');

// ============================================
// GLOBAL VARIABLES
// ============================================

let currentCategory = 'general';
let currentPage = 1;
const articlesPerPage = 6;
let allArticles = [];

// Mock API Configuration
const MOCK_API_DELAY = 800; // milliseconds

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('BhamPulse - Birmingham News Hub initialized');
    
    // Initialize all components
    initNavigation();
    initBreakingNews();
    initWeather();
    initStats();
    initCategoryTabs();
    initNews();
    initSidebar();
    initQuickLinks();
    
    // Set initial update time
    updateLastUpdateTime();
    
    // Auto-refresh news every 5 minutes
    setInterval(() => {
        refreshNews();
        updateWeatherTime();
    }, 5 * 60 * 1000);
});

// ============================================
// NAVIGATION & SEARCH
// ============================================

function initNavigation() {
    // Mobile Menu Toggle
    menuToggle.addEventListener('click', function() {
        mainNav.classList.toggle('active');
        this.innerHTML = mainNav.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!menuToggle.contains(event.target) && !mainNav.contains(event.target)) {
            mainNav.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
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
            mainNav.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            
            // Scroll to section
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Search functionality
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

function performSearch() {
    const query = searchInput.value.trim();
    if (query) {
        alert(`Searching for: "${query}"\n\nIn a real application, this would fetch search results from a news API.`);
        searchInput.value = '';
    } else {
        searchInput.focus();
    }
}

// ============================================
// BREAKING NEWS TICKER
// ============================================

function initBreakingNews() {
    // Mock breaking news headlines
    const breakingNews = [
        "New transportation plan approved for Birmingham city center to reduce congestion",
        "West Midlands tech investment reaches record high in Q1 2024",
        "Birmingham City FC announces major stadium renovation project",
        "Severe weather warning issued for parts of West Midlands tomorrow",
        "Local startup secures £5 million funding for green energy innovation"
    ];
    
    // Combine into ticker text
    const tickerText = breakingNews.join(' • ');
    newsTicker.textContent = tickerText;
    
    // Ensure the ticker animation works with the new content
    newsTicker.style.animation = 'none';
    setTimeout(() => {
        newsTicker.style.animation = 'ticker 30s linear infinite';
    }, 10);
}

// ============================================
// WEATHER WIDGET
// ============================================

function initWeather() {
    updateWeatherTime();
    generateWeatherForecast();
    
    // Update weather time every minute
    setInterval(updateWeatherTime, 60000);
}

function updateWeatherTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    weatherUpdateTime.textContent = `Updated at ${timeString}`;
}

function generateWeatherForecast() {
    // Mock 3-day forecast data
    const forecastData = [
        { day: 'Today', temp: '14°C', condition: 'Partly Cloudy', icon: 'fa-cloud-sun' },
        { day: 'Tomorrow', temp: '12°C', condition: 'Light Rain', icon: 'fa-cloud-rain' },
        { day: 'Wed', temp: '16°C', condition: 'Sunny', icon: 'fa-sun' }
    ];
    
    // Clear existing forecast
    forecastGrid.innerHTML = '';
    
    // Generate forecast cards
    forecastData.forEach(day => {
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        forecastDay.innerHTML = `
            <div class="day-name">${day.day}</div>
            <div class="forecast-icon"><i class="fas ${day.icon}"></i></div>
            <div class="day-temp">${day.temp}</div>
            <div class="day-condition">${day.condition}</div>
        `;
        forecastGrid.appendChild(forecastDay);
    });
}

// ============================================
// STATISTICS
// ============================================

function initStats() {
    // Mock live article count with animation
    let count = 0;
    const targetCount = 127;
    const increment = Math.ceil(targetCount / 100);
    
    const counterInterval = setInterval(() => {
        count += increment;
        if (count >= targetCount) {
            count = targetCount;
            clearInterval(counterInterval);
        }
        liveArticleCount.textContent = count;
    }, 20);
    
    // Animate reader count
    setTimeout(() => {
        readerCount.textContent = '1.4K';
    }, 1500);
}

// ============================================
// CATEGORY TABS
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
                currentCategoryBadge.textContent = formatCategoryName(newCategory);
                
                // Load news for new category
                loadNews();
            }
        });
    });
}

function formatCategoryName(category) {
    return category === 'general' ? 'Top Stories' : 
           category.charAt(0).toUpperCase() + category.slice(1);
}

// ============================================
// NEWS SYSTEM
// ============================================

function initNews() {
    // Load initial news
    loadNews();
    
    // Refresh button
    refreshBtn.addEventListener('click', refreshNews);
    
    // Load more button
    loadMoreBtn.addEventListener('click', loadMoreNews);
}

function loadNews() {
    // Show loading state
    newsContainer.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading ${formatCategoryName(currentCategory).toLowerCase()}...</p>
        </div>
    `;
    
    // Simulate API delay
    setTimeout(() => {
        // Fetch mock news data
        allArticles = getMockNewsData(currentCategory);
        
        // Display first page
        displayNewsPage(1);
        
        // Update last update time
        updateLastUpdateTime();
    }, MOCK_API_DELAY);
}

function refreshNews() {
    // Add spin animation to refresh button
    refreshBtn.innerHTML = '<i class="fas fa-redo fa-spin"></i> Refreshing...';
    
    // Simulate API call
    setTimeout(() => {
        // Reload news
        loadNews();
        
        // Restore refresh button
        refreshBtn.innerHTML = '<i class="fas fa-redo"></i> Refresh News';
        
        // Show refresh confirmation
        showNotification('News updated with latest stories');
    }, MOCK_API_DELAY);
}

function loadMoreNews() {
    currentPage++;
    displayNewsPage(currentPage);
}

function displayNewsPage(page) {
    // Calculate articles to show
    const startIndex = 0; // Always show from beginning for simplicity
    const endIndex = page * articlesPerPage;
    const articlesToShow = allArticles.slice(startIndex, endIndex);
    
    // Clear container if first page
    if (page === 1) {
        newsContainer.innerHTML = '';
    }
    
    // Check if there are more articles to load
    if (endIndex >= allArticles.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'flex';
    }
    
    // Display articles
    articlesToShow.forEach(article => {
        const newsCard = createNewsCard(article);
        newsContainer.appendChild(newsCard);
    });
}

function createNewsCard(article) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.innerHTML = `
        <div class="card-image">
            <i class="fas fa-${article.icon}"></i>
        </div>
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
    
    // Add click event
    card.addEventListener('click', () => {
        alert(`Opening article: "${article.title}"\n\nIn a real application, this would navigate to the full article page.`);
    });
    
    return card;
}

function getMockNewsData(category) {
    // Mock news data for different categories
    const newsDatabase = {
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
            },
            { 
                title: "New High-Speed Rail Link to London Gets Green Light", 
                excerpt: "Government approves final stage of HS2 project, promising faster connections to the capital.",
                category: "Transport",
                source: "BBC Midlands",
                time: "3 hours ago",
                icon: "train"
            },
            { 
                title: "Birmingham Libraries See Record Digital Usage", 
                excerpt: "Local libraries report 40% increase in e-book loans as digital services expand across the city.",
                category: "Education",
                source: "Library News",
                time: "4 hours ago",
                icon: "book"
            },
            { 
                title: "Major Music Festival Returns to Birmingham Parks", 
                excerpt: "Annual summer festival expands to three locations with over 50 artists confirmed.",
                category: "Entertainment",
                source: "Culture Today",
                time: "5 hours ago",
                icon: "music"
            },
            { 
                title: "Local Tech Hub Creates 500 New Jobs", 
                excerpt: "Innovation district attracts major companies, boosting employment in digital sectors.",
                category: "Technology",
                source: "Tech Midlands",
                time: "6 hours ago",
                icon: "laptop-code"
            },
            { 
                title: "New Recycling Initiative Launches Across West Midlands", 
                excerpt: "Council introduces smart bins and increased collections to improve recycling rates.",
                category: "Environment",
                source: "Green Birmingham",
                time: "7 hours ago",
                icon: "recycle"
            },
            { 
                title: "Historic Building Restoration Completed", 
                excerpt: "19th century landmark reopens after £2 million conservation project.",
                category: "Heritage",
                source: "Heritage News",
                time: "8 hours ago",
                icon: "landmark"
            },
            { 
                title: "Community Kitchen Feeds Hundreds Daily", 
                excerpt: "Volunteer-run initiative provides meals for vulnerable residents across the city.",
                category: "Community",
                source: "Community Voice",
                time: "9 hours ago",
                icon: "utensils"
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
            },
            { 
                title: "Manufacturing Sector Reports Record Orders", 
                excerpt: "Export demand drives growth in automotive and aerospace industries.",
                category: "Manufacturing",
                source: "Industry News",
                time: "4 hours ago",
                icon: "industry"
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
            },
            { 
                title: "Local Athlete Wins Gold at National Championships", 
                excerpt: "Birmingham runner sets new personal best in 1500m event.",
                category: "Athletics",
                source: "Athletics Weekly",
                time: "3 hours ago",
                icon: "running"
            }
        ],
        technology: [
            { 
                title: "Tech Startup Develops Revolutionary AI Tool", 
                excerpt: "Local company's software can predict traffic patterns with 95% accuracy.",
                category: "Artificial Intelligence",
                source: "Tech Innovate",
                time: "1 hour ago",
                icon: "robot"
            },
            { 
                title: "University Opens New Quantum Computing Lab", 
                excerpt: "£10 million facility to position Birmingham as UK quantum research hub.",
                category: "Quantum Computing",
                source: "Science Today",
                time: "5 hours ago",
                icon: "atom"
            }
        ],
        entertainment: [
            { 
                title: "Birmingham Symphony Orchestra Announces New Season", 
                excerpt: "World premiere performances and international collaborations featured in upcoming program.",
                category: "Music",
                source: "Arts Review",
                time: "2 hours ago",
                icon: "guitar"
            },
            { 
                title: "Major Film Production Coming to Birmingham", 
                excerpt: "Hollywood studio to shoot period drama in historic Jewellery Quarter locations.",
                category: "Film",
                source: "Screen Daily",
                time: "6 hours ago",
                icon: "film"
            }
        ],
        health: [
            { 
                title: "New Hospital Wing Opens Ahead of Schedule", 
                excerpt: "State-of-the-art facilities to reduce waiting times and improve patient care.",
                category: "Healthcare",
                source: "Health Midlands",
                time: "3 hours ago",
                icon: "hospital"
            },
            { 
                title: "Breakthrough in Local Medical Research", 
                excerpt: "University team discovers promising new treatment for respiratory conditions.",
                category: "Medical Research",
                source: "Science Journal",
                time: "7 hours ago",
                icon: "microscope"
            }
        ],
        science: [
            { 
                title: "Climate Research Center Makes Key Discovery", 
                excerpt: "Birmingham scientists identify new method for carbon capture and storage.",
                category: "Climate Science",
                source: "Nature Research",
                time: "4 hours ago",
                icon: "cloud-sun"
            },
            { 
                title: "Local University Launches Space Research Program", 
                excerpt: "New initiative to study asteroid mining and lunar exploration technologies.",
                category: "Space Research",
                source: "Space News",
                time: "8 hours ago",
                icon: "satellite"
            }
        ]
    };
    
    // Return news for current category, or general news if category not found
    return newsDatabase[category] || newsDatabase.general;
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
// SIDEBAR FUNCTIONALITY
// ============================================

function initSidebar() {
    loadTrendingNews();
    initNewsletter();
}

function loadTrendingNews() {
    // Mock trending data
    const trendingData = [
        { rank: 1, title: "City Council Tax Changes Explained", views: "12.4K" },
        { rank: 2, title: "Weekend Weather: What to Expect", views: "9.7K" },
        { rank: 3, title: "Local Election Results Analysis", views: "8.2K" },
        { rank: 4, title: "Best Independent Cafés in Birmingham", views: "7.5K" },
        { rank: 5, title: "Transport Strikes: Alternative Routes", views: "6.9K" }
    ];
    
    // Clear existing content
    trendingList.innerHTML = '';
    
    // Generate trending items
    trendingData.forEach(item => {
        const trendingItem = document.createElement('div');
        trendingItem.className = 'trending-item';
        trendingItem.innerHTML = `
            <div class="trending-rank">${item.rank}</div>
            <div class="trending-content">
                <h4>${item.title}</h4>
                <div class="trending-stats">
                    <span><i class="far fa-eye"></i> ${item.views} views</span>
                </div>
            </div>
        `;
        
        // Add click event
        trendingItem.addEventListener('click', () => {
            alert(`Opening trending article: "${item.title}"`);
        });
        
        trendingList.appendChild(trendingItem);
    });
}

function initNewsletter() {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        if (validateEmail(email)) {
            // Simulate newsletter subscription
            emailInput.value = '';
            
            // Show success message
            showNotification('Thank you for subscribing to BhamPulse newsletter!');
        } else {
            // Show error message
            emailInput.focus();
            showNotification('Please enter a valid email address', 'error');
        }
    });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================
// QUICK LINKS
// ============================================

function initQuickLinks() {
    weatherDetailsBtn.addEventListener('click', () => {
        alert('Opening detailed weather forecast and alerts...');
    });
    
    sportsHubBtn.addEventListener('click', () => {
        alert('Navigating to Sports Hub with live scores and highlights...');
    });
    
    localNewsBtn.addEventListener('click', () => {
        alert('Loading Birmingham-specific local news...');
    });
    
    businessNewsBtn.addEventListener('click', () => {
        alert('Opening business section with market updates...');
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
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
                top: 100px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : '#ef4444'};
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
    
    // Add slideOut keyframes
    if (!document.querySelector('#notification-animations')) {
        const animations = document.createElement('style');
        animations.id = 'notification-animations';
        animations.textContent = `
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(animations);
    }
}

// ============================================
// ADDITIONAL ENHANCEMENTS
// ============================================

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Add active state to nav based on scroll position
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 150;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            const correspondingNavLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            if (correspondingNavLink && !correspondingNavLink.classList.contains('active')) {
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                correspondingNavLink.classList.add('active');
            }
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape to close mobile menu
    if (e.key === 'Escape' && mainNav.classList.contains('active')) {
        mainNav.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
});

// Add loading animation for images
document.addEventListener('DOMContentLoaded', function() {
    const cardImages = document.querySelectorAll('.card-image i');
    cardImages.forEach(icon => {
        // Add subtle animation
        icon.style.transition = 'all 0.3s ease';
        
        // Add hover effect
        const parentCard = icon.closest('.news-card');
        if (parentCard) {
            parentCard.addEventListener('mouseenter', () => {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            });
            
            parentCard.addEventListener('mouseleave', () => {
                icon.style.transform = 'scale(1) rotate(0)';
            });
        }
    });
});

// Initialize weather with random variations for realism
function randomizeWeather() {
    // Random temperature between 10-18°C
    const temp = Math.floor(Math.random() * 9) + 10;
    currentTemp.textContent = `${temp}°C`;
    feelsLike.textContent = `${temp - 1}°C`;
    
    // Random wind speed between 8-20 km/h
    const wind = Math.floor(Math.random() * 13) + 8;
    windSpeed.textContent = `${wind} km/h`;
    
    // Random humidity between 60-80%
    const humid = Math.floor(Math.random() * 21) + 60;
    humidity.textContent = `${humid}%`;
}

// Update weather every hour for realism
setInterval(randomizeWeather, 60 * 60 * 1000);

// Initialize with random weather
setTimeout(randomizeWeather, 1000);

console.log('BhamPulse News Hub successfully loaded!');
