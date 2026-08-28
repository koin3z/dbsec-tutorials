FROM node:22-bookworm-slim
WORKDIR /work
EXPOSE 4321
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4321"]