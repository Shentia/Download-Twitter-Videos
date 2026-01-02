// Content Script - Injects sidebar and handles interaction with X
console.log('X Reply Assistant: Content script loaded');

// Inject sidebar into the page
function injectSidebar() {
    // Check if sidebar already exists
    if (document.getElementById('x-reply-sidebar-container')) {
        return;
    }

    // Create container
    const container = document.createElement('div');
    container.id = 'x-reply-sidebar-container';
    
    // Load sidebar HTML
    fetch(chrome.runtime.getURL('sidebar.html'))
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;
            document.body.appendChild(container);
            
            // Create toggle button
            createToggleButton();
            
            // Initialize sidebar functionality
            initializeSidebar();
        });
}

// Create toggle button to show/hide sidebar
function createToggleButton() {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'toggle-sidebar-btn';
    toggleBtn.innerHTML = '💬';
    toggleBtn.title = 'Toggle X Reply Assistant';
    
    toggleBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('x-reply-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('hidden');
        }
    });
    
    document.body.appendChild(toggleBtn);
}

// Initialize sidebar functionality
function initializeSidebar() {
    console.log('X Reply Assistant: Initializing sidebar');
    
    // Wait for sidebar.js to load
    // The actual logic is in sidebar.js which will be loaded via the HTML
}

// Wait for page to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSidebar);
} else {
    injectSidebar();
}

// Communication with sidebar
window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    if (event.data.type === 'X_REPLY_ASSISTANT') {
        handleMessage(event.data);
    }
});

function handleMessage(data) {
    switch (data.action) {
        case 'SCAN_TWEETS':
            scanTweets(data.mode, data.target);
            break;
        case 'REPLY_TO_TWEET':
            replyToTweet(data.tweetData, data.replyText);
            break;
    }
}

// Function to scan tweets based on mode
async function scanTweets(mode, target) {
    console.log('Scanning tweets:', mode, target);
    
    let tweets = [];
    
    try {
        if (mode === 'home') {
            tweets = await getHomeTimelineTweets();
        } else if (mode === 'user') {
            tweets = await getUserTweets(target);
        } else if (mode === 'search') {
            tweets = await getSearchTweets(target);
        }
        
        // Send results back to sidebar
        window.postMessage({
            type: 'X_REPLY_ASSISTANT_RESPONSE',
            action: 'TWEETS_SCANNED',
            tweets: tweets
        }, '*');
        
    } catch (error) {
        console.error('Error scanning tweets:', error);
        window.postMessage({
            type: 'X_REPLY_ASSISTANT_RESPONSE',
            action: 'ERROR',
            message: error.message
        }, '*');
    }
}

// Get tweets from home timeline
async function getHomeTimelineTweets() {
    const tweets = [];
    const tweetElements = document.querySelectorAll('article[data-testid="tweet"]');
    
    for (let i = 0; i < Math.min(10, tweetElements.length); i++) {
        const tweet = parseTweetElement(tweetElements[i]);
        if (tweet) {
            tweets.push(tweet);
        }
    }
    
    return tweets;
}

// Get tweets from specific user
async function getUserTweets(username) {
    // Check if we're on the user's profile
    const currentUrl = window.location.href;
    if (!currentUrl.includes(`/${username}`)) {
        throw new Error(`Please navigate to @${username}'s profile first`);
    }
    
    return await getHomeTimelineTweets();
}

// Get tweets from search
async function getSearchTweets(searchTerm) {
    const currentUrl = window.location.href;
    if (!currentUrl.includes('/search')) {
        throw new Error('Please navigate to the search page first');
    }
    
    return await getHomeTimelineTweets();
}

// Parse tweet element to extract data
function parseTweetElement(element) {
    try {
        // Get tweet text
        const tweetTextElement = element.querySelector('[data-testid="tweetText"]');
        const tweetText = tweetTextElement ? tweetTextElement.innerText : '';
        
        // Get author info
        const authorElement = element.querySelector('[data-testid="User-Name"]');
        let authorName = 'Unknown';
        let authorHandle = '';
        
        if (authorElement) {
            const nameElement = authorElement.querySelector('span');
            if (nameElement) {
                authorName = nameElement.innerText;
            }
            
            const handleElements = authorElement.querySelectorAll('span');
            for (let span of handleElements) {
                if (span.innerText.startsWith('@')) {
                    authorHandle = span.innerText;
                    break;
                }
            }
        }
        
        // Get reply button
        const replyButton = element.querySelector('[data-testid="reply"]');
        
        // Get tweet ID from element or URL
        const tweetLinks = element.querySelectorAll('a[href*="/status/"]');
        let tweetId = '';
        for (let link of tweetLinks) {
            const match = link.href.match(/\/status\/(\d+)/);
            if (match) {
                tweetId = match[1];
                break;
            }
        }
        
        return {
            id: tweetId,
            text: tweetText,
            author: authorName,
            handle: authorHandle,
            element: element,
            replyButton: replyButton
        };
    } catch (error) {
        console.error('Error parsing tweet:', error);
        return null;
    }
}

// Reply to a specific tweet
async function replyToTweet(tweetData, replyText) {
    try {
        // Find the tweet element
        const tweetElement = document.querySelector(`article[data-testid="tweet"]`);
        if (!tweetElement) {
            throw new Error('Tweet element not found');
        }
        
        // Click reply button
        const replyButton = tweetData.replyButtonSelector 
            ? document.querySelector(tweetData.replyButtonSelector)
            : tweetElement.querySelector('[data-testid="reply"]');
            
        if (!replyButton) {
            throw new Error('Reply button not found');
        }
        
        replyButton.click();
        
        // Wait for reply dialog to open
        await sleep(1000);
        
        // Find the reply text area
        const replyTextArea = document.querySelector('[data-testid="tweetTextarea_0"]');
        if (!replyTextArea) {
            throw new Error('Reply text area not found');
        }
        
        // Set the reply text
        replyTextArea.focus();
        document.execCommand('insertText', false, replyText);
        
        // Wait a bit
        await sleep(500);
        
        // Find and click the reply button in the dialog
        const sendButton = document.querySelector('[data-testid="tweetButton"]');
        if (!sendButton) {
            throw new Error('Send button not found');
        }
        
        sendButton.click();
        
        // Wait for tweet to be sent
        await sleep(1000);
        
        // Send success message
        window.postMessage({
            type: 'X_REPLY_ASSISTANT_RESPONSE',
            action: 'REPLY_SUCCESS',
            tweetId: tweetData.id
        }, '*');
        
    } catch (error) {
        console.error('Error replying to tweet:', error);
        window.postMessage({
            type: 'X_REPLY_ASSISTANT_RESPONSE',
            action: 'REPLY_ERROR',
            tweetId: tweetData.id,
            message: error.message
        }, '*');
    }
}

// Helper function to sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Store tweet data for replying
let currentTweets = [];

window.addEventListener('message', (event) => {
    if (event.data.type === 'X_REPLY_ASSISTANT_STORE_TWEETS') {
        currentTweets = event.data.tweets;
    }
});
