import { supabase } from "@/integrations/supabase/client";

export async function uploadImagem(file: File): Promise<string> {
  const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("imagens")
    .upload(fileName, file, { upsert: false, contentType: file.type || undefined });

  if (uploadError) {
    console.error("Erro no upload:", uploadError);
    throw uploadError;
  }

  // O bucket é privado: servimos as imagens por uma rota pública estável.
  return `/api/public/img/${fileName}`;
}
