#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# VPS Deployment Script — slovo-frontend (Svelte 5 admin SPA)
# =============================================================================
# Runs ON the VPS as root. Triggered by the Forgejo release workflow via SSH.
# Replaces the former Ansible role `roles/custom/slovo-frontend/`.
#
# Usage:   DEPLOY_TAG=abc1234 FRONTEND_HOSTNAME=admin-app.slovo-propovedi.ru \
#          bash vps-deploy.sh
#
# Scope: this script owns ONLY the slovo-frontend container and its own
# `slovo-frontend` Docker network. All shared infrastructure — Docker, the
# `slovo` user/group, the buildx builder, Traefik and the `traefik` Docker
# network — is owned by the slovo-propovedi playbook. Missing infrastructure
# is a HARD ERROR here; it is never auto-provisioned. Run the playbook first:
# just setup-all  (or: just setup-service <name>).
#
# Idempotent: safe to re-run. Handles both the first frontend deploy and updates.
# =============================================================================

# --- Configuration (override via env) ---
FRONTEND_HOSTNAME="${FRONTEND_HOSTNAME:?ERROR: FRONTEND_HOSTNAME is required (e.g. admin-app.slovo-propovedi.ru)}"
DEPLOY_TAG="${DEPLOY_TAG:-manual}"

SERVICE=slovo-frontend
IMAGE=slovo-frontend:latest
CONTAINER=slovo-frontend
NETWORK=slovo-frontend
BASE_PATH=/slovo/frontend
SRC_DIR=/slovo/frontend/container-src
LABELS_FILE="$BASE_PATH/labels"
INTERNAL_PORT=8080
TRAEFIK_NETWORK=traefik
BUILDER=slovo-constrained
MEMORY=128m
STOP_GRACE=3
TRAEFIK_SERVICE="${TRAEFIK_SERVICE:-slovo-traefik.service}"

# Shared infrastructure this deploy depends on but does NOT own (playbook-managed).
REQUIRED_SERVICES="$TRAEFIK_SERVICE"
REQUIRED_NETWORKS="$TRAEFIK_NETWORK"

# --- Banner ---
echo "==============================================================="
echo "  VPS deployment — $SERVICE"
echo "  Tag:      $DEPLOY_TAG"
echo "  Hostname: $FRONTEND_HOSTNAME"
echo "==============================================================="

# --- Verify prerequisites (playbook-owned; never auto-provisioned) ---
# This script owns ONLY the slovo-frontend container and the slovo-frontend
# network (created in step 4). Everything checked below is provisioned by the
# slovo-propovedi playbook (`just setup-all`). Anything missing fails fast with
# a clear message instead of a half-provisioned box or a crash-looping service.
echo ">> Verifying prerequisites..."

fail_missing() {
  echo "ERROR: $1" >&2
  echo "       Shared infrastructure is owned by the slovo-propovedi playbook." >&2
  echo "       Provision it first:  just setup-all   (or: just setup-service <name>)" >&2
  exit 1
}

# Docker
command -v docker >/dev/null 2>&1 || fail_missing "Docker is not installed."
systemctl is-active --quiet docker || fail_missing "Docker service is not running."
echo "  Docker: OK"

# slovo user + group (playbook slovo-base role).
# uid/gid are system-assigned, so capture them dynamically like the playbook does.
getent group slovo >/dev/null 2>&1 || fail_missing "Group 'slovo' does not exist (playbook slovo-base role)."
id -u slovo >/dev/null 2>&1 || fail_missing "User 'slovo' does not exist (playbook slovo-base role)."
SLOVO_UID=$(id -u slovo)
SLOVO_GID=$(id -g slovo)
echo "  slovo user: OK (uid=$SLOVO_UID, gid=$SLOVO_GID)"

# buildx builder (playbook slovo-buildx role)
docker buildx inspect "$BUILDER" >/dev/null 2>&1 \
  || fail_missing "buildx builder '$BUILDER' does not exist (playbook slovo-buildx role)."
echo "  buildx builder: OK ($BUILDER)"

# Traefik fronts this service. If it runs under a different unit name, set
# TRAEFIK_SERVICE=<name>.
# shellcheck disable=SC2086 # word splitting of the space-separated list is intended
for svc in $REQUIRED_SERVICES; do
  systemctl is-active --quiet "$svc" 2>/dev/null \
    || fail_missing "Required service '$svc' is not running."
done
echo "  services: OK ($REQUIRED_SERVICES)"

# Shared Docker networks the container attaches to at runtime (step 6). The
# slovo-frontend network itself is this script's own and is created in step 4.
# shellcheck disable=SC2086 # word splitting of the space-separated list is intended
for net in $REQUIRED_NETWORKS; do
  docker network inspect "$net" >/dev/null 2>&1 \
    || fail_missing "Required Docker network '$net' does not exist."
done
echo "  networks: OK ($REQUIRED_NETWORKS)"

# --- 1. Create paths ---
echo ">> Ensuring paths exist..."
mkdir -p "$BASE_PATH" "$SRC_DIR"
chown slovo:slovo "$BASE_PATH" "$SRC_DIR"
chmod 0750 "$BASE_PATH" "$SRC_DIR"

# --- 2. Verify source code ---
# Source code is transferred by the Forgejo workflow (tar+ssh) before this
# script runs. The Dockerfile lives at the repository root, which is the
# build context root after the flatten (former frontend/web-app/ = repo root).
echo ">> Verifying source code at $SRC_DIR..."
if [ ! -f "$SRC_DIR/Dockerfile" ]; then
  echo "ERROR: No source code found at $SRC_DIR."
  echo "       The workflow should transfer the code before running this script."
  exit 1
fi
chown -R slovo:slovo "$SRC_DIR"

# --- 3. Write Traefik labels (reproduces playbook labels.j2) ---
echo ">> Writing Traefik labels..."
{
  printf 'traefik.enable=true\n'
  printf 'traefik.docker.network=%s\n' "$TRAEFIK_NETWORK"
  printf 'traefik.http.services.slovo-frontend.loadbalancer.server.port=%s\n' "$INTERNAL_PORT"
  printf 'traefik.http.routers.slovo-frontend.rule=Host(`%s`)\n' "$FRONTEND_HOSTNAME"
  printf 'traefik.http.routers.slovo-frontend.service=slovo-frontend\n'
  printf 'traefik.http.routers.slovo-frontend.entrypoints=web-secure\n'
  printf 'traefik.http.routers.slovo-frontend.tls=true\n'
  printf 'traefik.http.routers.slovo-frontend.tls.certResolver=default\n'
} > "$LABELS_FILE"
chown slovo:slovo "$LABELS_FILE"
chmod 0640 "$LABELS_FILE"

# --- 4. Create Docker network (if missing) ---
echo ">> Ensuring Docker network '$NETWORK'..."
docker network inspect "$NETWORK" >/dev/null 2>&1 \
  || docker network create "$NETWORK"

# --- 5. Build Docker image ---
echo ">> Building Docker image (this may take a minute)..."
if ! docker buildx build \
  --builder="$BUILDER" \
  --load \
  --tag="$IMAGE" \
  "$SRC_DIR"; then
  echo "ERROR: Docker image build failed for $IMAGE from $SRC_DIR"
  exit 1
fi

# --- 6. Write systemd unit (reproduces playbook slovo-frontend.service.j2) ---
# NOTE: no --read-only — nginx must write to /var/cache/nginx. The tmpfs for
# /var/cache/nginx is owned by the slovo uid/gid because the container runs as
# that non-root user; without uid/gid/mode the tmpfs is root-owned (0755) and
# nginx aborts with "mkdir() ... Permission denied" -> crash-loop.
echo ">> Writing systemd unit..."
cat > /etc/systemd/system/slovo-frontend.service <<EOF
[Unit]
Description=slovo-frontend
Requires=docker.service
After=docker.service
Wants=$TRAEFIK_SERVICE
After=$TRAEFIK_SERVICE
DefaultDependencies=no

[Service]
Type=simple
Environment="HOME=/root"
ExecStartPre=-/usr/bin/env docker rm -f $CONTAINER
ExecStartPre=/usr/bin/env docker create \\
    --name=$CONTAINER \\
    --log-driver=none \\
    --user=$SLOVO_UID:$SLOVO_GID \\
    --cap-drop=ALL \\
    --memory=$MEMORY \\
    --tmpfs=/var/cache/nginx:rw,noexec,nosuid,size=32m,uid=$SLOVO_UID,gid=$SLOVO_GID,mode=0700 \\
    --network=$NETWORK \\
    --label-file=$LABELS_FILE \\
    $IMAGE
ExecStartPre=/usr/bin/env docker network connect $TRAEFIK_NETWORK $CONTAINER
ExecStart=/usr/bin/env docker start --attach $CONTAINER
ExecStop=-/usr/bin/env docker stop -t $STOP_GRACE $CONTAINER
Restart=always
RestartSec=30
SyslogIdentifier=slovo-frontend

[Install]
WantedBy=multi-user.target
EOF

# --- 7. Reload, enable and restart ---
echo ">> Reloading systemd and restarting service..."
systemctl daemon-reload
systemctl enable slovo-frontend.service >/dev/null 2>&1 || true
systemctl restart slovo-frontend.service

# --- 8. Verify ---
sleep 2
if systemctl is-active --quiet slovo-frontend.service; then
  echo "[OK] slovo-frontend.service is running"
  echo "[OK] Deployment of $DEPLOY_TAG complete"
  echo "     Site: https://$FRONTEND_HOSTNAME"
else
  echo "ERROR: slovo-frontend.service failed to start"
  systemctl status slovo-frontend.service --no-pager -l || true
  exit 1
fi

# --- 9. Post-deploy cleanup (non-fatal, best effort) ---
# Runs only after step 8 confirms the new service is active. Bounds disk growth
# on the 2GB VPS across repeated releases: prunes dangling images only (no
# --all; the previous release's image becomes dangling once
# slovo-frontend:latest is retagged) and caps the buildx builder cache.
# Strictly non-fatal — with `set -e` a cleanup failure must never fail a
# successful deployment, so errors are logged as warnings.
echo ">> Pruning dangling Docker images..."
if ! docker image prune --force; then
  echo "WARN: docker image prune failed — skipping dangling image cleanup" >&2
fi

echo ">> Pruning buildx builder cache ($BUILDER, keep 4GB)..."
if ! docker buildx prune --builder "$BUILDER" --keep-storage 4GB --force; then
  echo "WARN: docker buildx prune failed — skipping builder cache cleanup" >&2
fi

# --- 10. Cleanup ---
rm -f /tmp/vps-deploy.sh
echo ">> Done."
