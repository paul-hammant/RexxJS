# Simple Node.js Hello World for Cloud Run
FROM node:20-slim

WORKDIR /app

COPY app.js .

# Cloud Run sets PORT env var, default to 8080
ENV PORT=8080

EXPOSE 8080

CMD ["node", "app.js"]
