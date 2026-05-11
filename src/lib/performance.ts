export function shouldLazyLoadImage(index: number, eagerCount = 1): boolean {
  return index >= eagerCount;
}

export function getImageLoadingStrategy(index: number, eagerCount = 1): "eager" | "lazy" {
  return shouldLazyLoadImage(index, eagerCount) ? "lazy" : "eager";
}

export function getImageFetchPriority(index: number, eagerCount = 1): "high" | "auto" | "low" {
  return index < eagerCount ? "high" : "auto";
}
