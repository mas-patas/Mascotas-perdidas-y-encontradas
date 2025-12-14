# Instrucciones para Aplicar la Migración de Banners

## Problema
El error "Could not find the table 'public.banners' in the schema cache" ocurre porque la tabla `banners` no existe en tu base de datos de Supabase.

## Solución

### Opción 1: Ejecutar SQL en Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **New Query**
4. Copia y pega el contenido del archivo `supabase/migrations/APPLY_BANNERS_MIGRATION.sql`
5. Haz clic en **Run** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)
6. Verifica que veas el mensaje "Tabla banners creada exitosamente"

### Opción 2: Usar Supabase CLI (si está configurado)

Si tienes el proyecto vinculado con Supabase CLI:

```bash
# Vincular el proyecto (solo la primera vez)
npx supabase link --project-ref tu-project-ref

# Aplicar las migraciones pendientes
npx supabase db push
```

### Opción 3: Ejecutar SQL Directamente

Si prefieres ejecutar el SQL directamente sin verificaciones, puedes usar el contenido de:
- `supabase/migrations/20250108000000_create_banners_table.sql`

## Verificación

Después de aplicar la migración, puedes verificar que la tabla existe:

```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'banners';
```

O simplemente intenta subir una imagen de banner nuevamente en la aplicación.

## Notas

- El script `APPLY_BANNERS_MIGRATION.sql` verifica si la tabla ya existe antes de crearla, por lo que es seguro ejecutarlo múltiples veces.
- La tabla incluye Row Level Security (RLS) configurado para que solo los administradores puedan crear, editar o eliminar banners.
- Todos los usuarios pueden ver los banners activos.
