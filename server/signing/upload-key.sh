#!/bin/sh
set -eu
umask 077
root=/var/lib/qmaps-signing
key=$root/android-upload
case "${1:-}" in
  init)
    if [ -d "$key" ]; then openssl x509 -in "$key/public.pem" -noout -fingerprint -sha256; exit; fi
    mkdir "$root/.initializing"
    stage=$(mktemp -d "$root/.new-XXXXXX")
    trap 'rm -rf "$stage"; rmdir "$root/.initializing"' EXIT
    openssl rand -hex 32 > "$stage/password"
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -aes-256-cbc -pass file:"$stage/password" -out "$stage/private.pem" 2>/dev/null
    openssl req -new -x509 -sha256 -days 10000 -key "$stage/private.pem" -passin file:"$stage/password" -subj '/CN=QMAPS Android Upload/O=QMAPS/C=CA' -addext 'basicConstraints=critical,CA:FALSE' -addext 'keyUsage=critical,digitalSignature' -out "$stage/public.pem"
    openssl pkcs12 -export -name qmaps -inkey "$stage/private.pem" -in "$stage/public.pem" -passin fd:3 -passout fd:4 -out "$stage/upload.p12" 3<"$stage/password" 4<"$stage/password"
    mv "$stage" "$key"
    openssl x509 -in "$key/public.pem" -noout -fingerprint -sha256
    ;;
  sign)
    test "$#" -eq 3
    openssl cms -sign -binary -noattr -md sha256 -in "$2" -signer "$key/public.pem" -inkey "$key/private.pem" -passin file:"$key/password" -outform DER -out "$3"
    ;;
  *) echo 'Usage: qmaps-upload-key init | sign manifest.SF signature.RSA' >&2; exit 2 ;;
esac
