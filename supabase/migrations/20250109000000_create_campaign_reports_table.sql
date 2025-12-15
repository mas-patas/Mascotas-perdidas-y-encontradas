-- Create campaign_reports table for user-submitted campaign reports
create table "public"."campaign_reports" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid,
  "user_email" text,
  "address" text not null,
  "social_link" text not null,
  "image_url" text,
  "district" text not null,
  "province" text not null,
  "department" text not null,
  "status" text not null default 'pending',
  "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
  "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."campaign_reports" enable row level security;

-- Create index for status filtering
create index "campaign_reports_status_idx" on "public"."campaign_reports" ("status");
create index "campaign_reports_created_at_idx" on "public"."campaign_reports" ("created_at");

-- RLS Policies
-- Users can insert their own reports
create policy "Users can create campaign reports"
  on "public"."campaign_reports"
  as permissive
  for insert
  to authenticated
  with check (true);

-- Only admins can view all reports
create policy "Admins can view all campaign reports"
  on "public"."campaign_reports"
  as permissive
  for select
  to public
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and (profiles.role = 'Admin'::text or profiles.role = 'Superadmin'::text)
    )
  );

-- Only admins can update/delete reports
create policy "Admins can manage campaign reports"
  on "public"."campaign_reports"
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

