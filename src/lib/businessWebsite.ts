/** Website links from both historical listings and the merchant editor. */
export function businessWebsite(value: string | null | undefined): string | null {
  const input = value?.trim();
  if (!input || input.length > 2048 || /[\s\\]/u.test(input)) return null;

  let address = input;
  if (!/^https?:\/\/[^/]/i.test(address)) {
    // A merchant can enter a bare domain, optionally followed by a port and path.
    if (!/^[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+(?::\d{1,5})?(?:[/?#]|$)/u.test(address)) return null;
    address = "https://" + address;
  }
  try {
    const url = new URL(address);
    if (!url.hostname || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}
