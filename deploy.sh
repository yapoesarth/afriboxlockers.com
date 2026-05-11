#!/bin/bash
# ──────────────────────────────────────────────────────────
#  deploy.sh — Déploiement initial / reset Afribox sur le VPS
#
#  Pré-requis :
#    - Traefik tourne déjà (/opt/infra/)
#    - Le réseau Docker `proxy-network` existe
#    - Le DNS pointe vers ce VPS (A afriboxlockers.com → 51.210.15.48)
#
#  Usage :
#    cd /opt/afribox-site         # OU /opt/afribox-site-v2/ pour un déploiement parallèle
#    sudo ./deploy.sh
# ──────────────────────────────────────────────────────────
set -e

SITE_DIR="$(pwd)"
COMPOSE_FILE="docker-compose.prod.yml"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "═══ Déploiement Afribox dans $SITE_DIR ═══"

# ── [1/6] Vérifs préalables ──
echo -e "\n${YELLOW}[1/6] Vérifications préalables...${NC}"

if ! docker network inspect proxy-network >/dev/null 2>&1; then
    echo -e "${RED}✘ Le réseau Docker 'proxy-network' n'existe pas.${NC}"
    echo "   Lance d'abord Traefik :"
    echo "     cd /opt/infra && docker compose -f docker-compose.infra.yml up -d"
    exit 1
fi
echo -e "   ${GREEN}✔ proxy-network OK${NC}"

if ! docker ps --format '{{.Names}}' | grep -q '^traefik$'; then
    echo -e "${RED}✘ Le conteneur Traefik n'est pas démarré.${NC}"
    exit 1
fi
echo -e "   ${GREEN}✔ Traefik en route${NC}"

if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}✘ $COMPOSE_FILE introuvable dans $SITE_DIR${NC}"
    exit 1
fi

if [ ! -f .env ]; then
    echo -e "${RED}✘ .env manquant.${NC}"
    echo "   Crée-le :"
    echo "     cp .env.prod.example .env"
    echo "     chmod 600 .env"
    echo "     # puis remplace MONGO_PASSWORD par : openssl rand -base64 32"
    exit 1
fi

# Vérif basique que MONGO_PASSWORD n'est plus le placeholder
if grep -q "CHANGE_ME_GENERATE" .env; then
    echo -e "${RED}✘ MONGO_PASSWORD est encore le placeholder dans .env${NC}"
    echo "   Génère un secret fort :  openssl rand -base64 32"
    exit 1
fi
echo -e "   ${GREEN}✔ .env présent et configuré${NC}"

# ── [2/6] Build ──
echo -e "\n${YELLOW}[2/6] Build des images (peut prendre 3-5 minutes)...${NC}"
docker compose -f "$COMPOSE_FILE" build --no-cache

# ── [3/6] Démarrage ──
echo -e "\n${YELLOW}[3/6] Démarrage des conteneurs...${NC}"
docker compose -f "$COMPOSE_FILE" up -d

# ── [4/6] Attente MongoDB healthy ──
echo -e "\n${YELLOW}[4/6] Attente que MongoDB soit healthy...${NC}"
for i in {1..40}; do
    state=$(docker inspect afribox-mongo --format '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    if [ "$state" = "healthy" ]; then
        echo -e "   ${GREEN}✔ afribox-mongo healthy${NC}"
        break
    fi
    [ $i -eq 40 ] && { echo -e "${RED}✘ Mongo n'est pas devenu healthy après 80s${NC}"; docker logs afribox-mongo --tail 20; exit 1; }
    sleep 2
done

# ── [5/6] Attente web healthy ──
echo -e "\n${YELLOW}[5/6] Attente que Nginx (web) soit healthy...${NC}"
for i in {1..30}; do
    state=$(docker inspect afribox-web --format '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    if [ "$state" = "healthy" ]; then
        echo -e "   ${GREEN}✔ afribox-web healthy${NC}"
        break
    fi
    [ $i -eq 30 ] && { echo -e "${RED}✘ Web n'est pas devenu healthy après 90s${NC}"; docker logs afribox-web --tail 20; exit 1; }
    sleep 3
done

# ── [6/6] Vérification finale ──
echo -e "\n${YELLOW}[6/6] Vérifications finales...${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "afribox|NAMES"

echo ""
echo -e "${GREEN}✔ Déploiement terminé${NC}"
echo ""
echo "Tests externes :"
curl -sI -m 5 https://afriboxlockers.com | head -3 || echo "   (pas encore exposé via Traefik — vérifier les labels)"
echo ""
curl -s -m 5 https://afriboxlockers.com/api/ || echo "   (API pas encore accessible)"
echo ""
echo "Pour les logs en direct :"
echo "   docker compose -f $COMPOSE_FILE logs -f"
