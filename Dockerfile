FROM node:24-alpine

RUN apk add --no-cache openssl icu-libs python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY networking/package.json ./networking/
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "run", "dev", "--workspace=server"]
