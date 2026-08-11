FROM mcr.microsoft.com/devcontainers/typescript-node:24

# Install xdg-utils so tools can auto-open login URLs
RUN apt-get update && apt-get install -y --no-install-recommends xdg-utils && rm -rf /var/lib/apt/lists/*

# Install concurrently for running Next.js and Trigger.dev side-by-side
RUN npm install -g concurrently
