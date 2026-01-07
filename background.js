chrome.runtime.onInstalled.addListener(() => {
  console.log("X Video Downloader installed.");
  checkForUpdates();
});

const GITHUB_MANIFEST_URL = 'https://raw.githubusercontent.com/Shentia/Download-Twitter-Videos/main/manifest.json';

function compareVersions(v1, v2) {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const n1 = p1[i] || 0;
        const n2 = p2[i] || 0;
        if (n1 > n2) return 1;
        if (n1 < n2) return -1;
    }
    return 0;
}

async function checkForUpdates(specificTabId = null) {
    try {
        const response = await fetch(GITHUB_MANIFEST_URL);
        const data = await response.json();
        const latestVersion = data.version;
        const currentVersion = chrome.runtime.getManifest().version;

        if (compareVersions(latestVersion, currentVersion) > 0) {
            console.log(`Update available: ${latestVersion}`);
            
            const message = {
                action: "UPDATE_AVAILABLE",
                version: latestVersion
            };

            if (specificTabId) {
                chrome.tabs.sendMessage(specificTabId, message);
            } else {
                chrome.tabs.query({url: ["*://twitter.com/*", "*://x.com/*"]}, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, message);
                    });
                });
            }
        }
    } catch (error) {
        console.error("Failed to check for updates:", error);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "download") {
        // The sender object contains information about the tab that sent the message
        console.log("Downloading from tab:", sender.tab.id);
        
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: false,
            // Adding conflictAction can sometimes help with permission trust
            conflictAction: 'uniquify' 
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error("Download failed:", chrome.runtime.lastError.message);
                // If it fails, it might be because the URL is cross-origin 
                // and the background script needs to fetch it first.
            }
        });
        return true; // Keep the message channel open for async response
    } else if (request.action === "CHECK_UPDATE") {
        checkForUpdates(sender.tab ? sender.tab.id : null);
    }
});

chrome.downloads.onCreated.addListener((downloadItem) => {
    console.log("Download created:", downloadItem);
});
