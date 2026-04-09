FROM nginx:latest
COPY task-manager/ /usr/share/nginx/html/task-manager/
COPY task-manager/styles.css /usr/share/nginx/html/styles.css
COPY index.html /usr/share/nginx/html/index.html