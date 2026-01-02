// Sidebar JavaScript - Handles UI logic and user interactions
console.log('X Reply Assistant: Sidebar JS loaded');

let scannedTweets = [];
let replyInProgress = false;
let stopRequested = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
    console.log('Initializing sidebar controls');
    
    // Get DOM elements
    const modeSelect = document.getElementById('mode-select');
    const userInputSection = document.getElementById('user-input-section');
    const searchInputSection = document.getElementById('search-input-section');
    const scanTweetsBtn = document.getElementById('scan-tweets-btn');
    const startReplyBtn = document.getElementById('start-reply-btn');
    const stopReplyBtn = document.getElementById('stop-reply-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const clearLogBtn = document.getElementById('clear-log-btn');
    
    // Mode selection change
    modeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        userInputSection.style.display = mode === 'user' ? 'block' : 'none';
        searchInputSection.style.display = mode === 'search' ? 'block' : 'none';
    });
    
    // Scan tweets button
    scanTweetsBtn.addEventListener('click', handleScanTweets);
    
    // Start reply button
    startReplyBtn.addEventListener('click', handleStartReply);
    
    // Stop button
    stopReplyBtn.addEventListener('click', handleStop);
    
    // Close sidebar
    closeSidebarBtn.addEventListener('click', () => {
        document.getElementById('x-reply-sidebar').classList.add('hidden');
    });
    
    // Clear log
    clearLogBtn.addEventListener('click', handleClearLog);
    
    // Load saved logs
    loadReplyLog();
    
    // Listen for messages from content script
    window.addEventListener('message', handleContentMessage);
}

// Handle scan tweets
function handleScanTweets() {
    const mode = document.getElementById('mode-select').value;
    const username = document.getElementById('username-input').value.trim();
    const searchTerm = document.getElementById('search-input').value.trim();
    const replyText = document.getElementById('reply-text').value.trim();
    
    // Validation
    if (!replyText) {
        updateStatus('Please enter a reply message', 'error');
        return;
    }
    
    if (mode === 'user' && !username) {
        updateStatus('Please enter a username', 'error');
        return;
    }
    
    if (mode === 'search' && !searchTerm) {
        updateStatus('Please enter a search term', 'error');
        return;
    }
    
    // Update status
    updateStatus('Scanning tweets...', 'loading');
    document.getElementById('start-reply-btn').disabled = true;
    document.getElementById('preview-section').style.display = 'none';
    
    // Send message to content script
    window.postMessage({
        type: 'X_REPLY_ASSISTANT',
        action: 'SCAN_TWEETS',
        mode: mode,
        target: mode === 'user' ? username : searchTerm
    }, '*');
}

// Handle start reply
async function handleStartReply() {
    if (scannedTweets.length === 0) {
        updateStatus('No tweets to reply to', 'error');
        return;
    }
    
    const replyText = document.getElementById('reply-text').value.trim();
    const delay = parseInt(document.getElementById('delay-input').value) * 1000;
    
    if (!replyText) {
        updateStatus('Please enter a reply message', 'error');
        return;
    }
    
    // Start replying
    replyInProgress = true;
    stopRequested = false;
    document.getElementById('start-reply-btn').style.display = 'none';
    document.getElementById('stop-reply-btn').style.display = 'block';
    document.getElementById('scan-tweets-btn').disabled = true;
    
    updateStatus('Starting reply process...', 'loading');
    
    for (let i = 0; i < scannedTweets.length; i++) {
        if (stopRequested) {
            updateStatus('Stopped by user', 'error');
            break;
        }
        
        const tweet = scannedTweets[i];
        updateProgress(`Replying to tweet ${i + 1}/${scannedTweets.length}`);
        
        // Show confirmation
        const confirmed = await showConfirmation(tweet, replyText, i + 1);
        
        if (!confirmed) {
            addLog(`Skipped tweet from ${tweet.author}`, 'info');
            continue;
        }
        
        // Send reply request
        window.postMessage({
            type: 'X_REPLY_ASSISTANT',
            action: 'REPLY_TO_TWEET',
            tweetData: tweet,
            replyText: replyText
        }, '*');
        
        // Wait for delay before next tweet
        if (i < scannedTweets.length - 1) {
            updateStatus(`Waiting ${delay / 1000}s before next reply...`, 'loading');
            await sleep(delay);
        }
    }
    
    // Finish
    replyInProgress = false;
    document.getElementById('start-reply-btn').style.display = 'block';
    document.getElementById('stop-reply-btn').style.display = 'none';
    document.getElementById('scan-tweets-btn').disabled = false;
    updateStatus('Reply process completed', 'success');
    updateProgress('');
}

// Handle stop
function handleStop() {
    stopRequested = true;
    document.getElementById('stop-reply-btn').disabled = true;
    updateStatus('Stopping...', 'loading');
}

// Show confirmation dialog
function showConfirmation(tweet, replyText, index) {
    return new Promise((resolve) => {
        const confirmed = confirm(
            `Reply ${index}:\n\n` +
            `Author: ${tweet.author} ${tweet.handle}\n` +
            `Tweet: ${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? '...' : ''}\n\n` +
            `Your reply: ${replyText}\n\n` +
            `Proceed with this reply?`
        );
        resolve(confirmed);
    });
}

// Handle messages from content script
function handleContentMessage(event) {
    if (event.data.type !== 'X_REPLY_ASSISTANT_RESPONSE') return;
    
    switch (event.data.action) {
        case 'TWEETS_SCANNED':
            handleTweetsScanned(event.data.tweets);
            break;
        case 'REPLY_SUCCESS':
            handleReplySuccess(event.data.tweetId);
            break;
        case 'REPLY_ERROR':
            handleReplyError(event.data.tweetId, event.data.message);
            break;
        case 'ERROR':
            handleError(event.data.message);
            break;
    }
}

// Handle tweets scanned
function handleTweetsScanned(tweets) {
    scannedTweets = tweets;
    
    if (tweets.length === 0) {
        updateStatus('No tweets found', 'error');
        return;
    }
    
    updateStatus(`Found ${tweets.length} tweets`, 'success');
    document.getElementById('start-reply-btn').disabled = false;
    
    // Show preview
    displayPreview(tweets);
}

// Display preview of tweets
function displayPreview(tweets) {
    const previewSection = document.getElementById('preview-section');
    const tweetList = document.getElementById('tweet-preview-list');
    
    tweetList.innerHTML = '';
    
    tweets.forEach((tweet, index) => {
        const tweetItem = document.createElement('div');
        tweetItem.className = 'tweet-item';
        tweetItem.innerHTML = `
            <div class="tweet-author">${tweet.author} ${tweet.handle}</div>
            <div class="tweet-text">${tweet.text || '(No text)'}</div>
            <div class="tweet-status pending">Pending</div>
        `;
        tweetList.appendChild(tweetItem);
    });
    
    previewSection.style.display = 'block';
}

// Handle reply success
function handleReplySuccess(tweetId) {
    const tweet = scannedTweets.find(t => t.id === tweetId);
    addLog(`✓ Successfully replied to tweet from ${tweet?.author || 'Unknown'}`, 'success');
}

// Handle reply error
function handleReplyError(tweetId, message) {
    const tweet = scannedTweets.find(t => t.id === tweetId);
    addLog(`✗ Failed to reply to tweet from ${tweet?.author || 'Unknown'}: ${message}`, 'error');
}

// Handle error
function handleError(message) {
    updateStatus(`Error: ${message}`, 'error');
    document.getElementById('start-reply-btn').disabled = false;
}

// Update status text
function updateStatus(text, type = 'info') {
    const statusText = document.getElementById('status-text');
    statusText.textContent = text;
    statusText.style.color = type === 'error' ? '#f4212e' : type === 'success' ? '#00ba7c' : '#1d9bf0';
}

// Update progress text
function updateProgress(text) {
    document.getElementById('progress-text').textContent = text;
}

// Add log entry
function addLog(message, type = 'info') {
    const logContent = document.getElementById('reply-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `
        <div class="log-time">${time}</div>
        <div class="log-message">${message}</div>
    `;
    
    logContent.insertBefore(entry, logContent.firstChild);
    
    // Save to storage
    saveLogEntry({ message, type, time });
}

// Save log entry to storage
function saveLogEntry(entry) {
    chrome.storage.local.get(['replyLog'], (result) => {
        const log = result.replyLog || [];
        log.unshift(entry);
        
        // Keep only last 50 entries
        if (log.length > 50) {
            log.splice(50);
        }
        
        chrome.storage.local.set({ replyLog: log });
    });
}

// Load reply log from storage
function loadReplyLog() {
    chrome.storage.local.get(['replyLog'], (result) => {
        const log = result.replyLog || [];
        const logContent = document.getElementById('reply-log');
        
        if (log.length === 0) {
            logContent.innerHTML = '<div class="empty-state">No replies yet</div>';
            return;
        }
        
        log.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = `log-entry ${entry.type}`;
            entryDiv.innerHTML = `
                <div class="log-time">${entry.time}</div>
                <div class="log-message">${entry.message}</div>
            `;
            logContent.appendChild(entryDiv);
        });
    });
}

// Clear log
function handleClearLog() {
    if (confirm('Clear all reply logs?')) {
        chrome.storage.local.set({ replyLog: [] });
        document.getElementById('reply-log').innerHTML = '<div class="empty-state">No replies yet</div>';
    }
}

// Helper sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
