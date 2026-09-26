import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { execSync } from "child_process";

function getBuildInfo() {
  // Multi-environment git commit hash resolution
  function getGitCommitHash() {
    // Priority 1: Vercel deployment environment
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      const shortHash = process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
      console.log("Using Vercel commit hash:", shortHash);
      return shortHash;
    }

    // Priority 2: GitHub Actions environment
    if (process.env.GITHUB_SHA) {
      const shortHash = process.env.GITHUB_SHA.substring(0, 7);
      console.log("Using GitHub Actions commit hash:", shortHash);
      return shortHash;
    }

    // Priority 3: Generic CI environment variables
    if (process.env.CI_COMMIT_SHA) {
      const shortHash = process.env.CI_COMMIT_SHA.substring(0, 7);
      console.log("Using CI commit hash:", shortHash);
      return shortHash;
    }

    // Priority 4: Local development fallback
    try {
      const hash = execSync("git rev-parse --short HEAD", {
        encoding: "utf8",
      }).trim();
      console.log("Using local git commit hash:", hash);
      return hash;
    } catch (error) {
      console.warn("Could not get git commit hash:", error instanceof Error ? error.message : error);
      return "unknown";
    }
  }

  const commitHash = getGitCommitHash();
  const buildTime = new Date().toISOString();
  const buildVersion = `${commitHash}-${Date.now()}`;

  return {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
    __BUILD_VERSION__: JSON.stringify(buildVersion),
    __NODE_ENV__: JSON.stringify(process.env.NODE_ENV || "development"),
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    ...getBuildInfo(),
  },
}));
