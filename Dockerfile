FROM nginx:latest
COPY task-manager/ /usr/share/nginx/html/task-manager/
COPY index.html /usr/share/nginx/html/index.html