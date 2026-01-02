console.log("X Video Downloader: Main world script loaded.");

// Helper to find the React Fiber key
function getReactFiber(dom) {
    const key = Object.keys(dom).find(key => key.startsWith("__reactFiber$"));
    return key ? dom[key] : null;
}

// Helper to find the React Props key
function getReactProps(dom) {
    const key = Object.keys(dom).find(key => key.startsWith("__reactProps$"));
    return key ? dom[key] : null;
}

// Traverse the Fiber tree to find the tweet data
function findTweetData(fiber) {
    let curr = fiber;
    let attempts = 0;
    while (curr && attempts < 50) { // Limit traversal to avoid infinite loops
        const props = curr.memoizedProps;
        if (props) {
            // Direct check
            if (props.tweet) return props.tweet;
            if (props.focalTweet) return props.focalTweet;
            
            // Check children props if they exist (sometimes it's wrapped)
            if (props.children && props.children.props && props.children.props.tweet) {
                return props.children.props.tweet;
            }
        }
        curr = curr.return;
        attempts++;
    }
    return null;
}

// Listen for requests from content script
window.addEventListener("XVD_REQUEST_VIDEO", (event) => {
    console.log("XVD: Received request", event.detail);
    const { elementId } = event.detail;
    const element = document.querySelector(`[data-xvd-id="${elementId}"]`);
    
    if (!element) {
        console.error("XVD: Element not found", elementId);
        return;
    }

    const tweetArticle = element.closest('article');
    
    if (!tweetArticle) {
        console.error("XVD: Tweet article not found");
        return;
    }

    // Strategy 1: Check the article fiber
    let fiber = getReactFiber(tweetArticle);
    let tweetData = fiber ? findTweetData(fiber) : null;

    // Strategy 2: If not found, try to find the video component specifically
    if (!tweetData) {
        console.log("XVD: Tweet data not found on article, trying video component...");
        const videoComponent = tweetArticle.querySelector('[data-testid="videoComponent"]');
        if (videoComponent) {
            fiber = getReactFiber(videoComponent);
            if (fiber) tweetData = findTweetData(fiber);
        }
    }

    // Strategy 3: Try to find any element with data-testid="tweet"
    if (!tweetData) {
         console.log("XVD: Still not found, trying tweet container...");
         const tweetContainer = tweetArticle.querySelector('[data-testid="tweet"]');
         if (tweetContainer) {
             fiber = getReactFiber(tweetContainer);
             if (fiber) tweetData = findTweetData(fiber);
         }
    }
    
    if (tweetData) {
        console.log("XVD: Tweet data found", tweetData);
        processTweetData(tweetData, elementId);
    } else {
        console.error("XVD: Failed to find tweet data after all strategies.");
    }
});

function processTweetData(tweet, elementId) {
    // Look for video info
    // tweet.legacy.extended_entities.media[0].video_info.variants
    
    let media = tweet.extended_entities?.media || tweet.legacy?.extended_entities?.media;
    
    if (!media || media.length === 0) {
        console.log("XVD: No media found in tweet data");
        return;
    }

    const videoMedia = media.find(m => m.type === 'video' || m.type === 'animated_gif');
    
    if (!videoMedia || !videoMedia.video_info || !videoMedia.video_info.variants) {
        console.log("XVD: No video info found");
        return;
    }

    // Find the best quality MP4
    const variants = videoMedia.video_info.variants;
    const mp4Variants = variants.filter(v => v.content_type === 'video/mp4');
    
    if (mp4Variants.length === 0) {
        console.log("XVD: No MP4 variants found");
        return;
    }

    // Sort by bitrate (highest first)
    mp4Variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    
    const bestVariant = mp4Variants[0];
    
    // Send back to content script
    window.dispatchEvent(new CustomEvent("XVD_RESPONSE_VIDEO", {
        detail: {
            elementId: elementId,
            url: bestVariant.url,
            filename: `twitter_video_${tweet.rest_id || Date.now()}.mp4`
        }
    }));
}
