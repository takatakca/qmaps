-- Phase 3C: prevent duplicate merchant service categories/areas and duplicate quotes per business+project

-- Unique service category per business
CREATE UNIQUE INDEX IF NOT EXISTS merchant_service_categories_business_category_uniq
  ON public.merchant_service_categories (business_id, category_id);

-- Unique service area per business (treat NULLs as empty for dedupe)
CREATE UNIQUE INDEX IF NOT EXISTS merchant_service_areas_unique_combo
  ON public.merchant_service_areas (
    business_id,
    COALESCE(city, ''),
    COALESCE(region, ''),
    COALESCE(postal_code_prefix, ''),
    COALESCE(radius_km, -1)
  );

-- Prevent duplicate quote from the same business on the same project request
CREATE UNIQUE INDEX IF NOT EXISTS project_quotes_business_project_uniq
  ON public.project_quotes (business_id, project_request_id);
