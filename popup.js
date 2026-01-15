document.addEventListener('DOMContentLoaded', () => {
    // Display version
    const manifest = chrome.runtime.getManifest();
    const versionElement = document.getElementById('version');
    if (versionElement) {
        versionElement.textContent = `v${manifest.version}`;
    }

    // Handle links
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: link.href });
        });
    });

    // Navigation logic
    const mainView = document.getElementById('main-view');
    const automationView = document.getElementById('automation-view');
    const showAutoBtn = document.getElementById('showAutoBtn');
    const backBtn = document.getElementById('backBtn');

    showAutoBtn.addEventListener('click', () => {
        mainView.classList.add('hidden');
        automationView.classList.remove('hidden');
    });

    backBtn.addEventListener('click', () => {
        automationView.classList.add('hidden');
        mainView.classList.remove('hidden');
    });

    // Automation logic
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const hashtag1Input = document.getElementById('hashtag1');
    const hashtag2Input = document.getElementById('hashtag2');
    const hashtag3Input = document.getElementById('hashtag3');
    const commentInput = document.getElementById('commentInput');
    const statusDiv = document.getElementById('status');

    // Load saved settings
    chrome.storage.local.get(['hashtags', 'comment', 'isAutomating'], (result) => {
        if (result.hashtags && Array.isArray(result.hashtags)) {
            hashtag1Input.value = result.hashtags[0] || '';
            hashtag2Input.value = result.hashtags[1] || '';
            hashtag3Input.value = result.hashtags[2] || '';
        }
        if (result.comment) commentInput.value = result.comment;
        updateStatus(result.isAutomating);
    });

    function updateStatus(isAutomating) {
        statusDiv.textContent = isAutomating ? "Status: Running..." : "Status: Stopped";
        startBtn.disabled = !!isAutomating;
        stopBtn.disabled = !isAutomating;
    }

    startBtn.addEventListener('click', () => {
        // Collect hashtags from inputs
        const hashtags = [
            hashtag1Input.value.trim(),
            hashtag2Input.value.trim(),
            hashtag3Input.value.trim()
        ].filter(h => h); // Remove empty strings

        const comment = commentInput.value;

        if (hashtags.length === 0) {
            statusDiv.textContent = "Please enter at least one hashtag.";
            return;
        }

        chrome.storage.local.set({ hashtags, comment, isAutomating: true });
        updateStatus(true);

        // Send message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "START_AUTOMATION",
                    hashtags: hashtags,
                    comment: comment
                });
            }
        });
    });

    stopBtn.addEventListener('click', () => {
        chrome.storage.local.set({ isAutomating: false });
        updateStatus(false);

        // Send message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "STOP_AUTOMATION" });
            }
        });
    });
});

