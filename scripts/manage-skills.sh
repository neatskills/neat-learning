#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  install    Install skills via symlinks
  uninstall  Remove skills symlinks
  help       Show this help

EOF
  exit 1
}

root="$(cd "$(dirname "$0")/.." && pwd)"
dst="$HOME/.claude/skills"

install_skills() {
  mkdir -p "$dst"

  # Check if SKILL.md exists at project root (single-skill project)
  if [ -f "$root/SKILL.md" ]; then
    name=$(grep '^name:' "$root/SKILL.md" | head -1 | sed 's/^name: *//')
    if [ -z "$name" ]; then
      echo "ERROR: no name in $root/SKILL.md frontmatter" >&2
      exit 1
    fi

    [ -L "$dst/$name" ] && [ "$(readlink "$dst/$name")" = "$root" ] && echo "INFO: $name already installed - skipping" && return 0
    [ -e "$dst/$name" ] && echo "WARN: $dst/$name already exists — skipping" && return 0
    ln -s "$root" "$dst/$name" && echo "INFO: $name installed"
    return 0
  fi

  # Otherwise check for subdirectories with SKILL.md (multi-skill project)
  for src in "$root"/neat-*/; do
    [ ! -d "$src" ] && continue
    [ ! -f "$src/SKILL.md" ] && continue

    name=$(grep '^name:' "$src/SKILL.md" | head -1 | sed 's/^name: *//')
    if [ -z "$name" ]; then
      echo "ERROR: no name in $src/SKILL.md frontmatter" >&2
      continue
    fi

    src="${src%/}"  # remove trailing slash

    [ -L "$dst/$name" ] && [ "$(readlink "$dst/$name")" = "$src" ] && echo "INFO: $name already installed - skipping" && continue
    [ -e "$dst/$name" ] && echo "WARN: $dst/$name already exists — skipping" && continue
    ln -s "$src" "$dst/$name" && echo "INFO: $name installed"
  done
}

uninstall_skills() {
  # Check if SKILL.md exists at project root (single-skill project)
  if [ -f "$root/SKILL.md" ]; then
    name=$(grep '^name:' "$root/SKILL.md" | head -1 | sed 's/^name: *//')
    if [ -z "$name" ]; then
      echo "ERROR: no name in $root/SKILL.md frontmatter" >&2
      exit 1
    fi

    if [ -L "$dst/$name" ] && [ "$(readlink "$dst/$name")" = "$root" ]; then
      rm "$dst/$name" && echo "INFO: $name uninstalled"
    elif [ -e "$dst/$name" ] || [ -L "$dst/$name" ]; then
      echo "WARN: $name exists but was not installed by this project — skipping"
    else
      echo "INFO: $name not installed — skipping"
    fi
    return 0
  fi

  # Otherwise check for subdirectories with SKILL.md (multi-skill project)
  for src in "$root"/neat-*/; do
    [ ! -d "$src" ] && continue
    [ ! -f "$src/SKILL.md" ] && continue

    name=$(grep '^name:' "$src/SKILL.md" | head -1 | sed 's/^name: *//')
    if [ -z "$name" ]; then
      echo "ERROR: no name in $src/SKILL.md frontmatter" >&2
      continue
    fi

    src="${src%/}"  # remove trailing slash

    if [ -L "$dst/$name" ] && [ "$(readlink "$dst/$name")" = "$src" ]; then
      rm "$dst/$name" && echo "INFO: $name uninstalled"
    elif [ -e "$dst/$name" ] || [ -L "$dst/$name" ]; then
      echo "WARN: $name exists but was not installed by this project — skipping"
    else
      echo "INFO: $name not installed — skipping"
    fi
  done
}

case "${1:-}" in
  install)
    install_skills
    ;;
  uninstall)
    uninstall_skills
    ;;
  help|--help|-h|"")
    usage
    ;;
  *)
    echo "ERROR: unknown command '$1'" >&2
    usage
    ;;
esac
