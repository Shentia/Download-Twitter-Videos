chrome.runtime.onInstalled.addListener(() => {
  console.log("X Video Downloader installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "download") {
        console.log("Downloading:", request.url);
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: false // Set to true if you want the user to choose location
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error("Download failed:", chrome.runtime.lastError);
            } else {
                console.log("Download started with ID:", downloadId);
            }
        });
    }
});

chrome.downloads.onCreated.addListener((downloadItem) => {
    console.log("Download created:", downloadItem);
});
