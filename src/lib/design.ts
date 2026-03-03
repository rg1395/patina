export const C = {
  dark:   "#141210",
  cream:  "#F6F2EB",
  orange: "#C4612C",
  orange2:"#E07040",
  tan:    "#C8B898",
  muted:  "#7A6E63",
  light:  "#EDE6D8",
  white:  "#FFFFFF",
} as const;

export function euros(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency", currency: "EUR", minimumFractionDigits: 0,
  }).format(cents / 100);
}

export const CONDITION: Record<string, string> = {
  nos:            "NOS",
  original_used:  "Originale",
  restored:       "Restaurato",
  needs_restore:  "Da restaurare",
};

export const MAKES = [
  "Alfa Romeo","Abarth","BMW","Ducati","Ferrari","Fiat",
  "Lancia","Maserati","MV Agusta","Porsche","Triumph","Moto Guzzi",
  "Volkswagen","Mercedes-Benz","Jaguar","Austin-Healey",
];

export const CATEGORIES = [
  { id: 1,  name: "Motore" },
  { id: 2,  name: "Carburazione" },
  { id: 3,  name: "Distribuzione" },
  { id: 4,  name: "Raffreddamento" },
  { id: 6,  name: "Carrozzeria" },
  { id: 11, name: "Interni" },
  { id: 15, name: "Elettrica" },
  { id: 18, name: "Trasmissione" },
  { id: 22, name: "Frenante" },
  { id: 23, name: "Scarico" },
  { id: 24, name: "Sospensioni" },
  { id: 25, name: "Ruote & Cerchi" },
];

// ── STYLE TOKENS ──────────────────────────────────────────
export const serif  = { fontFamily: "Playfair Display, Georgia, serif" } as const;
export const mono   = { fontFamily: "DM Mono, monospace", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase" as const } as const;
export const body   = { fontFamily: "Lora, Georgia, serif" } as const;

export const inputStyle = {
  width: "100%",
  padding: ".85rem 1rem",
  border: `1px solid ${C.tan}`,
  borderRadius: "14px",
  background: C.white,
  fontFamily: "Lora, Georgia, serif",
  fontSize: "1rem",
  color: C.dark,
  outline: "none",
} as const;

export const labelStyle = {
  display: "block",
  fontFamily: "DM Mono, monospace",
  fontSize: "0.58rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: C.muted,
  marginBottom: "0.4rem",
} as const;

export const btnPrimary = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "DM Mono, monospace",
  fontSize: "0.65rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  background: C.orange,
  color: C.cream,
  padding: "0.85rem 1.8rem",
  border: "none",
  borderRadius: "100px",
  cursor: "pointer",
  textDecoration: "none",
} as const;

export const btnSecondary = {
  ...btnPrimary,
  background: "transparent",
  color: C.dark,
  border: `1px solid ${C.tan}`,
} as const;

export const btnDark = {
  ...btnPrimary,
  background: C.dark,
} as const;
