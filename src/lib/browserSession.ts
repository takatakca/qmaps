export type BrowserReadCredentials = "same-origin" | "omit";

export async function isRejectedBrowserSession(response: Response): Promise<boolean> {
  if (response.status !== 401 || response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json")
    return false;
  try {
    // Keep the original response body available for the normal error handler.
    const body = await response.clone().json();
    return body?.error === "Session invalide" || body?.error === "Session expirée";
  } catch {
    return false;
  }
}
