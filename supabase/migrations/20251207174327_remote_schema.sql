drop extension if exists "pg_net";

create extension if not exists "vector" with schema "public";


  create table "public"."banned_ips" (
    "id" uuid not null default gen_random_uuid(),
    "ip_address" text not null,
    "reason" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."banned_ips" enable row level security;


  create table "public"."business_products" (
    "id" uuid not null default gen_random_uuid(),
    "business_id" uuid,
    "name" text not null,
    "description" text,
    "price" numeric,
    "image_url" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."business_products" enable row level security;


  create table "public"."businesses" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid,
    "name" text not null,
    "type" text not null,
    "description" text,
    "address" text,
    "phone" text,
    "whatsapp" text,
    "website" text,
    "facebook" text,
    "instagram" text,
    "logo_url" text,
    "cover_url" text,
    "services" text[] default '{}'::text[],
    "lat" double precision,
    "lng" double precision,
    "is_verified" boolean default false,
    "created_at" timestamp with time zone default now(),
    "banner_url" text
      );


alter table "public"."businesses" enable row level security;


  create table "public"."campaigns" (
    "id" text not null default gen_random_uuid(),
    "user_email" text,
    "type" text,
    "title" text,
    "description" text,
    "location" text,
    "date" timestamp with time zone,
    "image_urls" text[],
    "contact_phone" text,
    "lat" double precision,
    "lng" double precision,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."campaigns" enable row level security;


  create table "public"."chats" (
    "id" text not null default gen_random_uuid(),
    "pet_id" uuid,
    "participant_emails" text[],
    "messages" jsonb default '[]'::jsonb,
    "last_read_timestamps" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."chats" enable row level security;


  create table "public"."comment_likes" (
    "user_id" uuid not null,
    "comment_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."comment_likes" enable row level security;


  create table "public"."comments" (
    "id" uuid not null default gen_random_uuid(),
    "pet_id" uuid,
    "user_email" text not null,
    "user_name" text not null,
    "text" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "parent_id" uuid,
    "user_id" uuid
      );


alter table "public"."comments" enable row level security;


  create table "public"."messages" (
    "id" text not null default gen_random_uuid(),
    "chat_id" text,
    "sender_email" text,
    "text" text,
    "timestamp" timestamp with time zone default now(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."messages" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "message" text not null,
    "link" jsonb,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."notifications" enable row level security;


  create table "public"."pets" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "status" text not null,
    "name" text,
    "animal_type" text not null,
    "breed" text,
    "color" text,
    "size" text,
    "description" text,
    "location" text,
    "lat" double precision,
    "lng" double precision,
    "date" timestamp with time zone,
    "contact" text,
    "image_urls" text[],
    "share_contact_info" boolean default true,
    "adoption_requirements" text,
    "contact_requests" text[],
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "comments" jsonb default '[]'::jsonb,
    "expires_at" timestamp with time zone,
    "reward" integer,
    "currency" text default 'S/'::text,
    "embedding" public.vector(768),
    "reunion_story" text,
    "reunion_image_url" text,
    "reunion_date" date
      );


alter table "public"."pets" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "username" text,
    "first_name" text,
    "last_name" text,
    "phone" text,
    "dni" text,
    "avatar_url" text,
    "role" text default 'User'::text,
    "status" text default 'Activo'::text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now()),
    "owned_pets" jsonb default '[]'::jsonb,
    "saved_pet_ids" text[] default '{}'::text[],
    "last_ip" text,
    "country" text default 'Perú'::text,
    "birth_date" date
      );


alter table "public"."profiles" enable row level security;


  create table "public"."push_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "endpoint" text not null,
    "p256dh" text not null,
    "auth" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."push_subscriptions" enable row level security;


  create table "public"."reports" (
    "id" text not null default gen_random_uuid(),
    "reporter_email" text,
    "reported_email" text,
    "type" text,
    "target_id" text,
    "reason" text,
    "details" text,
    "timestamp" timestamp with time zone,
    "status" text,
    "post_snapshot" jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."reports" enable row level security;


  create table "public"."saved_searches" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "filters" jsonb not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."saved_searches" enable row level security;


  create table "public"."support_tickets" (
    "id" text not null default gen_random_uuid(),
    "user_email" text,
    "category" text,
    "subject" text,
    "description" text,
    "timestamp" timestamp with time zone,
    "status" text,
    "assigned_to" text,
    "assignment_history" jsonb default '[]'::jsonb,
    "response" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "related_report_id" text
      );


alter table "public"."support_tickets" enable row level security;


  create table "public"."user_activity_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "action_type" text not null,
    "points" integer not null default 0,
    "details" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."user_activity_logs" enable row level security;


  create table "public"."user_ratings" (
    "id" uuid not null default gen_random_uuid(),
    "rater_id" uuid not null,
    "rated_user_id" uuid not null,
    "rating" integer not null,
    "comment" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."user_ratings" enable row level security;

CREATE UNIQUE INDEX banned_ips_ip_address_key ON public.banned_ips USING btree (ip_address);

CREATE UNIQUE INDEX banned_ips_pkey ON public.banned_ips USING btree (id);

CREATE UNIQUE INDEX business_products_pkey ON public.business_products USING btree (id);

CREATE UNIQUE INDEX businesses_pkey ON public.businesses USING btree (id);

CREATE UNIQUE INDEX campaigns_pkey ON public.campaigns USING btree (id);

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (id);

CREATE UNIQUE INDEX comment_likes_pkey ON public.comment_likes USING btree (user_id, comment_id);

CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id);

CREATE INDEX idx_businesses_location ON public.businesses USING btree (lat, lng);

CREATE INDEX idx_businesses_owner ON public.businesses USING btree (owner_id);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_pets_reunion_date ON public.pets USING btree (reunion_date DESC);

CREATE INDEX idx_products_business ON public.business_products USING btree (business_id);

CREATE INDEX idx_support_tickets_related_report_id ON public.support_tickets USING btree (related_report_id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX pets_pkey ON public.pets USING btree (id);

CREATE UNIQUE INDEX profiles_dni_key ON public.profiles USING btree (dni);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_phone_key ON public.profiles USING btree (phone);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX push_subscriptions_endpoint_key ON public.push_subscriptions USING btree (endpoint);

CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id);

CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id);

CREATE UNIQUE INDEX saved_searches_pkey ON public.saved_searches USING btree (id);

CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (id);

CREATE UNIQUE INDEX user_activity_logs_pkey ON public.user_activity_logs USING btree (id);

CREATE INDEX user_activity_logs_user_id_idx ON public.user_activity_logs USING btree (user_id);

CREATE UNIQUE INDEX user_ratings_pkey ON public.user_ratings USING btree (id);

alter table "public"."banned_ips" add constraint "banned_ips_pkey" PRIMARY KEY using index "banned_ips_pkey";

alter table "public"."business_products" add constraint "business_products_pkey" PRIMARY KEY using index "business_products_pkey";

alter table "public"."businesses" add constraint "businesses_pkey" PRIMARY KEY using index "businesses_pkey";

alter table "public"."campaigns" add constraint "campaigns_pkey" PRIMARY KEY using index "campaigns_pkey";

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."comment_likes" add constraint "comment_likes_pkey" PRIMARY KEY using index "comment_likes_pkey";

alter table "public"."comments" add constraint "comments_pkey" PRIMARY KEY using index "comments_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."pets" add constraint "pets_pkey" PRIMARY KEY using index "pets_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_pkey" PRIMARY KEY using index "push_subscriptions_pkey";

alter table "public"."reports" add constraint "reports_pkey" PRIMARY KEY using index "reports_pkey";

alter table "public"."saved_searches" add constraint "saved_searches_pkey" PRIMARY KEY using index "saved_searches_pkey";

alter table "public"."support_tickets" add constraint "support_tickets_pkey" PRIMARY KEY using index "support_tickets_pkey";

alter table "public"."user_activity_logs" add constraint "user_activity_logs_pkey" PRIMARY KEY using index "user_activity_logs_pkey";

alter table "public"."user_ratings" add constraint "user_ratings_pkey" PRIMARY KEY using index "user_ratings_pkey";

alter table "public"."banned_ips" add constraint "banned_ips_ip_address_key" UNIQUE using index "banned_ips_ip_address_key";

alter table "public"."business_products" add constraint "business_products_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE not valid;

alter table "public"."business_products" validate constraint "business_products_business_id_fkey";

alter table "public"."businesses" add constraint "businesses_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."businesses" validate constraint "businesses_owner_id_fkey";

alter table "public"."chats" add constraint "chats_pet_id_fkey" FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE SET NULL not valid;

alter table "public"."chats" validate constraint "chats_pet_id_fkey";

alter table "public"."comment_likes" add constraint "comment_likes_comment_id_fkey" FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE not valid;

alter table "public"."comment_likes" validate constraint "comment_likes_comment_id_fkey";

alter table "public"."comment_likes" add constraint "comment_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."comment_likes" validate constraint "comment_likes_user_id_fkey";

alter table "public"."comments" add constraint "comments_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_parent_id_fkey";

alter table "public"."comments" add constraint "comments_pet_id_fkey" FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_pet_id_fkey";

alter table "public"."comments" add constraint "comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."comments" validate constraint "comments_user_id_fkey";

alter table "public"."messages" add constraint "messages_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_chat_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."pets" add constraint "pets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."pets" validate constraint "pets_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_dni_key" UNIQUE using index "profiles_dni_key";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_phone_key" UNIQUE using index "profiles_phone_key";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_endpoint_key" UNIQUE using index "push_subscriptions_endpoint_key";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."push_subscriptions" validate constraint "push_subscriptions_user_id_fkey";

alter table "public"."saved_searches" add constraint "saved_searches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."saved_searches" validate constraint "saved_searches_user_id_fkey";

alter table "public"."support_tickets" add constraint "support_tickets_related_report_id_fkey" FOREIGN KEY (related_report_id) REFERENCES public.reports(id) ON DELETE SET NULL not valid;

alter table "public"."support_tickets" validate constraint "support_tickets_related_report_id_fkey";

alter table "public"."user_activity_logs" add constraint "user_activity_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_activity_logs" validate constraint "user_activity_logs_user_id_fkey";

alter table "public"."user_ratings" add constraint "user_ratings_rated_user_id_fkey" FOREIGN KEY (rated_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_ratings" validate constraint "user_ratings_rated_user_id_fkey";

alter table "public"."user_ratings" add constraint "user_ratings_rater_id_fkey" FOREIGN KEY (rater_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_ratings" validate constraint "user_ratings_rater_id_fkey";

alter table "public"."user_ratings" add constraint "user_ratings_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."user_ratings" validate constraint "user_ratings_rating_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_auth_email()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT email FROM auth.users WHERE id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard()
 RETURNS TABLE(user_id uuid, username text, avatar_url text, total_points bigint, rank bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  return query
  select
    p.id as user_id,
    p.username,
    p.avatar_url,
    coalesce(sum(l.points), 0) as total_points,
    rank() over (order by coalesce(sum(l.points), 0) desc) as rank
  from
    profiles p
  inner join -- Usamos inner join para traer solo usuarios con actividad reciente
    user_activity_logs l on p.id = l.user_id
  where
    l.created_at > (now() - interval '7 days')
  group by
    p.id, p.username, p.avatar_url
  order by
    total_points desc
  limit 50;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_pet_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    search_rec RECORD;
    pet_dept TEXT;
    last_notification_time TIMESTAMPTZ;
BEGIN
    -- Intentar extraer el departamento de la ubicación de la nueva mascota
    -- Asumimos formato "Direccion, Distrito, Provincia, Departamento" o similar.
    -- Buscamos si la ubicación contiene el texto del filtro.
    
    FOR search_rec IN 
        SELECT * FROM public.saved_searches
    LOOP
        -- A. Verificar coincidencia de filtros
        IF (
            (search_rec.filters->>'status' = 'Todos' OR search_rec.filters->>'status' = NEW.status) AND
            (search_rec.filters->>'type' = 'Todos' OR search_rec.filters->>'type' = NEW.animal_type) AND
            (search_rec.filters->>'breed' = 'Todos' OR search_rec.filters->>'breed' = NEW.breed) AND
            (
                search_rec.filters->>'department' = 'Todos' OR 
                NEW.location ILIKE '%' || (search_rec.filters->>'department') || '%'
            )
        ) THEN
            
            -- B. Verificar Límite de Tasa (Rate Limiting) - 1 Notificación por hora
            SELECT created_at INTO last_notification_time
            FROM public.notifications
            WHERE user_id = search_rec.user_id
            AND message LIKE '¡Alerta de Búsqueda!%' -- Solo verificamos alertas de búsqueda
            ORDER BY created_at DESC
            LIMIT 1;

            -- Si no hay notificaciones previas O la última fue hace más de 1 hora
            IF last_notification_time IS NULL OR last_notification_time < (NOW() - INTERVAL '1 hour') THEN
                
                INSERT INTO public.notifications (
                    id,
                    user_id,
                    message,
                    link,
                    is_read,
                    created_at
                ) VALUES (
                    gen_random_uuid(),
                    search_rec.user_id,
                    '¡Alerta de Búsqueda! Una nueva mascota coincide con "' || search_rec.name || '".',
                    jsonb_build_object('type', 'pet', 'id', NEW.id),
                    false,
                    NOW()
                );
                
                -- Salimos del loop para este usuario específico para no spamearlo si tiene 2 búsquedas que coinciden con la misma mascota
                -- (Opcional: Si quieres que reciba por cada búsqueda distinta, quita el CONTINUE/EXIT, pero el rate limit de arriba ya lo frenará).
            END IF;

        END IF;
    END LOOP;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'User');
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_user_ip_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update public.profiles
  set last_ip = new.raw_user_meta_data->>'ip_address' -- A veces Supabase guarda aquí la IP si usas auth hooks
  where id = new.id;
  
  -- NOTA IMPORTANTE: 
  -- Por defecto, Supabase Auth no expone la IP fácilmente en triggers simples.
  -- La forma más robusta SIN configurar Edge Functions complejas es mirar
  -- la tabla `auth.sessions` manualmente en el dashboard de Supabase
  -- o confiar en la IP que reporta el cliente (menos seguro pero funcional para apps web).
  
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('Admin', 'Superadmin')
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_pets(query_embedding public.vector, match_threshold double precision, match_count integer, filter_status text, filter_type text)
 RETURNS TABLE(id uuid, name text, description text, status text, image_urls text[], similarity double precision)
 LANGUAGE plpgsql
AS $function$
begin
  return query
  select
    pets.id,
    pets.name,
    pets.description,
    pets.status,
    pets.image_urls,
    1 - (pets.embedding <=> query_embedding) as similarity
  from pets
  where 1 - (pets.embedding <=> query_embedding) > match_threshold
  and pets.status = filter_status
  and pets.animal_type = filter_type
  order by pets.embedding <=> query_embedding
  limit match_count;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.request_pet_contact(pet_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Agrega el email del usuario actual al array contact_requests si no existe ya
  UPDATE pets
  SET contact_requests = array_append(COALESCE(contact_requests, '{}'), auth.email())
  WHERE id = pet_id
  AND NOT (COALESCE(contact_requests, '{}') @> ARRAY[auth.email()::text]);
END;
$function$
;

grant delete on table "public"."banned_ips" to "anon";

grant insert on table "public"."banned_ips" to "anon";

grant references on table "public"."banned_ips" to "anon";

grant select on table "public"."banned_ips" to "anon";

grant trigger on table "public"."banned_ips" to "anon";

grant truncate on table "public"."banned_ips" to "anon";

grant update on table "public"."banned_ips" to "anon";

grant delete on table "public"."banned_ips" to "authenticated";

grant insert on table "public"."banned_ips" to "authenticated";

grant references on table "public"."banned_ips" to "authenticated";

grant select on table "public"."banned_ips" to "authenticated";

grant trigger on table "public"."banned_ips" to "authenticated";

grant truncate on table "public"."banned_ips" to "authenticated";

grant update on table "public"."banned_ips" to "authenticated";

grant delete on table "public"."banned_ips" to "service_role";

grant insert on table "public"."banned_ips" to "service_role";

grant references on table "public"."banned_ips" to "service_role";

grant select on table "public"."banned_ips" to "service_role";

grant trigger on table "public"."banned_ips" to "service_role";

grant truncate on table "public"."banned_ips" to "service_role";

grant update on table "public"."banned_ips" to "service_role";

grant delete on table "public"."business_products" to "anon";

grant insert on table "public"."business_products" to "anon";

grant references on table "public"."business_products" to "anon";

grant select on table "public"."business_products" to "anon";

grant trigger on table "public"."business_products" to "anon";

grant truncate on table "public"."business_products" to "anon";

grant update on table "public"."business_products" to "anon";

grant delete on table "public"."business_products" to "authenticated";

grant insert on table "public"."business_products" to "authenticated";

grant references on table "public"."business_products" to "authenticated";

grant select on table "public"."business_products" to "authenticated";

grant trigger on table "public"."business_products" to "authenticated";

grant truncate on table "public"."business_products" to "authenticated";

grant update on table "public"."business_products" to "authenticated";

grant delete on table "public"."business_products" to "service_role";

grant insert on table "public"."business_products" to "service_role";

grant references on table "public"."business_products" to "service_role";

grant select on table "public"."business_products" to "service_role";

grant trigger on table "public"."business_products" to "service_role";

grant truncate on table "public"."business_products" to "service_role";

grant update on table "public"."business_products" to "service_role";

grant delete on table "public"."businesses" to "anon";

grant insert on table "public"."businesses" to "anon";

grant references on table "public"."businesses" to "anon";

grant select on table "public"."businesses" to "anon";

grant trigger on table "public"."businesses" to "anon";

grant truncate on table "public"."businesses" to "anon";

grant update on table "public"."businesses" to "anon";

grant delete on table "public"."businesses" to "authenticated";

grant insert on table "public"."businesses" to "authenticated";

grant references on table "public"."businesses" to "authenticated";

grant select on table "public"."businesses" to "authenticated";

grant trigger on table "public"."businesses" to "authenticated";

grant truncate on table "public"."businesses" to "authenticated";

grant update on table "public"."businesses" to "authenticated";

grant delete on table "public"."businesses" to "service_role";

grant insert on table "public"."businesses" to "service_role";

grant references on table "public"."businesses" to "service_role";

grant select on table "public"."businesses" to "service_role";

grant trigger on table "public"."businesses" to "service_role";

grant truncate on table "public"."businesses" to "service_role";

grant update on table "public"."businesses" to "service_role";

grant delete on table "public"."campaigns" to "anon";

grant insert on table "public"."campaigns" to "anon";

grant references on table "public"."campaigns" to "anon";

grant select on table "public"."campaigns" to "anon";

grant trigger on table "public"."campaigns" to "anon";

grant truncate on table "public"."campaigns" to "anon";

grant update on table "public"."campaigns" to "anon";

grant delete on table "public"."campaigns" to "authenticated";

grant insert on table "public"."campaigns" to "authenticated";

grant references on table "public"."campaigns" to "authenticated";

grant select on table "public"."campaigns" to "authenticated";

grant trigger on table "public"."campaigns" to "authenticated";

grant truncate on table "public"."campaigns" to "authenticated";

grant update on table "public"."campaigns" to "authenticated";

grant delete on table "public"."campaigns" to "service_role";

grant insert on table "public"."campaigns" to "service_role";

grant references on table "public"."campaigns" to "service_role";

grant select on table "public"."campaigns" to "service_role";

grant trigger on table "public"."campaigns" to "service_role";

grant truncate on table "public"."campaigns" to "service_role";

grant update on table "public"."campaigns" to "service_role";

grant delete on table "public"."chats" to "anon";

grant insert on table "public"."chats" to "anon";

grant references on table "public"."chats" to "anon";

grant select on table "public"."chats" to "anon";

grant trigger on table "public"."chats" to "anon";

grant truncate on table "public"."chats" to "anon";

grant update on table "public"."chats" to "anon";

grant delete on table "public"."chats" to "authenticated";

grant insert on table "public"."chats" to "authenticated";

grant references on table "public"."chats" to "authenticated";

grant select on table "public"."chats" to "authenticated";

grant trigger on table "public"."chats" to "authenticated";

grant truncate on table "public"."chats" to "authenticated";

grant update on table "public"."chats" to "authenticated";

grant delete on table "public"."chats" to "service_role";

grant insert on table "public"."chats" to "service_role";

grant references on table "public"."chats" to "service_role";

grant select on table "public"."chats" to "service_role";

grant trigger on table "public"."chats" to "service_role";

grant truncate on table "public"."chats" to "service_role";

grant update on table "public"."chats" to "service_role";

grant delete on table "public"."comment_likes" to "anon";

grant insert on table "public"."comment_likes" to "anon";

grant references on table "public"."comment_likes" to "anon";

grant select on table "public"."comment_likes" to "anon";

grant trigger on table "public"."comment_likes" to "anon";

grant truncate on table "public"."comment_likes" to "anon";

grant update on table "public"."comment_likes" to "anon";

grant delete on table "public"."comment_likes" to "authenticated";

grant insert on table "public"."comment_likes" to "authenticated";

grant references on table "public"."comment_likes" to "authenticated";

grant select on table "public"."comment_likes" to "authenticated";

grant trigger on table "public"."comment_likes" to "authenticated";

grant truncate on table "public"."comment_likes" to "authenticated";

grant update on table "public"."comment_likes" to "authenticated";

grant delete on table "public"."comment_likes" to "service_role";

grant insert on table "public"."comment_likes" to "service_role";

grant references on table "public"."comment_likes" to "service_role";

grant select on table "public"."comment_likes" to "service_role";

grant trigger on table "public"."comment_likes" to "service_role";

grant truncate on table "public"."comment_likes" to "service_role";

grant update on table "public"."comment_likes" to "service_role";

grant delete on table "public"."comments" to "anon";

grant insert on table "public"."comments" to "anon";

grant references on table "public"."comments" to "anon";

grant select on table "public"."comments" to "anon";

grant trigger on table "public"."comments" to "anon";

grant truncate on table "public"."comments" to "anon";

grant update on table "public"."comments" to "anon";

grant delete on table "public"."comments" to "authenticated";

grant insert on table "public"."comments" to "authenticated";

grant references on table "public"."comments" to "authenticated";

grant select on table "public"."comments" to "authenticated";

grant trigger on table "public"."comments" to "authenticated";

grant truncate on table "public"."comments" to "authenticated";

grant update on table "public"."comments" to "authenticated";

grant delete on table "public"."comments" to "service_role";

grant insert on table "public"."comments" to "service_role";

grant references on table "public"."comments" to "service_role";

grant select on table "public"."comments" to "service_role";

grant trigger on table "public"."comments" to "service_role";

grant truncate on table "public"."comments" to "service_role";

grant update on table "public"."comments" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."pets" to "anon";

grant insert on table "public"."pets" to "anon";

grant references on table "public"."pets" to "anon";

grant select on table "public"."pets" to "anon";

grant trigger on table "public"."pets" to "anon";

grant truncate on table "public"."pets" to "anon";

grant update on table "public"."pets" to "anon";

grant delete on table "public"."pets" to "authenticated";

grant insert on table "public"."pets" to "authenticated";

grant references on table "public"."pets" to "authenticated";

grant select on table "public"."pets" to "authenticated";

grant trigger on table "public"."pets" to "authenticated";

grant truncate on table "public"."pets" to "authenticated";

grant update on table "public"."pets" to "authenticated";

grant delete on table "public"."pets" to "service_role";

grant insert on table "public"."pets" to "service_role";

grant references on table "public"."pets" to "service_role";

grant select on table "public"."pets" to "service_role";

grant trigger on table "public"."pets" to "service_role";

grant truncate on table "public"."pets" to "service_role";

grant update on table "public"."pets" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."push_subscriptions" to "anon";

grant insert on table "public"."push_subscriptions" to "anon";

grant references on table "public"."push_subscriptions" to "anon";

grant select on table "public"."push_subscriptions" to "anon";

grant trigger on table "public"."push_subscriptions" to "anon";

grant truncate on table "public"."push_subscriptions" to "anon";

grant update on table "public"."push_subscriptions" to "anon";

grant delete on table "public"."push_subscriptions" to "authenticated";

grant insert on table "public"."push_subscriptions" to "authenticated";

grant references on table "public"."push_subscriptions" to "authenticated";

grant select on table "public"."push_subscriptions" to "authenticated";

grant trigger on table "public"."push_subscriptions" to "authenticated";

grant truncate on table "public"."push_subscriptions" to "authenticated";

grant update on table "public"."push_subscriptions" to "authenticated";

grant delete on table "public"."push_subscriptions" to "service_role";

grant insert on table "public"."push_subscriptions" to "service_role";

grant references on table "public"."push_subscriptions" to "service_role";

grant select on table "public"."push_subscriptions" to "service_role";

grant trigger on table "public"."push_subscriptions" to "service_role";

grant truncate on table "public"."push_subscriptions" to "service_role";

grant update on table "public"."push_subscriptions" to "service_role";

grant delete on table "public"."reports" to "anon";

grant insert on table "public"."reports" to "anon";

grant references on table "public"."reports" to "anon";

grant select on table "public"."reports" to "anon";

grant trigger on table "public"."reports" to "anon";

grant truncate on table "public"."reports" to "anon";

grant update on table "public"."reports" to "anon";

grant delete on table "public"."reports" to "authenticated";

grant insert on table "public"."reports" to "authenticated";

grant references on table "public"."reports" to "authenticated";

grant select on table "public"."reports" to "authenticated";

grant trigger on table "public"."reports" to "authenticated";

grant truncate on table "public"."reports" to "authenticated";

grant update on table "public"."reports" to "authenticated";

grant delete on table "public"."reports" to "service_role";

grant insert on table "public"."reports" to "service_role";

grant references on table "public"."reports" to "service_role";

grant select on table "public"."reports" to "service_role";

grant trigger on table "public"."reports" to "service_role";

grant truncate on table "public"."reports" to "service_role";

grant update on table "public"."reports" to "service_role";

grant delete on table "public"."saved_searches" to "anon";

grant insert on table "public"."saved_searches" to "anon";

grant references on table "public"."saved_searches" to "anon";

grant select on table "public"."saved_searches" to "anon";

grant trigger on table "public"."saved_searches" to "anon";

grant truncate on table "public"."saved_searches" to "anon";

grant update on table "public"."saved_searches" to "anon";

grant delete on table "public"."saved_searches" to "authenticated";

grant insert on table "public"."saved_searches" to "authenticated";

grant references on table "public"."saved_searches" to "authenticated";

grant select on table "public"."saved_searches" to "authenticated";

grant trigger on table "public"."saved_searches" to "authenticated";

grant truncate on table "public"."saved_searches" to "authenticated";

grant update on table "public"."saved_searches" to "authenticated";

grant delete on table "public"."saved_searches" to "service_role";

grant insert on table "public"."saved_searches" to "service_role";

grant references on table "public"."saved_searches" to "service_role";

grant select on table "public"."saved_searches" to "service_role";

grant trigger on table "public"."saved_searches" to "service_role";

grant truncate on table "public"."saved_searches" to "service_role";

grant update on table "public"."saved_searches" to "service_role";

grant delete on table "public"."support_tickets" to "anon";

grant insert on table "public"."support_tickets" to "anon";

grant references on table "public"."support_tickets" to "anon";

grant select on table "public"."support_tickets" to "anon";

grant trigger on table "public"."support_tickets" to "anon";

grant truncate on table "public"."support_tickets" to "anon";

grant update on table "public"."support_tickets" to "anon";

grant delete on table "public"."support_tickets" to "authenticated";

grant insert on table "public"."support_tickets" to "authenticated";

grant references on table "public"."support_tickets" to "authenticated";

grant select on table "public"."support_tickets" to "authenticated";

grant trigger on table "public"."support_tickets" to "authenticated";

grant truncate on table "public"."support_tickets" to "authenticated";

grant update on table "public"."support_tickets" to "authenticated";

grant delete on table "public"."support_tickets" to "service_role";

grant insert on table "public"."support_tickets" to "service_role";

grant references on table "public"."support_tickets" to "service_role";

grant select on table "public"."support_tickets" to "service_role";

grant trigger on table "public"."support_tickets" to "service_role";

grant truncate on table "public"."support_tickets" to "service_role";

grant update on table "public"."support_tickets" to "service_role";

grant delete on table "public"."user_activity_logs" to "anon";

grant insert on table "public"."user_activity_logs" to "anon";

grant references on table "public"."user_activity_logs" to "anon";

grant select on table "public"."user_activity_logs" to "anon";

grant trigger on table "public"."user_activity_logs" to "anon";

grant truncate on table "public"."user_activity_logs" to "anon";

grant update on table "public"."user_activity_logs" to "anon";

grant delete on table "public"."user_activity_logs" to "authenticated";

grant insert on table "public"."user_activity_logs" to "authenticated";

grant references on table "public"."user_activity_logs" to "authenticated";

grant select on table "public"."user_activity_logs" to "authenticated";

grant trigger on table "public"."user_activity_logs" to "authenticated";

grant truncate on table "public"."user_activity_logs" to "authenticated";

grant update on table "public"."user_activity_logs" to "authenticated";

grant delete on table "public"."user_activity_logs" to "service_role";

grant insert on table "public"."user_activity_logs" to "service_role";

grant references on table "public"."user_activity_logs" to "service_role";

grant select on table "public"."user_activity_logs" to "service_role";

grant trigger on table "public"."user_activity_logs" to "service_role";

grant truncate on table "public"."user_activity_logs" to "service_role";

grant update on table "public"."user_activity_logs" to "service_role";

grant delete on table "public"."user_ratings" to "anon";

grant insert on table "public"."user_ratings" to "anon";

grant references on table "public"."user_ratings" to "anon";

grant select on table "public"."user_ratings" to "anon";

grant trigger on table "public"."user_ratings" to "anon";

grant truncate on table "public"."user_ratings" to "anon";

grant update on table "public"."user_ratings" to "anon";

grant delete on table "public"."user_ratings" to "authenticated";

grant insert on table "public"."user_ratings" to "authenticated";

grant references on table "public"."user_ratings" to "authenticated";

grant select on table "public"."user_ratings" to "authenticated";

grant trigger on table "public"."user_ratings" to "authenticated";

grant truncate on table "public"."user_ratings" to "authenticated";

grant update on table "public"."user_ratings" to "authenticated";

grant delete on table "public"."user_ratings" to "service_role";

grant insert on table "public"."user_ratings" to "service_role";

grant references on table "public"."user_ratings" to "service_role";

grant select on table "public"."user_ratings" to "service_role";

grant trigger on table "public"."user_ratings" to "service_role";

grant truncate on table "public"."user_ratings" to "service_role";

grant update on table "public"."user_ratings" to "service_role";


  create policy "Admins manage banned ips"
  on "public"."banned_ips"
  as permissive
  for all
  to public
using (public.is_admin());



  create policy "Enable delete for admins"
  on "public"."banned_ips"
  as permissive
  for delete
  to public
using (true);



  create policy "Enable insert for admins"
  on "public"."banned_ips"
  as permissive
  for insert
  to public
with check (true);



  create policy "Enable read access for all users"
  on "public"."banned_ips"
  as permissive
  for select
  to public
using (true);



  create policy "Owners can manage products"
  on "public"."business_products"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = business_products.business_id) AND ((businesses.owner_id = auth.uid()) OR public.is_admin())))));



  create policy "Owners manage products"
  on "public"."business_products"
  as permissive
  for all
  to public
using (((EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = business_products.business_id) AND (businesses.owner_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['Admin'::text, 'Superadmin'::text])))))));



  create policy "Products are public"
  on "public"."business_products"
  as permissive
  for select
  to public
using (true);



  create policy "Public products view"
  on "public"."business_products"
  as permissive
  for select
  to public
using (true);



  create policy "Admins create businesses"
  on "public"."businesses"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['Admin'::text, 'Superadmin'::text]))))));



  create policy "Admins delete businesses"
  on "public"."businesses"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['Admin'::text, 'Superadmin'::text]))))));



  create policy "Businesses are public"
  on "public"."businesses"
  as permissive
  for select
  to public
using (true);



  create policy "Owners can manage business"
  on "public"."businesses"
  as permissive
  for all
  to public
using (((auth.uid() = owner_id) OR public.is_admin()));



  create policy "Owners update their business"
  on "public"."businesses"
  as permissive
  for update
  to public
using (((auth.uid() = owner_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['Admin'::text, 'Superadmin'::text])))))));



  create policy "Public businesses view"
  on "public"."businesses"
  as permissive
  for select
  to public
using (true);



  create policy "Acceso total a autenticados"
  on "public"."campaigns"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Acceso total auth campaigns"
  on "public"."campaigns"
  as permissive
  for all
  to public
using (true);



  create policy "Authenticated users can create campaigns"
  on "public"."campaigns"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Campaigns are public"
  on "public"."campaigns"
  as permissive
  for select
  to public
using (true);



  create policy "Creators or Admins can update/delete campaigns"
  on "public"."campaigns"
  as permissive
  for all
  to public
using (((public.get_auth_email() = user_email) OR public.is_admin()));



  create policy "Lectura publica de campañas"
  on "public"."campaigns"
  as permissive
  for select
  to public
using (true);



  create policy "Public access campaigns"
  on "public"."campaigns"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Acceso total a autenticados"
  on "public"."chats"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Acceso total auth chats"
  on "public"."chats"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Participants can update chats"
  on "public"."chats"
  as permissive
  for update
  to public
using ((public.get_auth_email() = ANY (participant_emails)));



  create policy "Public access chats"
  on "public"."chats"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users can create chats"
  on "public"."chats"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Users can view their chats"
  on "public"."chats"
  as permissive
  for select
  to public
using (((public.get_auth_email() = ANY (participant_emails)) OR public.is_admin()));



  create policy "Auth delete likes"
  on "public"."comment_likes"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Auth insert likes"
  on "public"."comment_likes"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Comment likes are public"
  on "public"."comment_likes"
  as permissive
  for select
  to public
using (true);



  create policy "Cualquiera puede ver likes"
  on "public"."comment_likes"
  as permissive
  for select
  to public
using (true);



  create policy "Public read likes"
  on "public"."comment_likes"
  as permissive
  for select
  to public
using (true);



  create policy "Users manage their likes"
  on "public"."comment_likes"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Usuarios autenticados pueden dar/quitar like"
  on "public"."comment_likes"
  as permissive
  for all
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Acceso total a autenticados"
  on "public"."comments"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Authenticated users can comment"
  on "public"."comments"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Comments are public"
  on "public"."comments"
  as permissive
  for select
  to public
using (true);



  create policy "Lectura publica de comentarios"
  on "public"."comments"
  as permissive
  for select
  to public
using (true);



  create policy "Public access comments"
  on "public"."comments"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users can delete own comments"
  on "public"."comments"
  as permissive
  for delete
  to public
using (((auth.uid() = user_id) OR public.is_admin()));



  create policy "Acceso total a autenticados"
  on "public"."messages"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Public access messages"
  on "public"."messages"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users can insert messages in their chats"
  on "public"."messages"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.chats
  WHERE ((chats.id = messages.chat_id) AND (public.get_auth_email() = ANY (chats.participant_emails))))));



  create policy "Users can view messages of their chats"
  on "public"."messages"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.chats
  WHERE ((chats.id = messages.chat_id) AND ((public.get_auth_email() = ANY (chats.participant_emails)) OR public.is_admin())))));



  create policy "Anyone can insert notifications"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Users can update their own notifications"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users manage own notifications"
  on "public"."notifications"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users view own notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Acceso total a autenticados"
  on "public"."pets"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Authenticated users can insert pets"
  on "public"."pets"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Cualquiera puede ver mascotas"
  on "public"."pets"
  as permissive
  for select
  to public
using (true);



  create policy "Lectura publica de mascotas"
  on "public"."pets"
  as permissive
  for select
  to public
using (true);



  create policy "Pets are viewable by everyone"
  on "public"."pets"
  as permissive
  for select
  to public
using (true);



  create policy "Public access pets"
  on "public"."pets"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users can delete own pets"
  on "public"."pets"
  as permissive
  for delete
  to public
using (((auth.uid() = user_id) OR public.is_admin()));



  create policy "Users can update own pets"
  on "public"."pets"
  as permissive
  for update
  to public
using (((auth.uid() = user_id) OR public.is_admin()));



  create policy "Usuarios autenticados pueden crear mascotas"
  on "public"."pets"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Usuarios solo pueden editar sus propias mascotas"
  on "public"."pets"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Usuarios solo pueden eliminar sus propias mascotas"
  on "public"."pets"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Acceso total a autenticados"
  on "public"."profiles"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Lectura publica de perfiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Perfiles públicos son visibles por todos"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Public access profiles"
  on "public"."profiles"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Public profiles are viewable by everyone"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Superadmins pueden actualizar cualquier perfil"
  on "public"."profiles"
  as permissive
  for update
  to public
using (((( SELECT profiles_1.role
   FROM public.profiles profiles_1
  WHERE (profiles_1.id = auth.uid())) = 'Superadmin'::text) OR (auth.uid() = id)));



  create policy "Users can insert their own profile"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using (((auth.uid() = id) OR public.is_admin()));



  create policy "Usuarios pueden actualizar su propio perfil"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Usuarios pueden insertar su propio perfil"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can delete their own subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can select their own subscriptions"
  on "public"."push_subscriptions"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Acceso total a autenticados"
  on "public"."reports"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Acceso total auth reports"
  on "public"."reports"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Admins can update reports"
  on "public"."reports"
  as permissive
  for update
  to public
using (public.is_admin());



  create policy "Admins can view reports"
  on "public"."reports"
  as permissive
  for select
  to public
using (public.is_admin());



  create policy "Authenticated users can create reports"
  on "public"."reports"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Public access reports"
  on "public"."reports"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users can delete own saved searches"
  on "public"."saved_searches"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own saved searches"
  on "public"."saved_searches"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view own saved searches"
  on "public"."saved_searches"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users manage saved searches"
  on "public"."saved_searches"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Acceso total a autenticados"
  on "public"."support_tickets"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Acceso total auth tickets"
  on "public"."support_tickets"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Admins can do everything on tickets"
  on "public"."support_tickets"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE (((profiles.id = auth.uid()) OR (profiles.email = auth.email())) AND ((profiles.role = 'Admin'::text) OR (profiles.role = 'Superadmin'::text))))));



  create policy "Admins update tickets"
  on "public"."support_tickets"
  as permissive
  for update
  to public
using (public.is_admin());



  create policy "Public access tickets"
  on "public"."support_tickets"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users can insert tickets"
  on "public"."support_tickets"
  as permissive
  for insert
  to public
with check ((auth.email() = user_email));



  create policy "Users can view own tickets"
  on "public"."support_tickets"
  as permissive
  for select
  to public
using ((((auth.uid())::text = user_email) OR (user_email = auth.email())));



  create policy "Users create tickets"
  on "public"."support_tickets"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Users view own tickets, Admins view all"
  on "public"."support_tickets"
  as permissive
  for select
  to public
using (((public.get_auth_email() = user_email) OR public.is_admin()));



  create policy "System inserts activity"
  on "public"."user_activity_logs"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can insert their own activity logs"
  on "public"."user_activity_logs"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Users can view activity logs"
  on "public"."user_activity_logs"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users view own activity"
  on "public"."user_activity_logs"
  as permissive
  for select
  to public
using (((auth.uid() = user_id) OR public.is_admin()));



  create policy "Usuarios insertan su propia actividad"
  on "public"."user_activity_logs"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Usuarios ven su propio historial"
  on "public"."user_activity_logs"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can delete ratings"
  on "public"."user_ratings"
  as permissive
  for delete
  to public
using (public.is_admin());



  create policy "Authenticated users can insert ratings"
  on "public"."user_ratings"
  as permissive
  for insert
  to public
with check (((auth.uid() = rater_id) OR (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'Admin'::text) OR (profiles.role = 'Superadmin'::text)))))));



  create policy "Ratings are public"
  on "public"."user_ratings"
  as permissive
  for select
  to public
using (true);



  create policy "Ratings are viewable by everyone"
  on "public"."user_ratings"
  as permissive
  for select
  to public
using (true);



  create policy "Users can delete their own ratings"
  on "public"."user_ratings"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = rater_id));



  create policy "Users can insert ratings"
  on "public"."user_ratings"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = rater_id));



  create policy "Users can rate others"
  on "public"."user_ratings"
  as permissive
  for insert
  to public
with check ((auth.uid() = rater_id));



  create policy "Users can read ratings"
  on "public"."user_ratings"
  as permissive
  for select
  to authenticated
using (true);


CREATE TRIGGER on_pet_created_notify_searches AFTER INSERT ON public.pets FOR EACH ROW EXECUTE FUNCTION public.handle_new_pet_notification();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Cualquiera puede ver imágenes"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'pet-images'::text));



  create policy "Usuarios autenticados pueden subir imágenes"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'pet-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Usuarios pueden actualizar sus propias imágenes"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'pet-images'::text) AND (auth.uid() = owner)));



  create policy "Usuarios pueden eliminar sus propias imágenes"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'pet-images'::text) AND (auth.uid() = owner)));



