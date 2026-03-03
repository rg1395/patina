"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/design";

interface Props {
  bucket?: string;
  maxFiles?: number;
  onUpload: (urls: string[]) => void;
  existing?: string[];
}

export default function ImageUpload({ bucket = "listings", maxFiles = 8, onUpload, existing = [] }: Props) {
  const [urls, setUrls] = useState<string[]>(existing);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList) => {
    setUploading(true);
    setError("");
    const supabase = createClient();
    const added: string[] = [];

    for (const file of Array.from(files)) {
      if (urls.length + added.length >= maxFiles) break;
      if (!file.type.startsWith("image/")) { setError("Solo immagini jpg, png, webp."); continue; }
      if (file.size > 5 * 1024 * 1024) { setError("Max 5MB per immagine."); continue; }

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error: upErr } = await supabase.storage.from(bucket).upload(path, file);
      if (upErr) { setError(upErr.message); continue; }

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
      added.push(publicUrl);
    }

    const updated = [...urls, ...added];
    setUrls(updated);
    onUpload(updated);
    setUploading(false);
  };

  const remove = (i: number) => {
    const updated = urls.filter((_, idx) => idx !== i);
    setUrls(updated);
    onUpload(updated);
  };

  return (
    <div>
      {urls.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.5rem", marginBottom: "0.8rem" }}>
          {urls.map((url, i) => (
            <div key={url} style={{ position: "relative", aspectRatio: "4/3", background: C.dark, overflow: "hidden" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {i === 0 && <span style={{ position: "absolute", bottom: "0.3rem", left: "0.3rem", fontFamily: "DM Mono, monospace", fontSize: "0.45rem", letterSpacing: "0.08em", textTransform: "uppercase", background: C.orange, color: C.cream, padding: "0.15rem 0.4rem" }}>Cover</span>}
              <button onClick={() => remove(i)} style={{ position: "absolute", top: "0.3rem", right: "0.3rem", width: "20px", height: "20px", background: "rgba(26,22,18,0.8)", border: "none", color: C.cream, fontSize: "0.8rem", cursor: "pointer", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          ))}
        </div>
      )}
      {urls.length < maxFiles && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={e => { e.preventDefault(); e.dataTransfer.files && upload(e.dataTransfer.files); }}
          onDragOver={e => e.preventDefault()}
          style={{ border: `2px dashed ${C.tan}`, padding: "2rem", textAlign: "center", cursor: "pointer", background: uploading ? C.light : "transparent" }}
        >
          <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => e.target.files && upload(e.target.files)} />
          {uploading ? (
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.orange }}>Caricamento...</span>
          ) : (
            <>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem", opacity: 0.4 }}>📷</div>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: "0.2rem" }}>Clicca o trascina foto</div>
              <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "0.85rem", fontStyle: "italic", color: C.muted }}>Max {maxFiles} immagini · 5MB · jpg, png, webp</div>
            </>
          )}
        </div>
      )}
      {error && <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", color: C.orange, marginTop: "0.5rem" }}>{error}</div>}
    </div>
  );
}
