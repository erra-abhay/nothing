#!/bin/bash

#CONTAINER START WITH NGINX COMMAND

echo "==========================================================STARTING CONTAINERS======================================================================"

# Ensure required SSL directory exists
mkdir -p nginx/ssl

docker compose --profile with-nginx --profile monitoring up -d


sleep 10

echo "==========================================================GETTING CONTAINER INFO========================================================="

docker ps 

sleep 5

echo "========================================================== GETTING CONTAINER STATUS ========================================================="


docker stats --no-stream

sleep 5

echo "==========================================================LOGGING NGINX========================================================="


docker logs qpr_nginx --tail 10

sleep 5

echo "==========================================================LOGGING MYSQL========================================================="


docker logs qpr_mysql --tail 10

sleep 5

echo "==========================================================LOGGING REDIS STACK========================================================="

docker logs qpr_redis_stack --tail 10

sleep 5

echo "==========================================================LOGGING NOTHING-APP========================================================="

docker logs nothing-app-1 --tail 10
#docker exec -it qpr_mysql mysql -u root -p

sleep 5

echo "==========================================================LOGGING PROMETHEUS========================================================="
docker logs qpr_prometheus --tail 10

sleep 5

echo "==========================================================LOGGING GRAFANA========================================================="
docker logs qpr_grafana --tail 10

sleep 5

echo "==========================================================LOGGING CADVISOR========================================================="
docker logs qpr_cadvisor --tail 10

sleep 5

echo "==========================================================LOGGING NODE EXPORTER========================================================="
docker logs qpr_node_exporter --tail 10

