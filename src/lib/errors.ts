export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Erreur inattendue";
}

export function isOneOf<const T extends string>(value: string, options: readonly T[]): value is T {
  return options.some((option) => option === value);
}
