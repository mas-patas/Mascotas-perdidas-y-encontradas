-- Create banners table for carousel management
create table "public"."banners" (
  "id" uuid not null default gen_random_uuid(),
  "image_url" text not null,
  "title" text,
  "paragraph" text,
  "order" integer not null default 0,
  "is_active" boolean not null default true,
  "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
  "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."banners" enable row level security;

-- Create index for ordering
create index "banners_order_idx" on "public"."banners" ("order");

-- RLS Policies
-- Everyone can read active banners
create policy "Banners are public"
  on "public"."banners"
  as permissive
  for select
  to public
  using (is_active = true);

-- Only admins can insert/update/delete
create policy "Admins can manage banners"
  on "public"."banners"
  as permissive
  for all
  to public
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'Admin'::text or profiles.role = 'Superadmin'::text)
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'Admin'::text or profiles.role = 'Superadmin'::text)
    )
  );



