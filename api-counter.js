// Add this script in your index.html before </body>
// <script src="api-counter.js"></script>

class APICounter {
    constructor() {
        this.today = new Date().toDateString();
        this.loadCount();
        this.createMeter();
        this.updateMeter();
    }
    
    loadCount() {
        const saved = localStorage.getItem('apiCounter');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.date === this.today) {
                this.count = data.count;
            } else {
                this.count = 0; // Reset for new day
            }
        } else {
            this.count = 0;
        }
    }
    
    increment() {
        this.count++;
        this.saveCount();
        this.updateMeter();
        
        // Warning at 80 requests
        if (this.count === 80) {
            this.showAlert('Warning: 20 API requests left for today');
        }
        
        // Stop at 100
        if (this.count >= 100) {
            this.showAlert('Daily limit reached (100/100). Try again tomorrow.');
            // Disable refresh button
            document.getElementById('refreshBtn').disabled = true;
        }
    }
    
    saveCount() {
        const data = {
            date: this.today,
            count: this.count
        };
        localStorage.setItem('apiCounter', JSON.stringify(data));
    }
    
    createMeter() {
        const meter = document.createElement('div');
        meter.className = 'api-meter';
        meter.innerHTML = `
            <div class="meter-label">
                <span>API Usage</span>
                <span id="apiCount">0/100</span>
            </div>
            <div class="meter-bar">
                <div class="meter-fill" id="meterFill"></div>
            </div>
            <div class="meter-stats">
                <span>Free Plan</span>
                <span id="apiPercentage">0%</span>
            </div>
            <div style="font-size:10px; color:#666; margin-top:5px;">
                Resets at midnight
            </div>
        `;
        document.body.appendChild(meter);
    }
    
    updateMeter() {
        const percentage = Math.min((this.count / 100) * 100, 100);
        document.getElementById('apiCount').textContent = `${this.count}/100`;
        document.getElementById('meterFill').style.width = `${percentage}%`;
        document.getElementById('apiPercentage').textContent = `${Math.round(percentage)}%`;
        
        // Change color based on usage
        const fill = document.getElementById('meterFill');
        if (percentage < 70) {
            fill.style.background = 'var(--accent)'; // Green
        } else if (percentage < 90) {
            fill.style.background = '#ff9800'; // Orange
        } else {
            fill.style.background = 'var(--secondary)'; // Red
        }
    }
    
    showAlert(message) {
        // Use your notification system
        if (typeof showNotification === 'function') {
            showNotification(message, 'warning');
        } else {
            alert(message);
        }
    }
}

// Initialize counter
const apiCounter = new APICounter();

// Modify your fetch function to count API calls
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (url.includes('newsapi.org') && !url.includes('corsproxy')) {
        apiCounter.increment();
    }
    return originalFetch(url, options);
};
