#!/usr/bin/env bash
#
# Fails if a built image carries secrets.
#
# Why this exists: both Dockerfiles run `COPY . .`, and a build context
# without a .dockerignore hands them .env. An image layer is permanent —
# deleting the file in a later stage does not remove it from the image,
# and `docker save` will still show it. A CI job that only inspects the
# final filesystem would miss exactly that case, so this inspects every
# layer in the saved tarball as well.
#
# Usage:
#   scripts/check-image-secrets.sh acos-web:latest acos-worker:latest
#
# Optional: set CANARY to a marker string you planted in a throwaway .env
# before building, to prove the check can actually see a leak. Without it
# the script still checks for .env files and for the environment-variable
# NAMES that carry this system's secrets.
#
# Never prints a matched value — only the path and the rule that fired.

set -euo pipefail

IMAGES=("$@")
if [ ${#IMAGES[@]} -eq 0 ]; then
  echo "usage: $0 <image> [image...]" >&2
  exit 2
fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Secret-bearing variable names in this repository. Matching the NAME is
# the right test: .env.example contains these names with empty values and
# is legitimately in the image, so a name alone is not a failure — a name
# with a non-empty value assigned to it is.
SECRET_NAMES='RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|META_CAPI_ACCESS_TOKEN|ANTHROPIC_API_KEY|DOWNLOAD_GRANT_SECRET'

failures=0
fail() {
  echo "  FAIL: $1"
  failures=$((failures + 1))
}

for image in "${IMAGES[@]}"; do
  echo "== $image =="

  # --- 1. No .env file in the final filesystem ---------------------------
  # .env.example is permitted: it holds key names and no values.
  found_env="$(docker run --rm --entrypoint sh "$image" -c \
    'find / -xdev \( -name ".env" -o -name ".env.*" \) ! -name ".env.example" 2>/dev/null' || true)"
  if [ -n "$found_env" ]; then
    fail ".env file present in final image: $(echo "$found_env" | head -3 | tr '\n' ' ')"
  else
    echo "  ok: no .env file in the final filesystem"
  fi

  # --- 2. No secret VALUES in the image config --------------------------
  # ENV instructions and build args both land here, in plaintext, and are
  # readable with `docker inspect` by anyone who can pull the image.
  if docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$image" |
    grep -Eq "^($SECRET_NAMES)=.+"; then
    fail "a secret variable is set with a value in the image config (docker inspect)"
  else
    echo "  ok: no secret values in the image config"
  fi

  # --- 3. No secret values baked into any LAYER -------------------------
  # The step the other two checks cannot cover: a file that existed in an
  # earlier stage and was not carried forward is still in the tarball.
  docker save "$image" -o "$WORK/img.tar"
  mkdir -p "$WORK/x" && tar -xf "$WORK/img.tar" -C "$WORK/x"

  # `docker save` emits an OCI layout: layers are GZIPPED BLOBS under
  # blobs/sha256/, not *.tar files, and they are not named for their
  # contents. An earlier version of this script looked for "*.tar",
  # matched nothing, and reported "ok" for every image including one
  # built with no .dockerignore at all. Decompressing each blob is the
  # difference between this check working and only appearing to.
  layer_env=""
  layer_secret=0
  layer_canary=0
  while IFS= read -r blob; do
    case "$(file -b --mime-type "$blob")" in
      application/gzip | application/x-gzip) reader="gzip -dc" ;;
      application/x-tar) reader="cat" ;;
      *) continue ;;
    esac

    names="$($reader "$blob" 2>/dev/null | tar -tf - 2>/dev/null |
      grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example' || true)"
    [ -n "$names" ] && layer_env="$layer_env $names"

    # Streamed straight into grep, never captured. A layer is binary and
    # a shell variable cannot hold it — command substitution strips NUL
    # bytes and truncates, which made these two checks pass on an image
    # that demonstrably contained the secret. `grep -a` treats the stream
    # as text; the 2>/dev/null on the reader swallows the SIGPIPE that
    # grep causes when it exits early on a match.
    # `set -o pipefail` is on, and `grep -q` exits the moment it matches,
    # which kills the decompressor with SIGPIPE (141). pipefail then
    # reports the whole pipeline as FAILED — so a match read as "no
    # match" and these checks passed on an image that provably contained
    # the secret. The subshell turns pipefail off for exactly these two
    # pipelines and nowhere else.
    if (
      set +o pipefail
      $reader "$blob" 2>/dev/null | grep -aqE "($SECRET_NAMES)=[A-Za-z0-9_+/=.-]{8,}"
    ); then
      layer_secret=1
    fi
    if [ -n "${CANARY:-}" ] && (
      set +o pipefail
      $reader "$blob" 2>/dev/null | grep -aqF "$CANARY"
    ); then
      layer_canary=1
    fi
  done <<EOF
$(find "$WORK/x/blobs" -type f 2>/dev/null)
EOF

  if [ -n "$(echo "$layer_env" | tr -d ' ')" ]; then
    fail ".env found inside an image layer:$(echo "$layer_env" | tr '\n' ' ' | cut -c1-120)"
  else
    echo "  ok: no .env in any layer"
  fi

  if [ "$layer_secret" -eq 1 ]; then
    fail "a secret variable is assigned a value inside a layer"
  else
    echo "  ok: no secret assignments with values in any layer"
  fi

  if [ -n "${CANARY:-}" ]; then
    if [ "$layer_canary" -eq 1 ]; then
      fail "canary marker found in a layer — the build context is leaking"
    else
      echo "  ok: canary marker absent from every layer"
    fi
  fi

  rm -rf "$WORK/x" "$WORK/img.tar"
done

echo
if [ "$failures" -gt 0 ]; then
  echo "SECRET CHECK FAILED ($failures finding(s))"
  exit 1
fi
echo "SECRET CHECK PASSED"
