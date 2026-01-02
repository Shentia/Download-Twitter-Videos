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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
