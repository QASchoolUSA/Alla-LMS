#!/usr/bin/env bash
#
# Self-host Supabase with Docker (official stack).
# Run ON the VPS as root or with sudo after SSH key login.
#
# Docs: https://supabase.com/docs/guides/self-hosting/docker
#
set -euo pipefail

INSTALL_ROOT="${INSTALL_ROOT:-/opt/supabase-project}"
SUPABASE_REPO_DEPTH="${SUPABASE_REPO_DEPTH:-1}"

log() { printf '\n[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    log "Missing: $1"
    exit 1
  }
}

install_docker_convenience() {
  log "Installing Docker Engine + Compose via https://get.docker.com ..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker || true
}

ensure_docker() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    log "Docker already present."
    return
  fi
  install_docker_convenience
}

main() {
  [[ "$(id -u)" -eq 0 ]] || { log "Run as root or with sudo."; exit 1; }

  ensure_docker
  require_cmd git
  require_cmd curl

  local workdir
  workdir="$(mktemp -d)"
  trap 'rm -rf "$workdir"' EXIT

  log "Cloning Supabase docker bundle (depth ${SUPABASE_REPO_DEPTH})..."
  git clone --depth "${SUPABASE_REPO_DEPTH}" https://github.com/supabase/supabase.git "$workdir/supabase"

  log "Preparing ${INSTALL_ROOT}..."
  mkdir -p "$(dirname "${INSTALL_ROOT}")"
  rm -rf "${INSTALL_ROOT}"
  mkdir -p "${INSTALL_ROOT}"
  cp -a "$workdir/supabase/docker/." "${INSTALL_ROOT}/"

  cd "${INSTALL_ROOT}"

  if [[ ! -f .env ]]; then
    cp .env.example .env
  fi

  if [[ -f utils/generate-keys.sh ]]; then
    require_cmd openssl
    log "Generating secrets (utils/generate-keys.sh --update-env)..."
    bash utils/generate-keys.sh --update-env
  else
    log "WARN: utils/generate-keys.sh not found; you must set secrets in .env before production."
  fi

  if [[ -f utils/add-new-auth-keys.sh ]]; then
    log "Running utils/add-new-auth-keys.sh (optional; see self-hosted auth keys docs)..."
    bash utils/add-new-auth-keys.sh || log "add-new-auth-keys.sh exited non-zero — verify .env against current Supabase docker docs."
  fi

  log "Pulling images (this may take several minutes)..."
  docker compose pull

  log "Starting stack..."
  docker compose up -d

  log "Done. Check status: cd ${INSTALL_ROOT} && docker compose ps"
  log "Studio/API (default): http://YOUR_SERVER_IP:8000"
  log "Set DASHBOARD_USERNAME / DASHBOARD_PASSWORD in .env before exposing to the internet."
  log "Use HTTPS reverse proxy (Caddy/Nginx) for production: https://supabase.com/docs/guides/self-hosting/self-hosted-proxy-https"
}

main "$@"
