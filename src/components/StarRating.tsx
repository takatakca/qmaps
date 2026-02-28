import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
}

const StarRating = ({ rating, size = 14, showValue = false }: StarRatingProps) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={size} className="fill-star text-star" />
        ))}
        {hasHalf && <StarHalf size={size} className="fill-star text-star" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={size} className="text-muted-foreground/30" />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-foreground">{rating}</span>
      )}
    </div>
  );
};

export default StarRating;
