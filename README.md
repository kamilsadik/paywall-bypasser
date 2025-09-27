# Paywall Bypasser

A Chrome extension that automatically redirects paywalled news websites to their archive.ph versions, allowing you to read articles without subscription barriers.

## Features

- **Automatic Redirection**: Automatically redirects paywalled sites to archive.ph
- **Manual Mode**: Option to show a button instead of auto-redirecting
- **Paywall Detection**: Detects and removes common paywall elements
- **Extensive Site Support**: Supports 50+ major news websites
- **Easy Toggle**: Quick enable/disable from popup
- **Clean UI**: Modern, user-friendly interface

## Supported Sites

- **Major Newspapers**: New York Times, Wall Street Journal, Washington Post, Financial Times, The Economist
- **Tech Publications**: Wired, TechCrunch, The Verge, Ars Technica
- **Business**: Bloomberg, Fortune, Business Insider, Forbes
- **International**: The Guardian, BBC, Telegraph, Le Monde
- **Science**: Scientific American, National Geographic, Nature
- And many more...

## Installation

### From Source (Developer Mode)

1. **Download the Extension**
   ```bash
   git clone https://github.com/kamilsadik/paywall-bypasser.git
   cd paywall-bypasser
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `paywall-bypasser` folder
   - The extension should now appear in your extensions list

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Pin "Paywall Bypasser" for easy access

## Usage

### Automatic Mode (Default)
- Visit any supported paywalled website
- The extension automatically redirects to archive.ph
- No user interaction required

### Manual Mode
- Enable "Manual Mode" in extension popup
- Visit a paywalled website
- Click the floating "View on Archive.ph" button
- Or click the extension icon in toolbar

### Extension Popup
- Click the extension icon to open settings
- Toggle extension on/off
- Switch between automatic and manual modes
- Manually archive any page

## How It Works

The extension uses multiple approaches to bypass paywalls:

1. **URL Redirection**: Redirects known paywalled sites to archive.ph
2. **Content Script**: Detects and removes paywall elements on the page
3. **Declarative Net Requests**: Fast, efficient redirects using Chrome's API
4. **Element Detection**: Removes blur effects, overlays, and subscription prompts

## Privacy

- **No Data Collection**: The extension doesn't collect or transmit any personal data
- **Local Storage Only**: Settings are stored locally in your browser
- **No External Servers**: All processing happens locally
- **Open Source**: Full source code available for review

## Development

### File Structure
```
paywall-bypasser/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for redirects
├── content.js            # Content script for paywall detection
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── paywall-sites.js      # List of supported sites
├── rules.json            # Declarative net request rules
└── README.md             # This file
```

### Adding New Sites

To add support for a new paywalled site:

1. **Add to Site List**: Edit `paywall-sites.js` and add the domain to `PAYWALLED_SITES` array
2. **Add Redirect Rule**: Edit `rules.json` and add a new rule with unique ID
3. **Test**: Load the extension and test the new site

### Building for Production

1. **Test the Extension**
   - Load in developer mode
   - Test on various paywalled sites
   - Verify popup functionality

2. **Package for Distribution**
   - Zip the entire folder (excluding .git)
   - Submit to Chrome Web Store (if desired)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Legal Notice

This extension is for educational purposes. Please respect content creators and consider subscribing to publications you read regularly. The extension simply redirects to publicly available archived versions of articles.

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Extension Not Working
- Check if developer mode is enabled
- Reload the extension from chrome://extensions/
- Check browser console for errors

### Sites Not Redirecting
- Verify the site is in the supported list
- Check if extension is enabled
- Try manual mode if automatic fails

### Popup Not Opening
- Check if extension is properly loaded
- Look for errors in extension's service worker console

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing issues first
- Provide detailed reproduction steps