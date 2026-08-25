-- ENUMS
CREATE TYPE public.app_role AS ENUM ('donor', 'receiver', 'admin');
CREATE TYPE public.verification_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');
CREATE TYPE public.donation_status AS ENUM ('AVAILABLE', 'ACCEPTED', 'PICKUP_SCHEDULED', 'COLLECTED', 'DELIVERED', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'FLAGGED');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ORGANIZATIONS
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  name text NOT NULL,
  org_type text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  pincode text NOT NULL DEFAULT '',
  lat double precision,
  lng double precision,
  license_number text NOT NULL DEFAULT '',
  service_area text NOT NULL DEFAULT '',
  pickup_radius_km integer NOT NULL DEFAULT 10,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_status public.verification_status NOT NULL DEFAULT 'PENDING',
  ai_review jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id)
);
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orgs_select_own" ON public.organizations FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "orgs_insert_own" ON public.organizations FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "orgs_update_own" ON public.organizations FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.is_verified(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE owner_id = _user_id AND role = _role AND verification_status = 'VERIFIED'
  );
$$;

-- DONATIONS
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  donor_org_name text NOT NULL DEFAULT '',
  donor_phone text NOT NULL DEFAULT '',
  donor_address text NOT NULL DEFAULT '',
  title text NOT NULL,
  category text NOT NULL DEFAULT 'cooked',
  description text NOT NULL DEFAULT '',
  quantity_value numeric NOT NULL DEFAULT 1,
  quantity_unit text NOT NULL DEFAULT 'servings',
  prepared_at timestamptz NOT NULL DEFAULT now(),
  pickup_deadline timestamptz NOT NULL,
  photo_url text,
  lat double precision,
  lng double precision,
  status public.donation_status NOT NULL DEFAULT 'AVAILABLE',
  receiver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  receiver_org_name text,
  receiver_contact_person text,
  receiver_phone text,
  vehicle_number text,
  accepted_at timestamptz,
  pickup_time timestamptz,
  team_size integer,
  pickup_note text,
  collected_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX donations_status_idx ON public.donations (status);
CREATE INDEX donations_donor_idx ON public.donations (donor_id);
CREATE INDEX donations_receiver_idx ON public.donations (receiver_id);
GRANT SELECT, INSERT, UPDATE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_select_donor" ON public.donations FOR SELECT TO authenticated USING (auth.uid() = donor_id);
CREATE POLICY "donations_select_receiver" ON public.donations FOR SELECT TO authenticated
  USING (auth.uid() = receiver_id OR (status = 'AVAILABLE' AND public.is_verified(auth.uid(), 'receiver')));
CREATE POLICY "donations_insert_donor" ON public.donations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = donor_id AND public.is_verified(auth.uid(), 'donor'));
CREATE POLICY "donations_update_donor" ON public.donations FOR UPDATE TO authenticated
  USING (auth.uid() = donor_id) WITH CHECK (auth.uid() = donor_id);

-- PICKUP CODES (donor-only visibility)
CREATE TABLE public.pickup_codes (
  donation_id uuid PRIMARY KEY REFERENCES public.donations(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pickup_codes TO authenticated;
GRANT ALL ON public.pickup_codes TO service_role;
ALTER TABLE public.pickup_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pickup_codes_select_donor" ON public.pickup_codes FOR SELECT TO authenticated USING (auth.uid() = donor_id);

-- TIMELINE
CREATE TABLE public.donation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  status public.donation_status NOT NULL,
  note text NOT NULL DEFAULT '',
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX donation_events_donation_idx ON public.donation_events (donation_id);
GRANT SELECT ON public.donation_events TO authenticated;
GRANT ALL ON public.donation_events TO service_role;
ALTER TABLE public.donation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donation_events_select_involved" ON public.donation_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.donations d
    WHERE d.id = donation_id AND (d.donor_id = auth.uid() OR d.receiver_id = auth.uid())
  ));

-- URGENCY SCORE
CREATE OR REPLACE FUNCTION public.urgency_score(_prepared_at timestamptz, _pickup_deadline timestamptz, _category text, _quantity numeric)
RETURNS numeric LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT LEAST(10, GREATEST(0,
    -- time remaining (0-5)
    CASE
      WHEN _pickup_deadline <= now() THEN 5
      WHEN _pickup_deadline <= now() + interval '1 hour' THEN 4.5
      WHEN _pickup_deadline <= now() + interval '3 hours' THEN 3.5
      WHEN _pickup_deadline <= now() + interval '6 hours' THEN 2.5
      WHEN _pickup_deadline <= now() + interval '12 hours' THEN 1.5
      ELSE 0.5
    END
    -- food age (0-2.5)
    + CASE
      WHEN _prepared_at <= now() - interval '6 hours' THEN 2.5
      WHEN _prepared_at <= now() - interval '3 hours' THEN 1.5
      WHEN _prepared_at <= now() - interval '1 hour' THEN 0.8
      ELSE 0.2
    END
    -- perishability (0-1.5)
    + CASE _category
      WHEN 'cooked' THEN 1.5
      WHEN 'dairy' THEN 1.4
      WHEN 'bakery' THEN 1.0
      WHEN 'fruits' THEN 0.8
      WHEN 'packaged' THEN 0.2
      ELSE 0.7
    END
    -- quantity (0-1)
    + CASE
      WHEN _quantity >= 200 THEN 1
      WHEN _quantity >= 100 THEN 0.7
      WHEN _quantity >= 30 THEN 0.4
      ELSE 0.1
    END
  ))::numeric;
$$;

-- new user -> profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_verified(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.urgency_score(timestamptz, timestamptz, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.urgency_score(timestamptz, timestamptz, text, numeric) TO authenticated;CREATE POLICY "food_photos_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'food-photos');
CREATE POLICY "food_photos_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "food_photos_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "food_photos_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);