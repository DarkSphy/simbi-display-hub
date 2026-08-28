import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { uploadImagem } from "@/lib/upload.functions";

export function ImageUpload({ label, value, onChange }: { label: string, value: string, onChange: (url: string) => void }) {
  const [loading, setLoading] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadImagem(file);
      onChange(url);
    } catch (err: any) {
      alert("ERRO SUPABASE: " + JSON.stringify(err) + " - " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-2">
      <span className="text-sm font-bold text-muted-foreground block">{label}</span>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative size-16 rounded-xl overflow-hidden border border-border group shrink-0">
            <img src={value} alt="Upload" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onChange("")} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center size-16 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors shrink-0">
            {loading ? <Loader2 className="animate-spin text-muted-foreground" size={20}/> : <Plus className="text-muted-foreground" size={20}/>}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={loading}/>
          </label>
        )}
      </div>
    </div>
  );
}

export function MultipleImageUpload({ label, values, onChange }: { label: string, values: string[], onChange: (urls: string[]) => void }) {
  const [loading, setLoading] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setLoading(true);
    try {
      const newUrls = await Promise.all(files.map(f => uploadImagem(f)));
      onChange([...(values || []), ...newUrls]);
    } catch (err) {
      alert("Erro ao fazer upload das imagens.");
    } finally {
      setLoading(false);
    }
  };
  const removeImage = (index: number) => {
    const newValues = [...(values || [])];
    newValues.splice(index, 1);
    onChange(newValues);
  };
  return (
    <div className="space-y-2">
      <span className="text-sm font-bold text-muted-foreground block">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        {(values || []).map((url, i) => (
          <div key={i} className="relative size-16 rounded-xl overflow-hidden border border-border group shrink-0">
            <img src={url} alt="Galeria" className="w-full h-full object-cover" />
            <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center size-16 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-secondary/50 transition-colors shrink-0">
          {loading ? <Loader2 className="animate-spin text-muted-foreground" size={20}/> : <Plus className="text-muted-foreground" size={20}/>}
          <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} disabled={loading}/>
        </label>
      </div>
    </div>
  );
}