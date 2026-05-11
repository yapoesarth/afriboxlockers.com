#!/bin/bash
# ──────────────────────────────────────────────────────────
#  update.sh — Mise à jour du site Afribox sur le VPS
#
#  Usage :
#    cd /opt/afribox-site
#    sudo ./update.sh
# ──────────────────────────────────────────────────────────
set -e

SITE_DIR="/opt/afribox-site"
COMPOSE_FILE="docker-compose.prod.yml"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$SITE_DIR"

echo "═══ Mise à jour Afribox ═══"

# Vérif que le .env existe avant tout build
if [ ! -f .env ]; then
    echo -e "${RED}✘ /opt/afribox-site/.env est manquant.${NC}"
    echo "   Crée-le depuis .env.prod.example :"
    echo "     cp .env.prod.example .env && chmod 600 .env && nano .env"
    exit 1
fi

echo -e "\n${YELLOW}[1/5] git pull...${NC}"
git pull origin main

echo -e "\n${YELLOW}[2/5] Rebuild des images...${NC}"
docker compose -f "$COMPOSE_FILE" build --no-cache

echo -e "\n${YELLOW}[3/5] Redémarrage des conteneurs...${NC}"
docker compose -f "$COMPOSE_FILE" up -d

echo -e "\n${YELLOW}[4/5] Attente que les services soient healthy...${NC}"
# Boucle d'attente jusqu'à 90 secondes
for i in {1..30}; do
    state=$(docker inspect afribox-web --format '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    if [ "$state" = "healthy" ]; then
        echo -e "   ${GREEN}✔ afribox-web healthy${NC}"
        break
    fi
    sleep 3
done

echo -e "\n${YELLOW}[5/5] Nettoyage des images orphelines...${NC}"
docker image prune -f >/dev/null

echo -e "\n${GREEN}✔ Mise à jour terminée${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "afribox|NAMES"

echo ""
echo "Test rapide :"
curl -sI -m 5 https://afriboxlockers.com | head -3 || true
echo ""
curl -s -m 5 https://afriboxlockers.com/api/ || true
echo ""
