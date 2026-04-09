FROM nginx:latest
COPY task-manager/dist/ /usr/share/nginx/html/
COPY task-manager/styles.css /usr/share/nginx/html/styles.css