import { supabase } from "@/integrations/supabase/client";

export async function uploadImagem(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('imagens')
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    console.error("Erro no upload:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('imagens')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
