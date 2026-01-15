console.log("X Video Downloader: Content script loaded.");

// SVG Icon for the download button
const DOWNLOAD_ICON = `
<svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1xvli5t r-1hdv0qi">
    <g>
        <path d="M12 15.586l-4.293-4.293-1.414 1.414L12 18.414l5.707-5.707-1.414-1.414L12 15.586z"></path>
        <path d="M11 2h2v14h-2z"></path>
        <path d="M4 19h16v2H4z"></path>
    </g>
</svg>
`;

function createDownloadButton() {
    const div = document.createElement('div');
    div.className = 'css-1dbjc4n r-18u37iz r-1h0z5md r-13awgt0'; // Mimic Twitter's action bar item classes
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('data-testid', 'xvd-download-btn');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.cursor = 'pointer';
    div.style.marginLeft = '10px'; // Add some spacing
    div.style.position = 'relative'; // Ensure absolute children are contained

    div.innerHTML = `
        <div class="css-1dbjc4n r-xoduu5">
            <div class="css-1dbjc4n r-1niwhzg r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg"></div>
            ${DOWNLOAD_ICON}
        </div>
    `;
    
    // Add hover effect classes manually or rely on Twitter's global styles if they match
    // For simplicity, we use inline styles for the icon color in the SVG if needed, 
    // but usually Twitter icons inherit color. We might need to force a color.
    const svg = div.querySelector('svg');
    svg.style.height = '1.25em';
    svg.style.fill = 'currentColor';
    svg.style.color = 'rgb(113, 118, 123)'; // Default gray color for actions

    div.addEventListener('mouseenter', () => {
        svg.style.color = 'rgb(29, 155, 240)'; // Twitter Blue on hover
        div.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
        div.style.borderRadius = '9999px';
    });

    div.addEventListener('mouseleave', () => {
        svg.style.color = 'rgb(113, 118, 123)';
        div.style.backgroundColor = 'transparent';
    });

    return div;
}

function handleDownloadClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const btn = event.currentTarget;
    const article = btn.closest('article');
    
    if (!article) return;

    // Generate a unique ID for this interaction
    const uniqueId = 'xvd-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    btn.setAttribute('data-xvd-id', uniqueId);

    console.log("XVD: Requesting video for", uniqueId);
    
    // Visual feedback
    const originalColor = btn.querySelector('svg').style.color;
    btn.querySelector('svg').style.color = 'orange'; // Indicate loading

    // Listen for the response
    const responseHandler = (e) => {
        if (e.detail.elementId === uniqueId) {
            window.removeEventListener('XVD_RESPONSE_VIDEO', responseHandler);
            console.log("XVD: Received video URL", e.detail.url);
            
            // Restore color
            btn.querySelector('svg').style.color = 'green'; // Indicate success
            setTimeout(() => {
                 btn.querySelector('svg').style.color = originalColor;
            }, 2000);

            // Send to background script to download
            chrome.runtime.sendMessage({
                action: "download",
                url: e.detail.url,
                filename: e.detail.filename
            });
        }
    };

    window.addEventListener('XVD_RESPONSE_VIDEO', responseHandler);

    // Timeout fallback
    setTimeout(() => {
        window.removeEventListener('XVD_RESPONSE_VIDEO', responseHandler);
        if (btn.querySelector('svg').style.color === 'orange') {
             console.error("XVD: Request timed out");
             btn.querySelector('svg').style.color = 'red'; // Indicate error
        }
    }, 5000);

    // Dispatch request to main world script
    window.dispatchEvent(new CustomEvent('XVD_REQUEST_VIDEO', {
        detail: { elementId: uniqueId }
    }));
}

function injectButtons() {
    const articles = document.querySelectorAll('article');
    
    articles.forEach(article => {
        // Check if it has a video
        // Twitter videos usually have a specific testid or class, but checking for 'video' tag is safer
        // However, the video tag might not be loaded yet.
        // We can check for the "Play" button or specific container.
        // A safe bet is to look for the action bar and inject the button, 
        // then let the main script decide if there's a video when clicked.
        // OR, we can try to detect if it's a video tweet.
        
        // Let's look for the action bar group
        const actionBar = article.querySelector('[role="group"]');
        if (!actionBar) return;

        // Check if we already injected
        if (actionBar.querySelector('[data-testid="xvd-download-btn"]')) return;

        // Check if there is a video or gif in the article
        // This selector might need tuning as X changes classes often.
        // [data-testid="videoComponent"] is a good candidate.
        const hasVideo = article.querySelector('[data-testid="videoComponent"]') || article.querySelector('video');
        
        if (hasVideo) {
            const btn = createDownloadButton();
            btn.addEventListener('click', handleDownloadClick);
            
            // Append to the action bar. 
            // Usually the last item is Share, we can append after it.
            actionBar.appendChild(btn);
        }
    });
}

// Observer to handle infinite scroll
const observer = new MutationObserver((mutations) => {
    injectButtons();
});

function init() {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    injectButtons();
    // Check for updates
    chrome.runtime.sendMessage({ action: "CHECK_UPDATE" });
}

function showUpdateNotification(version) {
    if (document.getElementById('xvd-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'xvd-update-banner';
    banner.style.position = 'fixed';
    banner.style.bottom = '20px'; // Bottom right is less intrusive than top
    banner.style.right = '20px';
    banner.style.maxWidth = '300px';
    banner.style.backgroundColor = '#1d9bf0';
    banner.style.color = 'white';
    banner.style.zIndex = '9999';
    banner.style.padding = '15px';
    banner.style.borderRadius = '8px';
    banner.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    banner.style.animation = 'slideIn 0.3s ease-out';
    
    banner.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">Update Available</div>
        <div style="font-size: 13px; margin-bottom: 10px;">
            X Video Downloader v${version} is now available.
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <a href="https://github.com/Shentia/Download-Twitter-Videos" target="_blank" style="color: white; text-decoration: none; background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 4px; font-size: 12px;">Update Now</a>
            <span id="xvd-close-banner" style="cursor: pointer; font-size: 12px; opacity: 0.8;">Dismiss</span>
        </div>
    `;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(banner);

    document.getElementById('xvd-close-banner').addEventListener('click', () => {
        banner.remove();
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "UPDATE_AVAILABLE") {
        showUpdateNotification(request.version);
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// --- Automation Logic ---

let isAutomating = false;
let automationConfig = {
    hashtags: [],
    comment: ""
};

// Keep track of processed IDs to persist across re-renders
const processedTweetIds = new Set();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "START_AUTOMATION") {
        if (!isAutomating) {
            isAutomating = true;
            automationConfig.hashtags = request.hashtags;
            automationConfig.comment = request.comment;
            console.log("XVD: Automation started", automationConfig);
            processNextTweet();
        }
    } else if (request.action === "STOP_AUTOMATION") {
        isAutomating = false;
        console.log("XVD: Automation stopped");
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTweetId(article) {
    try {
        // Look for the timestamp link which contains /status/<ID>
        const timeElement = article.querySelector('time');
        if (timeElement) {
            const link = timeElement.closest('a');
            if (link) {
                const href = link.getAttribute('href');
                const match = href.match(/\/status\/(\d+)/);
                return match ? match[1] : null;
            }
        }
    } catch (e) {
        return null;
    }
    return null;
}


async function processNextTweet() {
    if (!isAutomating) return;

    // Find all retweet buttons that are eligible for interaction
    const retweetButtons = Array.from(document.querySelectorAll('[data-testid="retweet"]'));
    
    let targetButton = null;
    let targetArticle = null;
    let targetId = null;
    
    for (const btn of retweetButtons) {
        // Find the parent article to ensure we haven't processed this specific tweet instance
        const tweetArticle = btn.closest('article');
        
        if (tweetArticle) {
            const id = getTweetId(tweetArticle);
            
            // Check if we have processed this ID before
            // We use the ID if found, otherwise (failsafe) fallback to attribute
            if ((id && !processedTweetIds.has(id)) || (!id && !tweetArticle.hasAttribute('data-xvd-processed'))) {
                 targetButton = btn;
                 targetArticle = tweetArticle;
                 targetId = id;
                 
                 // Mark as processed
                 if(id) processedTweetIds.add(id);
                 tweetArticle.setAttribute('data-xvd-processed', 'true');
                 
                 break;
            }
        }
    }

    if (!targetButton) {
        console.log("XVD: No new tweets found in view, scrolling...");
        window.scrollBy(0, 1000); // Scroll down more aggressively
        await sleep(3000); // Wait longer for load
        processNextTweet(); // Retry
        return;
    }

    try {
        console.log(`XVD: Processing tweet ID: ${targetId}`);
        
        // Ensure the button is visible
        targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(1000);

        // 1. Click Repost (Retweet) Button
        targetButton.click();
        await sleep(1000); // Wait for menu

        // 2. Click Quote
        // Primary selector: specific testid
        let quoteBtn = document.querySelector('[data-testid="RetweetConfirm-quote"]');
        
        // Fallback: search menu items for text "Quote"
        if (!quoteBtn) {
             const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
             quoteBtn = menuItems.find(el => el.textContent.includes("Quote"));
        }

        if (!quoteBtn) {
            console.log("XVD: Could not find Quote button. Closing menu.");
            document.body.click(); // Click background to close
            await sleep(1000);
        } else {
            console.log("XVD: Clicking Quote...");
            quoteBtn.click();
            await sleep(2000); // Wait for modal

            // 3. Type text
            const textBox = document.querySelector('[data-testid="tweetTextarea_0"]');
            if (textBox) {
                // Combine all hashtags
                const allHashtags = automationConfig.hashtags
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0)
                    .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
                    .join(' ');
                
                const textToType = `${automationConfig.comment} ${allHashtags}`;
                
                // Focus and type
                textBox.focus();
                document.execCommand('insertText', false, textToType);
                
                await sleep(1500);
                
                // 4. Click Post
                const postButton = document.querySelector('[data-testid="tweetButton"]');
                if (postButton && !postButton.disabled) {
                    postButton.click();
                    console.log("XVD: Posted successfully.");
                    // After posting, wait a bit for the modal to close and the tweet to send
                    await sleep(3000);
                } else {
                    console.warn("XVD: Post button disabled or missing.");
                    // Attempt to close modal if we failed
                    const closeBtn = document.querySelector('[data-testid="app-bar-close"]');
                    if(closeBtn) closeBtn.click();
                }
            } else {
                 console.log("XVD: Could not find text box.");
                 // Close menu/modal if open?
                 document.body.click();
            }
        }

        
    } catch (e) {
        console.error("XVD: Error during automation step", e);
    }

    // Always scroll past the processed tweet to prepare for the next one
    if (targetArticle) {
        targetArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.scrollBy(0, 500); // Push it up and out, bringing new ones in
    }

    // Rate limiting: 10 times per minute = 6 seconds per action
    // We add a little random delay to be safe and more human-like (6s to 8s total cycle)
    if (isAutomating) {
        const delay = 6000 + Math.random() * 2000;
        console.log(`XVD: Waiting ${Math.round(delay/1000)}s before next action...`);
        await sleep(delay);
        processNextTweet();
    }
}
