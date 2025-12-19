-- Script para crear la tabla banners
-- Ejecuta este script en el SQL Editor de Supabase Dashboard si la tabla no existe

-- Verificar si la tabla ya existe antes de crearla
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'banners'
  ) THEN
    -- Create banners table for carousel management
    CREATE TABLE "public"."banners" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "image_url" text NOT NULL,
      "title" text,
      "paragraph" text,
      "order" integer NOT NULL DEFAULT 0,
      "is_active" boolean NOT NULL DEFAULT true,
      "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
      "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
    );

    -- Enable row level security
    ALTER TABLE "public"."banners" ENABLE ROW LEVEL SECURITY;

    -- Create index for ordering
    CREATE INDEX "banners_order_idx" ON "public"."banners" ("order");

    -- RLS Policies
    -- Everyone can read active banners
    CREATE POLICY "Banners are public"
      ON "public"."banners"
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (is_active = true);

    -- Only admins can insert/update/delete
    CREATE POLICY "Admins can manage banners"
      ON "public"."banners"
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND (profiles.role = 'Admin'::text OR profiles.role = 'Superadmin'::text)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE profiles.id = auth.uid()
            AND (profiles.role = 'Admin'::text OR profiles.role = 'Superadmin'::text)
        )
      );

    RAISE NOTICE 'Tabla banners creada exitosamente';
  ELSE
    RAISE NOTICE 'La tabla banners ya existe';
  END IF;
END $$;
