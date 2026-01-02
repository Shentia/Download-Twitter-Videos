# X Reply Assistant - Chrome Extension

A Chrome extension that helps you reply to multiple tweets on X (formerly Twitter) with custom messages.

## Features

✨ **Multiple Modes**
- Reply to 10 latest tweets from your home timeline
- Reply to 10 latest tweets from a specific user
- Reply to 10 latest tweets matching a search term

🔍 **Preview & Confirmation**
- See all tweets before replying
- Confirm each reply individually before posting
- Skip tweets you don't want to reply to

⏱️ **Safety Features**
- Configurable delays between replies (3-60 seconds)
- Prevents spam detection and account restrictions
- Stop button to halt the process anytime

📊 **Reply Logging**
- Keeps track of all replied tweets with timestamps
- Success/failure status for each reply
- Persistent log storage across sessions

🎨 **Modern UI**
- Sleek sidebar interface matching X's design
- Toggle button for easy show/hide
- Responsive and user-friendly controls

## Installation

### Method 1: Load Unpacked Extension (Development Mode)

1. **Download or Clone** this repository to your local machine

2. **Open Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode** by toggling the switch in the top-right corner

4. **Click "Load unpacked"** button

5. **Select the extension folder** (the directory containing `manifest.json`)

6. The extension should now appear in your Chrome toolbar! 🎉

### Method 2: Generate Icons (Optional)

If you want custom icons:
- Open `icons/create_icons.html` in a browser
- Icons will be automatically generated and downloaded
- Replace the existing icon files

## Usage

### Getting Started

1. **Navigate to X.com** (twitter.com or x.com)

2. **Click the 💬 button** that appears in the top-right corner of the page

3. The sidebar will slide in from the right

### Replying to Tweets

#### Home Timeline Mode
1. Select **"Home Timeline"** from the mode dropdown
2. Enter your reply message in the text area
3. Set delay between replies (default: 5 seconds)
4. Click **"Scan Tweets"**
5. Review the preview of 10 latest tweets
6. Click **"Start Replying"**
7. Confirm each reply individually

#### Specific User Mode
1. Navigate to the user's profile on X (e.g., x.com/username)
2. Select **"Specific User"** from the mode dropdown
3. Enter the username (without @)
4. Enter your reply message
5. Click **"Scan Tweets"**
6. Follow the confirmation prompts

#### Search Term Mode
1. Navigate to X's search page and search for your term
2. Select **"Search Term"** from the mode dropdown
3. Enter the search term
4. Enter your reply message
5. Click **"Scan Tweets"**
6. Follow the confirmation prompts

### Settings

- **Delay Between Replies**: Adjust from 3-60 seconds to avoid spam detection
- **Reply Message**: Customize your message for each batch of replies
- **Preview**: Always see which tweets you're about to reply to

### Safety Tips

⚠️ **Important Warnings**

- **Use Responsibly**: Bulk replying can trigger X's spam detection
- **Minimum Delay**: Keep delays at least 5 seconds between replies
- **Account Safety**: Don't reply to too many tweets in a short time
- **Content Policy**: Ensure your replies follow X's terms of service
- **Human-like Behavior**: Vary your messages and don't automate excessively

## File Structure

```
twitter/
├── manifest.json       # Extension configuration
├── content.js          # Main content script (DOM interaction)
├── sidebar.html        # Sidebar UI structure
├── sidebar.css         # Sidebar styling
├── sidebar.js          # Sidebar logic and event handlers
├── popup.html          # Extension popup window
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

## How It Works

1. **Content Script Injection**: When you visit X.com, the extension injects a sidebar into the page

2. **Tweet Detection**: The extension scans the DOM for tweet elements using X's data attributes

3. **User Interaction**: You select mode, enter details, and scan for tweets

4. **Preview System**: Found tweets are displayed with author and text preview

5. **Reply Process**: 
   - For each tweet, shows confirmation dialog
   - Clicks the reply button
   - Waits for reply dialog to open
   - Inserts your custom text
   - Clicks the send button
   - Waits for configured delay
   - Repeats for remaining tweets

6. **Logging**: All actions are logged with timestamps and stored in Chrome's local storage

## Troubleshooting

### Sidebar Not Appearing
- Refresh the X.com page
- Check if the extension is enabled in `chrome://extensions/`
- Look for the 💬 toggle button on the right side

### "Reply button not found" Error
- X frequently updates their website structure
- The extension may need updates to match new element selectors
- Try refreshing the page

### Tweets Not Scanning
- Ensure you're on the correct page for the selected mode
- For "Specific User" mode, navigate to the user's profile first
- For "Search" mode, perform a search on X first

### Replies Not Posting
- Check if you're logged into X
- Verify X's website hasn't changed its structure
- Try manually replying to confirm your account works
- Check browser console for errors (F12)

## Development

### Modifying the Extension

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Refresh the X.com page to see changes

### Debugging

- Open Developer Tools (F12) on X.com
- Check the Console tab for error messages
- Content script logs appear with prefix: "X Reply Assistant:"

### Key Functions

- `scanTweets()` - Detects tweets in current view
- `parseTweetElement()` - Extracts data from tweet DOM elements
- `replyToTweet()` - Automates the reply process
- `showConfirmation()` - Displays preview before each reply

## Limitations

- Only works on tweets visible in the current view
- Requires X's website structure (may break if X updates their site)
- No API access - relies on DOM manipulation
- Rate limited by X's posting restrictions
- Requires manual confirmation for each tweet

## Future Enhancements

Potential features for future versions:

- [ ] Custom reply templates with variables
- [ ] Filter tweets by language, keywords, or hashtags
- [ ] Schedule replies for specific times
- [ ] Import reply lists from CSV
- [ ] Export reply logs to file
- [ ] Dark/Light theme toggle
- [ ] Batch operations without confirmations (with safety warnings)
- [ ] Integration with X API (requires developer access)

## Privacy & Security

- ✅ No data is sent to external servers
- ✅ All data stored locally in Chrome's storage
- ✅ Only accesses X.com and x.com domains
- ✅ Open source - you can review all code
- ✅ No tracking or analytics

## Legal & Disclaimer

⚠️ **Use at Your Own Risk**

- This extension automates interactions with X (Twitter)
- Bulk actions may violate X's Terms of Service
- Your account could be suspended or banned
- The developers are not responsible for any account actions
- Use responsibly and ethically
- Always follow X's automation rules and guidelines

## License

This project is provided as-is for educational purposes.

## Support

For issues, questions, or contributions:
1. Check the Troubleshooting section
2. Review the code comments
3. Test in different scenarios
4. Consider X's API for production use

---

**Happy Tweeting! 🐦**

Remember: Use this tool responsibly and always follow X's terms of service.
