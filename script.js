async function fetchNewsFromRSS() {
    try {
        // BBC England ka RSS feed
        const rssUrl = 'https://feeds.bbci.co.uk/news/england/rss.xml';
        // RSS feed ko JSON mein convert karne ke liye free service
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            // News ko apne format mein show karo
            const rssArticles = data.items.map(item => ({
                title: item.title,
                description: item.description,
                url: item.link,
                urlToImage: item.enclosure?.link || getDefaultImage(), // Image agar hai toh
                publishedAt: item.pubDate,
                source: { name: 'BBC News' }
            }));
            // Apne news container ko update karo
            displayNews(rssArticles);
            showNotification('BBC News loaded successfully!', 'success');
        }
    } catch (error) {
        console.error('RSS Error:', error);
        showNotification('RSS feed load nahi hua. Sample news dikha raha hoon.', 'info');
        loadSampleData(); // Tumhara existing backup function
    }
}
