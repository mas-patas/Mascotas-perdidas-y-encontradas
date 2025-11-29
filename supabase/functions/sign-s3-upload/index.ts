
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.450.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.450.0";

// Declare Deno to avoid TypeScript errors when Deno types are not loaded
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Manejar solicitudes CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Obtener variables de entorno
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const AWS_REGION = Deno.env.get('AWS_REGION');
    const S3_BUCKET_NAME = Deno.env.get('S3_BUCKET_NAME');

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !S3_BUCKET_NAME) {
      throw new Error('Faltan variables de entorno de AWS en Supabase (Revisa que AWS_ACCESS_KEY_ID esté bien escrito)');
    }

    // 3. Parsear el cuerpo de la solicitud
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return new Response(
        JSON.stringify({ error: 'Se requiere fileName y fileType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Inicializar cliente S3
    const client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    // 5. Preparar el comando de subida (PUT)
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileName,
      ContentType: fileType,
    });

    // 6. Generar la URL firmada (Válida por 60 segundos)
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });

    // 7. Construir la URL pública final donde vivirá el archivo
    const publicUrl = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;

    // 8. Responder al Frontend
    return new Response(
      JSON.stringify({ uploadUrl, publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error en Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
