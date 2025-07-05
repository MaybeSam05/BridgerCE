# BridgerCE - LinkedIn Automation Tool

A powerful Chrome extension that automates LinkedIn networking by extracting profile data and generating personalized connection emails using AI. Perfect for professionals looking to expand their network efficiently and authentically.

## ✨ Features

### 🤖 AI-Powered Email Generation

- **Smart Profile Analysis**: Uses ChatGPT to analyze both your profile and your target's profile
- **Genuine Connection Points**: Identifies real connections (education, work experience, industries, locations, interests)
- **Professional Templates**: Generates warm, authentic emails for 15-minute coffee chats
- **Word Limit**: Keeps emails concise and professional (under 150 words)

### 📊 LinkedIn Integration

- **Profile Data Extraction**: Automatically extracts and stores your LinkedIn profile information
- **Target Profile Analysis**: Extracts connection target's profile data for analysis
- **Smart Text Processing**: Cleans and processes profile text for optimal AI analysis

### 📧 Gmail Integration

- **Direct Email Sending**: Send emails directly through Gmail API
- **Secure OAuth**: Uses Google OAuth for secure authentication
- **Email Editing**: Review and edit generated emails before sending
- **Professional Formatting**: Automatic line breaks for better readability

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd BridgerCE
npm install
```

### 2. Set Up Your Configuration

Create your `src/config.ts` file:

```typescript
// Configuration file for API keys and settings
export const config = {
  // Replace with your actual OpenAI API key
  OPENAI_API_KEY: "your-openai-api-key-here",

  // ChatGPT API settings (recommended defaults)
  CHATGPT_MODEL: "gpt-4o-mini",
  CHATGPT_MAX_TOKENS: 300,
  CHATGPT_TEMPERATURE: 0.7,

  // Gmail API settings
  GMAIL_API_URL: "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",

  // LinkedIn settings
  LINKEDIN_PROFILE_REGEX: /^https:\/\/www\.linkedin\.com\/in\//,
};
```

### 3. Get Your API Keys

#### OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and replace `your-openai-api-key-here` in your config.ts

#### Google OAuth (Optional)

The extension comes pre-configured with OAuth credentials. If you need your own:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API and Google+ API
4. Create OAuth 2.0 credentials
5. Update the `client_id` in `public/manifest.json`

### 4. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `BridgerCE` folder
5. The extension should now appear in your extensions list

## 📖 How to Use

### Step 1: Set Your Profile Data

1. Click the BridgerCE extension icon
2. Sign in with Google
3. Navigate to your LinkedIn profile
4. Click "Set Info" in the extension popup
5. Your profile data will be stored locally for future use

### Step 2: Generate Connection Email

1. Navigate to a LinkedIn profile you want to connect with
2. Click "Get Connection Data" in the extension popup
3. The extension will:
   - Extract the target's profile data
   - Send both profiles to ChatGPT for analysis
   - Generate a personalized email with proper formatting

### Step 3: Send the Email

1. Review the generated email (it will have automatic line breaks)
2. Edit the email if needed
3. Enter the recipient's email address
4. Click "Send Email" to send via Gmail

## 🔧 Configuration Details

### ChatGPT Settings

- **Model**: `gpt-4o-mini` (recommended for cost and performance)
- **Max Tokens**: 300 (sufficient for email generation)
- **Temperature**: 0.7 (balanced creativity and consistency)

### Email Formatting

The extension automatically formats emails by:

- Adding line breaks after the first comma (greeting)
- Adding line breaks before the last comma (closing)
- Ensuring professional spacing throughout

## 🛡️ Privacy & Security

- **Local Storage**: All profile data is stored locally in Chrome storage
- **Secure OAuth**: Tokens are stored securely and only used for API calls
- **No Data Mining**: No data is sent to external servers except OpenAI API for email generation
- **Gmail Privacy**: Gmail API is only used to send emails, no data is read or stored

## 🔍 Troubleshooting

### Common Issues

| Issue                            | Solution                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| "Chrome tabs API not available"  | Make sure you're using the extension in Chrome browser                                     |
| "Page is not a LinkedIn profile" | Navigate to a LinkedIn profile page (URL should start with `https://www.linkedin.com/in/`) |
| "No OAuth token found"           | Try signing out and signing back in                                                        |
| "ChatGPT API errors"             | Check your API key in `src/config.ts`                                                      |
| "Gmail API error"                | Ensure Gmail API is enabled in your Google Cloud Console                                   |

### Development Commands

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Development mode with hot reload
npm run dev

# Type checking
npm run type-check
```

## 📋 Required Permissions

The extension requires these permissions for full functionality:

- `identity`: Google OAuth authentication
- `storage`: Local data storage
- `tabs` & `activeTab`: LinkedIn page access
- `scripting`: Content script injection
- `https://www.googleapis.com/*`: Google APIs
- `https://gmail.googleapis.com/*`: Gmail API
- `https://www.linkedin.com/*`: LinkedIn access
- `https://api.openai.com/*`: ChatGPT API

### OAuth Scopes

- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/gmail.send`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the ChatGPT API
- Google for Gmail API and OAuth services
- LinkedIn for their platform
- The open-source community for various tools and libraries

---

**Note**: This tool is designed for professional networking. Please use it responsibly and in accordance with LinkedIn's terms of service and professional etiquette.
