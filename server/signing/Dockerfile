FROM alpine:3.22
RUN apk add --no-cache openssl && addgroup -S signing && adduser -S -G signing signing \
    && mkdir -p /var/lib/qmaps-signing && chown signing:signing /var/lib/qmaps-signing
COPY --chmod=755 server/signing/upload-key.sh /usr/local/bin/qmaps-upload-key
USER signing
CMD ["sleep","infinity"]
