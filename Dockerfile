# --- 1단계: React 앱 빌드 ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# --- 2단계: Nginx 서버에 빌드 결과물 배포 ---
FROM nginx:alpine

# 1. 빌드 단계에서 생성된 dist 폴더를 Nginx의 기본 웹 루트로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 2. 우리가 만든 Nginx 설정 파일을 컨테이너에 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3. 80 포트 개방
EXPOSE 80

# 4. Nginx 실행
CMD ["nginx", "-g", "daemon off;"]