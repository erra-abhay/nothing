#!/bin/bash

# Color codes for premium CLI styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}========================================================================${NC}"
echo -e "${BLUE}${BOLD}                     STARTING PAPERVAULT STACK                          ${NC}"
echo -e "${BLUE}${BOLD}========================================================================${NC}"

# 1. Pre-flight Checks: Ensure required directories exist to prevent mount failures
echo -e "\n${CYAN}[1/5] Running pre-flight checks...${NC}"
if [ ! -d "nginx/ssl" ]; then
    echo -e "${YELLOW}⚠️  Directory 'nginx/ssl' not found. Creating it now...${NC}"
    mkdir -p nginx/ssl
    echo -e "${GREEN}✓ 'nginx/ssl' directory created successfully.${NC}"
else
    echo -e "${GREEN}✓ 'nginx/ssl' directory already exists.${NC}"
fi

# 2. Start Containers
echo -e "\n${CYAN}[2/5] Starting docker compose services (with-nginx profile)...${NC}"
docker compose --profile with-nginx up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start docker compose services.${NC}"
    exit 1
fi

# 3. Dynamic Health Polling (Instead of hardcoded sleep)
echo -e "\n${CYAN}[3/5] Waiting for all services to become healthy/running...${NC}"
TIMEOUT=60
ELAPSED=0
ALL_HEALTHY=false

while [ $ELAPSED -lt $TIMEOUT ]; do
    CONTAINER_IDS=$(docker compose --profile with-nginx ps -q)
    if [ -z "$CONTAINER_IDS" ]; then
        echo -e "${RED}❌ No containers found in the stack.${NC}"
        exit 1
    fi

    CURRENT_UNHEALTHY=0
    for cid in $CONTAINER_IDS; do
        # Get status and health
        status=$(docker inspect --format='{{.State.Status}}' "$cid" 2>/dev/null)
        health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null)
        name=$(docker inspect --format='{{.Name}}' "$cid" 2>/dev/null | sed 's/^\///')

        if [ "$status" != "running" ]; then
            CURRENT_UNHEALTHY=$((CURRENT_UNHEALTHY + 1))
        elif [ "$health" != "none" ] && [ "$health" != "healthy" ]; then
            CURRENT_UNHEALTHY=$((CURRENT_UNHEALTHY + 1))
        fi
    done

    if [ $CURRENT_UNHEALTHY -eq 0 ]; then
        ALL_HEALTHY=true
        break
    fi

    sleep 2
    ELAPSED=$((ELAPSED + 2))
    echo -n "."
done

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "\n${GREEN}✓ All services are UP and HEALTHY!${NC}"
else
    echo -e "\n${YELLOW}⚠️  Some services did not reach a healthy state within ${TIMEOUT} seconds. Continuing diagnostics...${NC}"
fi

# 4. Display Active Container Info
echo -e "\n${CYAN}[4/5] Active Container Status:${NC}"
echo -e "${BLUE}${BOLD}------------------------------------------------------------------------${NC}"
printf "%-25s %-15s %-15s %-20s\n" "CONTAINER NAME" "STATUS" "HEALTH" "PORTS"
echo -e "${BLUE}------------------------------------------------------------------------${NC}"

for cid in $(docker compose --profile with-nginx ps -q); do
    name=$(docker inspect --format='{{.Name}}' "$cid" 2>/dev/null | sed 's/^\///')
    status=$(docker inspect --format='{{.State.Status}}' "$cid" 2>/dev/null)
    health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null)
    
    # Extract ports mapping
    ports=$(docker inspect --format='{{range $p, $conf := .NetworkSettings.Ports}}{{if $conf}}{{range $conf}}{{.HostIp}}:{{.HostPort}}->{{$p}} {{end}}{{else}}{{$p}} {{end}}{{end}}' "$cid" 2>/dev/null)
    [ -z "$ports" ] && ports="none"

    # Colorize status
    if [ "$status" = "running" ]; then
        colored_status="${GREEN}${status}${NC}"
    else
        colored_status="${RED}${status}${NC}"
    fi

    # Colorize health
    if [ "$health" = "healthy" ]; then
        colored_health="${GREEN}${health}${NC}"
    elif [ "$health" = "starting" ]; then
        colored_health="${YELLOW}${health}${NC}"
    elif [ "$health" = "none" ]; then
        colored_health="${BLUE}N/A${NC}"
    else
        colored_health="${RED}${health}${NC}"
    fi

    printf "%-34s %-24s %-24s %-20s\n" "$name" "$colored_status" "$colored_health" "$ports"
done
echo -e "${BLUE}${BOLD}------------------------------------------------------------------------${NC}"

# Show CPU/Memory stats
echo -e "\n${CYAN}System Resource Usage (Current Snapshot):${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"

# 5. Application Accessibility Check
echo -e "\n${CYAN}[5/5] Testing Nginx Web Access (http://127.0.0.1:55516)...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://127.0.0.1:55516)

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}🎉 Success! The website is accessible at http://localhost:55516 (HTTP Status: 200)${NC}"
else
    echo -e "${RED}❌ Connection test failed. HTTP Status returned: ${HTTP_STATUS}${NC}"
fi

# Print recent logs for troubleshooting
echo -e "\n${CYAN}========================================================================${NC}"
echo -e "${CYAN}                         RECENT SERVICE LOGS                            ${NC}"
echo -e "${CYAN}========================================================================${NC}"

for cid in $(docker compose --profile with-nginx ps -q); do
    name=$(docker inspect --format='{{.Name}}' "$cid" 2>/dev/null | sed 's/^\///')
    echo -e "\n${YELLOW}▶ Logs for container: ${name} (last 10 lines)${NC}"
    echo -e "${BLUE}------------------------------------------------------------------------${NC}"
    docker logs "$cid" --tail 10
    echo -e "${BLUE}------------------------------------------------------------------------${NC}"
done

echo -e "\n${GREEN}${BOLD}Diagnostics Complete!${NC}\n"
