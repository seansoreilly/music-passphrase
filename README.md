# Music Passphrase - AI Music Artist Passphrase Generator

## 📋 Project Overview

**Music Passphrase** is a modern web application built to generate secure, memorable passphrases using AI technology. This project leverages the Groq API to create human-readable passphrases based on user-provided music artist names and keywords.

This project is enhanced with **Task Master AI** for intelligent project management and development workflow optimization.

### 🎯 Core Functionality

- **Music Artist-based Generation**: Users input music artist names to generate contextually relevant passphrases.
- **Customization Options**:
  - Toggle to add numbers to passphrases.
  - Toggle to add special characters.
- **Multiple Outputs**: Generates 5 passphrases per request.
- **Copy to Clipboard**: One-click copying of generated passphrases.
- **Responsive UI**: Modern, mobile-friendly interface.

## 🏗️ Technical Architecture

### Frontend Stack

- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.1
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 3.4.11
- **Routing**: React Router DOM 6.26.2
- **State Management**: React Hook Form + Zod validation
- **HTTP Client**: TanStack React Query 5.56.2
- **AI Integration**: Groq SDK
- **Analytics**: Vercel Analytics
- **Backend**: Vercel Serverless Functions

### Development Tools

- **AI-Powered Project Management**: Task Master AI for intelligent task planning and execution
- **Code Generation**: Cursor AI integration for enhanced development workflow
- **Advanced Linting**: ESLint with React-specific rules
- **Type Safety**: Full TypeScript implementation with strict configuration

## 📁 Project Structure

```
music-passphrase/
├── .taskmaster/             # Task Master AI project management
│   ├── config.json          # AI model configuration
│   ├── tasks/               # Task definitions and tracking
│   ├── reports/             # Complexity analysis reports
│   ├── templates/           # Project templates and examples
│   └── docs/                # Project documentation
├── src/
│   ├── api/                 # API integration layer
│   │   └── generate.ts      # Passphrase generation logic
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── pages/
│   │   ├── Index.tsx        # Main application page
│   │   └── NotFound.tsx     # 404 page
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Application entry point
├── api/                     # Vercel serverless functions
│   └── generate-passphrases.ts # Backend API endpoint
├── public/                  # Static assets
├── doc/                     # Project documentation
├── .vercel/                 # Vercel deployment configuration and cache
└── logs/                    # Application logs
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ & npm (or yarn/pnpm)
- A Groq API Key

### Environment Setup

#### 1. Get a Groq API Key

- Go to [console.groq.com](https://console.groq.com)
- Sign up or log in
- Navigate to the API Keys section
- Create a new API key and copy it

#### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here

# Optional: Analytics
VERCEL_ANALYTICS_ID=your_vercel_analytics_id

# Optional: Maximum passphrase length (defaults to 40)
MAX_PASSPHRASE_LENGTH=40
VITE_MAX_PASSPHRASE_LENGTH=40
```

**For Vercel Deployment:**

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add your environment variables for all environments (Production, Preview, Development)

### Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/seansoreilly/music-passphrase.git
   cd music-passphrase
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:8080/` (or the port shown in your terminal).

### Available Scripts

- `npm run dev`: Starts the development server
- `npm run build`: Builds the application for production
- `npm run build:dev`: Builds the application in development mode
- `npm run lint`: Lints the codebase using ESLint
- `npm run preview`: Serves the production build locally for preview

## 🤖 AI-Powered Development

This project utilizes advanced AI tools for enhanced development:

### Task Master AI Integration

- **Intelligent Task Planning**: Automated task breakdown and dependency management
- **Complexity Analysis**: AI-powered assessment of task complexity
- **Progress Tracking**: Automated progress monitoring and reporting
- **Research-Backed Development**: Integration with AI research capabilities

To work with Task Master:

- Task definitions are stored in `.taskmaster/tasks/`
- Use the integrated AI tools for task management
- Configuration is managed through `.taskmaster/config.json`

### Development Workflow

1. **Task Planning**: AI generates and organizes development tasks
2. **Implementation**: Code generation with AI assistance
3. **Testing**: Automated testing strategy generation
4. **Documentation**: AI-assisted documentation updates

## 🔧 Current Implementation Status

### ✅ Completed Features

- Modern React application with TypeScript
- Comprehensive UI component library from shadcn/ui
- Responsive design implemented with Tailwind CSS
- Form handling and validation using React Hook Form and Zod
- Toast notifications for user feedback
- Copy-to-clipboard functionality for generated passphrases
- Vercel deployment configuration
- Integration with Groq API for passphrase generation
- Fallback to mock passphrase generation if API fails
- AI-powered project management with Task Master
- Advanced development tooling integration

### 🔌 API Integration Details

**Endpoint**: `/api/generate-passphrases`

- **Method**: POST
- **Model**: Mixtral-8x7B-32768 (via Groq)
- **Fallback**: Mock generation on API failure

**Request Format**:

```json
{
  "keywords": "your music artist here",
  "addNumber": true,
  "addSpecialChar": false
}
```

**Response Format**:

```json
{
  "passphrases": [
    "Artist-inspired-passphrase-1",
    "Artist-inspired-passphrase-2"
    // ... up to 5 passphrases
  ],
  "success": true
}
```

## 🚀 Deployment

This project is optimized for deployment on Vercel:

1. **Environment Variables**: Set your `GROQ_API_KEY` in Vercel project settings
2. **Automatic Deployment**: Connected to GitHub for automatic deployments
3. **Build Configuration**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework: Vite

## 🔮 Future Development

### Planned Enhancements

1. **Enhanced AI Features**:

   - Multiple AI model support
   - Advanced passphrase customization
   - Intelligent strength analysis

2. **User Experience**:

   - User accounts and passphrase history
   - Export functionality (TXT, CSV, JSON)
   - Advanced customization options
   - Passphrase strength visualization

3. **Backend Improvements**:

   - Supabase integration for data persistence
   - Advanced error handling and logging
   - API rate limiting and caching

4. **Development Tools**:
   - Automated testing suite
   - Performance monitoring
   - Advanced analytics integration

## 🤝 Contributing

Contributions are welcome! This project uses AI-assisted development:

1. **Task Management**: Check `.taskmaster/tasks/` for current development tasks
2. **Code Standards**: Follow the established TypeScript and React patterns
3. **AI Integration**: Leverage the Task Master AI tools for planning and implementation

## 📄 License

This project is under the MIT License.

---

_Generate secure, memorable passphrases from your favorite music artists with AI-powered intelligence._
