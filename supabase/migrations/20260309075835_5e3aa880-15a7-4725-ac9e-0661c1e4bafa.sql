-- Allow authenticated users to insert their own roles
CREATE POLICY "Users can insert own roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow role updates (for upsert to work)
CREATE POLICY "Users can update own roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);