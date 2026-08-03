FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Install concurrently for running Next.js and Trigger.dev side-by-side
RUN npm install -g concurrently

# Increase inotify watcher limit for Turbopack file watching
RUN echo "fs.inotify.max_user_watches=524288" >> /etc/sysctl.conf
