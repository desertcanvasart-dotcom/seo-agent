FROM node:22-slim

WORKDIR /app

COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci

COPY dashboard/ .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
