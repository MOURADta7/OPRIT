# ORBIT - AI Command Center for Digital Sales

A privacy-first Chrome extension that transforms your sales dashboard into an AI-powered command center.

## Features

- **AI-Powered Replies** - Generate contextual responses to customer comments
- **Usage Monitoring** - Track API costs across multiple providers (OpenAI, Claude, Gemini, Groq)
- **Smart Routing** - Automatically use the most cost-effective AI model
- **Budget Control** - Set spending limits with automatic enforcement
- **Live Price Display** - Show RED pricing overlays to boost conversions
- **Sales Analytics** - AI-powered insights from your sales data
- **100% Local** - All data stays on your device, encrypted

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- Chrome Extension Manifest V3
- IndexedDB for local storage
- Web Crypto API for AES-256 encryption

## Installation

### Development

1. Clone the repository:
```bash
git clone <repository-url>
cd orbit-extension
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `dist` folder

5. The ORBIT icon will appear in your toolbar

### Production Build

```bash
npm run build
```

The extension will be built in the `dist` folder, ready for Chrome Web Store submission.

## Configuration

1. **Add API Keys:**
   - Click the ORBIT icon in your toolbar
   - Go to Settings → API Keys
   - Add your API keys for:
     - OpenAI (platform.openai.com)
     - Anthropic Claude (console.anthropic.com)
     - Google Gemini (makersuite.google.com) - FREE
     - Groq (console.groq.com) - FREE

2. **Set Budget:**
   - Go to Settings → Budget
   - Set your monthly limit (default: $10)
   - Set warning threshold (default: 80%)

3. **Configure Price Display:**
   - Go to Price Display tab
   - Enable the feature
   - Choose color (Red recommended for urgency)

## Privacy & Security

- **Zero Data Collection** - We never collect or store your data
- **Local Encryption** - API keys encrypted with AES-256
- **No Server** - Everything processes in your browser
- **Open Source** - Code is auditable

## Supported Platforms

- AppSumo (Marketplace Dashboard)
- Gumroad (Sales Platform)
- Lemon Squeezy (Digital Store)
- Shopify (E-commerce Platform)

## Cost Comparison

| User Type | Monthly Cost | vs Traditional SaaS |
|-----------|--------------|---------------------|
| Light | $0.50-1.20 | vs $50-100/month |
| Medium | $2-5 | vs $99/month |
| Heavy | $6-12 | vs $200/month |
| Power | $15-25 | vs $500/month |

## File Structure

```
orbit-extension/
├── src/
│   ├── background/
│   │   └── background.ts       # Service worker
│   ├── content/
│   │   ├── content.ts          # Content script
│   │   ├── content.css         # Content styles
│   │   └── domSelectors.ts     # Platform selectors
│   ├── popup/
│   │   ├── popup.tsx           # Popup UI
│   │   ├── popup.html
│   │   └── popup.css
│   ├── components/
│   │   ├── UsageMonitor.tsx    # Usage dashboard
│   │   ├── CommentManager.tsx  # Reply generator
│   │   ├── Settings.tsx        # Settings UI
│   │   ├── PriceDisplay.tsx    # Price overlay
│   │   └── Analytics.tsx       # Analytics dashboard
│   ├── lib/
│   │   ├── aiRouter.ts         # Multi-AI routing
│   │   ├── encryption.ts       # AES-256 encryption
│   │   └── storage.ts          # IndexedDB wrapper
│   ├── types/
│   │   └── index.ts            # TypeScript definitions
│   └── utils/
│       ├── platformDetector.ts # Platform detection
│       ├── costCalculator.ts   # Cost calculations
│       └── logger.ts           # Debug logging
├── manifest.json
├── package.json
├── tsconfig.json
├── webpack.config.js
└── tailwind.config.js
```

## API Providers

### OpenAI
- Models: GPT-4 Turbo, GPT-3.5
- Cost: $0.01-0.03 per 1K tokens
- Website: platform.openai.com

### Anthropic Claude
- Models: Claude Sonnet 4
- Cost: $0.003-0.015 per 1K tokens
- Website: console.anthropic.com

### Google Gemini
- Models: Gemini Pro
- Cost: FREE (100K requests/month)
- Website: makersuite.google.com

### Groq
- Models: Llama 70B
- Cost: FREE (1K requests/day)
- Website: console.groq.com

## Development

### Available Scripts

- `npm run dev` - Build in watch mode
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checker

### Adding a New Feature

1. Create component in `src/components/`
2. Add types to `src/types/index.ts`
3. Update popup navigation in `src/popup/popup.tsx`
4. Build and test

### Testing

1. Load extension in Chrome
2. Navigate to a supported platform
3. Open browser console to see logs
4. Use the extension features

## Chrome Web Store Submission

1. Update version in `manifest.json`
2. Run production build: `npm run build`
3. Zip the `dist` folder
4. Go to Chrome Web Store Developer Dashboard
5. Upload the zip file
6. Fill in store listing details
7. Submit for review

### Required Permissions

- `storage` - Store settings and data locally
- `activeTab` - Interact with current page
- `scripting` - Inject content scripts
- `host_permissions` - Connect to AI APIs

## License

MIT License - See LICENSE file

## Support

For issues and feature requests, please use GitHub Issues.

## Roadmap

- [ ] Advanced analytics with charts
- [ ] Churn prediction
- [ ] Feature ROI calculator
- [ ] Competitor tracking
- [ ] Multi-language support
- [ ] Team collaboration

---

**Privacy First. AI Powered. Zero Markup.**