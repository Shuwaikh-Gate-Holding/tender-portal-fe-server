# Stage 1: Base
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM base AS build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 4: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the output from the build stage
# TanStack Start / Nitro typically outputs to .output
COPY --from=build /app/.output ./output
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000

# Start the server
CMD ["node", "./output/server/index.mjs"]
