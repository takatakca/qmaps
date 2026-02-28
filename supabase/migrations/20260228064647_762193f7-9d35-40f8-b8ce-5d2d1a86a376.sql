
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'merchant', 'user');

-- Profiles table (synced with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories readable by everyone" ON public.categories FOR SELECT USING (true);

-- Businesses
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  website TEXT,
  price_level SMALLINT CHECK (price_level BETWEEN 1 AND 4),
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Montréal',
  region TEXT DEFAULT 'QC',
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'CA',
  latitude DOUBLE PRECISION NOT NULL DEFAULT 45.5017,
  longitude DOUBLE PRECISION NOT NULL DEFAULT -73.5673,
  image_url TEXT,
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  reviews_count INT NOT NULL DEFAULT 0,
  is_open BOOLEAN NOT NULL DEFAULT true,
  hours TEXT,
  amenities TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses readable by everyone" ON public.businesses FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can update own business" ON public.businesses FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Authenticated users can create business" ON public.businesses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_businesses_city ON public.businesses(city);
CREATE INDEX idx_businesses_avg_rating ON public.businesses(avg_rating DESC);
CREATE INDEX idx_businesses_price ON public.businesses(price_level);

-- Business categories pivot
CREATE TABLE public.business_categories (
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (business_id, category_id)
);

ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business categories readable by all" ON public.business_categories FOR SELECT USING (true);
CREATE POLICY "Owners can manage business categories" ON public.business_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_user_id = auth.uid())
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  useful INT NOT NULL DEFAULT 0,
  funny INT NOT NULL DEFAULT 0,
  cool INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_review_per_user UNIQUE (business_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews readable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_reviews_business_created ON public.reviews(business_id, created_at DESC);

-- Rating refresh trigger
CREATE OR REPLACE FUNCTION public.refresh_business_rating()
RETURNS TRIGGER AS $$
DECLARE
  bid UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    bid := OLD.business_id;
  ELSE
    bid := NEW.business_id;
  END IF;
  UPDATE public.businesses
  SET
    avg_rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.business_id = bid), 0),
    reviews_count = COALESCE((SELECT COUNT(*)::int FROM public.reviews r WHERE r.business_id = bid), 0),
    updated_at = now()
  WHERE id = bid;
  IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER reviews_refresh_business_aiud
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_business_rating();

-- Bookmarks
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  list_name TEXT NOT NULL DEFAULT 'saved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uniq_bookmark UNIQUE (user_id, business_id, list_name)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);

-- Seed categories
INSERT INTO public.categories (slug, name, icon) VALUES
  ('restaurants', 'Restaurants', '🍽️'),
  ('auto-repair', 'Réparation auto', '🔧'),
  ('movers', 'Déménageurs', '🚚'),
  ('plumbers', 'Plombiers', '🔨'),
  ('cleaning', 'Nettoyage', '🧹'),
  ('electricians', 'Électriciens', '⚡'),
  ('salons', 'Salons', '💇'),
  ('cafes', 'Cafés', '☕'),
  ('nightlife', 'Vie nocturne', '🌙'),
  ('shopping', 'Magasinage', '🛍️'),
  ('health', 'Santé', '🏥'),
  ('hotels', 'Hôtels', '🏨'),
  ('fitness', 'Fitness', '💪'),
  ('pets', 'Animaux', '🐾'),
  ('education', 'Éducation', '📚'),
  ('contractors', 'Entrepreneurs', '🏗️');

-- Seed businesses
INSERT INTO public.businesses (name, description, phone, price_level, address, city, latitude, longitude, avg_rating, reviews_count, is_open, hours, amenities, photos) VALUES
  ('Chez Schwartz', 'Emblématique charcuterie montréalaise servant de la viande fumée depuis 1928.', '(514) 842-4813', 2, '3895 Boul St-Laurent, Montréal', 'Montréal', 45.5169, -73.5764, 4.5, 3, true, '11h - 22h', ARRAY['Terrasse', 'Livraison', 'Wi-Fi'], ARRAY[]::text[]),
  ('Café Olimpico', 'Café italien légendaire du Mile End, espresso authentique depuis 1970.', '(514) 495-0746', 1, '124 Rue Saint-Viateur O, Montréal', 'Montréal', 45.5237, -73.6005, 4.3, 2, true, '7h - 21h', ARRAY['Terrasse', 'Wi-Fi gratuit'], ARRAY[]::text[]),
  ('Garage Montréal Auto', 'Service mécanique complet avec diagnostic informatisé.', '(514) 555-0123', 2, '456 Rue Jarry E, Montréal', 'Montréal', 45.5442, -73.6095, 4.1, 1, true, '8h - 18h', ARRAY['Stationnement', 'Devis gratuit'], ARRAY[]::text[]),
  ('Nettoyage Éclat', 'Service de nettoyage résidentiel et commercial de première qualité.', '(514) 555-0456', 2, '789 Boul Rosemont, Montréal', 'Montréal', 45.5375, -73.5900, 4.7, 1, false, '9h - 17h', ARRAY['Produits écologiques', 'Assurance'], ARRAY[]::text[]),
  ('Beauté Prestige', 'Salon de beauté haut de gamme offrant manucure, pédicure et soins.', '(514) 555-0789', 3, '321 Ave Bernard O, Montréal', 'Montréal', 45.5205, -73.6100, 4.6, 2, true, '10h - 20h', ARRAY['Sur rendez-vous', 'Stationnement'], ARRAY[]::text[]),
  ('La Banquise', 'Temple de la poutine avec plus de 30 variétés, ouvert 24h.', '(514) 525-2415', 1, '994 Rue Rachel E, Montréal', 'Montréal', 45.5265, -73.5710, 4.4, 3, true, '24h', ARRAY['Terrasse', 'Ouvert 24h', 'Livraison'], ARRAY[]::text[]);
