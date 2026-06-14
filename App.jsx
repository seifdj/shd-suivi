import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================
//  SHD Multiservices — Suivi des passages (version déployable)
//  Espaces : Client · Agent · Gérant
//  + une page par résidence accessible par son propre lien :
//    https://ton-site/#/r/<nom-de-la-residence>
//  Voir GUIDE-DEPLOIEMENT.md
// ============================================================

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const NAVY = "#1a3c6e";
const GREEN = "#4caf50";
const GREY = "#2d2d2d";
const ROUGE = "#c62828";
const ORANGE = "#e8910c";

const ZONES = [
  "Hall d'entrée",
  "Escaliers",
  "Ascenseur",
  "Paliers",
  "Local poubelles",
  "Sortie / entrée conteneurs",
  "Vitrerie",
  "Boîtes aux lettres",
  "Parking / sous-sol",
  "Espaces extérieurs",
];

const CODE_AGENT = "SHD2026";
const CODE_GERANT = "ADMIN2026";

// ---------- Accès base de données (Supabase) ----------
async function chargerCopros() {
  const { data, error } = await supabase.from("copros").select("*").order("nom", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}
async function chargerPassages(coproId) {
  const { data, error } = await supabase
    .from("passages")
    .select("*")
    .eq("copro_id", coproId)
    .order("date", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []).map((p) => ({
    id: p.id,
    date: p.date,
    agent: p.agent,
    zones: p.zones || [],
    observations: p.observations || "",
    photos: p.photos || [],
  }));
}
async function insererCopro(c) {
  const { data, error } = await supabase
    .from("copros")
    .insert({ nom: c.nom, adresse: c.adresse || "", frequence: c.frequence || 0 })
    .select()
    .single();
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}
async function majCopro(id, patch) {
  const { error } = await supabase.from("copros").update(patch).eq("id", id);
  if (error) console.error(error);
}
async function suppCopro(id) {
  const { error } = await supabase.from("copros").delete().eq("id", id);
  if (error) console.error(error);
}
async function insererPassage(coproId, d) {
  const { data, error } = await supabase
    .from("passages")
    .insert({
      copro_id: coproId,
      date: new Date().toISOString(),
      agent: d.agent,
      zones: d.zones,
      observations: d.observations,
      photos: d.photos,
    })
    .select()
    .single();
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}
async function suppPassage(id) {
  const { error } = await supabase.from("passages").delete().eq("id", id);
  if (error) console.error(error);
}

// ---------- Utilitaires ----------
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtDateCourt(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtHeure(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function joursEntre(iso, ref = new Date()) {
  const d = new Date(iso);
  const debut = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  return Math.round((debut(ref) - debut(d)) / 86400000);
}
function tempsRelatif(iso) {
  const diff = joursEntre(iso);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return `Il y a ${diff} jours`;
  return fmtDate(iso);
}
function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
function lienResidence(copro) {
  const base = window.location.origin + window.location.pathname;
  return `${base}#/r/${slugify(copro.nom)}`;
}
function compresserImage(file, maxDim = 900, qualite = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", qualite));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function statutCopro(copro, passages) {
  const dernier = (passages || [])[0];
  if (!dernier) return { code: "aucun", label: "Aucun passage", couleur: "#8a94a6", dernier: null };
  const jours = joursEntre(dernier.date);
  if (!copro.frequence || copro.frequence <= 0) return { code: "ok", label: "À jour", couleur: GREEN, dernier, jours };
  if (jours <= copro.frequence) return { code: "ok", label: "À jour", couleur: GREEN, dernier, jours };
  if (jours <= copro.frequence * 1.5) return { code: "bientot", label: "À surveiller", couleur: ORANGE, dernier, jours };
  return { code: "retard", label: "En retard", couleur: ROUGE, dernier, jours };
}

// ---------- Petits composants ----------
function Logo({ small }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ background: NAVY, color: "#fff", fontWeight: 800, borderRadius: 8, padding: small ? "4px 9px" : "6px 12px", fontSize: small ? 14 : 18, letterSpacing: 1 }}>
        SHD
      </div>
      <div>
        <div style={{ fontWeight: 700, color: NAVY, fontSize: small ? 13 : 16, lineHeight: 1.1 }}>Multiservices</div>
        <div style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>Suivi des passages</div>
      </div>
    </div>
  );
}
function Pastille({ couleur }) {
  return <span style={{ width: 9, height: 9, borderRadius: "50%", background: couleur, display: "inline-block" }} />;
}
function PhotoViewer({ photo, onClose }) {
  if (!photo) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,25,45,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, cursor: "zoom-out", padding: 20 }}>
      <img src={photo} alt="Agrandissement" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 14 }} />
    </div>
  );
}
function EntreeTimeline({ p, premier, onPhoto, onSupprimer }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: premier ? GREEN : "#fff", border: `2px solid ${premier ? GREEN : "#c9d3e0"}`, marginTop: 5, flexShrink: 0 }} />
        <div style={{ width: 1.5, flex: 1, background: "#e6ebf2", marginTop: 4 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 30, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, color: NAVY, fontSize: 15 }}>{tempsRelatif(p.date)}</span>
          <span style={{ fontSize: 13, color: "#8a94a6" }}>{fmtHeure(p.date)} · {p.agent}</span>
          {onSupprimer && (
            <button onClick={() => onSupprimer(p)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: ROUGE, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              Supprimer
            </button>
          )}
        </div>
        <div style={{ fontSize: 13.5, color: "#5a6478", marginTop: 6, lineHeight: 1.6 }}>{p.zones.join("  ·  ")}</div>
        {p.observations && (
          <div style={{ marginTop: 10, fontSize: 13.5, color: GREY, borderLeft: `2px solid ${GREEN}`, paddingLeft: 12, lineHeight: 1.55 }}>{p.observations}</div>
        )}
        {p.photos && p.photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {p.photos.map((ph, i) => (
              <img key={i} src={ph} alt={`Photo ${i + 1}`} onClick={() => onPhoto(ph)} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, cursor: "pointer" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const champStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #d4dbe6", fontSize: 15, marginTop: 4, background: "#fff", color: GREY, boxSizing: "border-box", fontFamily: "inherit" };
const labelStyle = { fontSize: 13, fontWeight: 600, color: GREY, display: "block", marginTop: 14 };

// ============================================================
//  PAGE D'UNE RÉSIDENCE (vue client)
// ============================================================
function PageResidenceClient({ copro, passages, onRetour, montrerRetour }) {
  const [photo, setPhoto] = useState(null);
  const dernier = passages[0];
  const prochain = dernier && copro?.frequence > 0 ? new Date(new Date(dernier.date).getTime() + copro.frequence * 86400000) : null;
  return (
    <div>
      {montrerRetour && (
        <button onClick={onRetour} style={{ background: "transparent", border: "none", color: NAVY, fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0, marginBottom: 14 }}>
          ← Toutes les résidences
        </button>
      )}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#8a94a6" }}>
        {copro?.nom}{copro?.adresse ? ` · ${copro.adresse}` : ""}
      </div>
      <div style={{ margin: "18px 0 36px" }}>
        {dernier ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: 1.5 }}>
              <Pastille couleur={GREEN} /> Dernier entretien
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: NAVY, lineHeight: 1.15, marginTop: 8, letterSpacing: -0.5 }}>
              {tempsRelatif(dernier.date)}<span style={{ color: "#b6c0d0", fontWeight: 400 }}> · {fmtHeure(dernier.date)}</span>
            </div>
            <div style={{ fontSize: 14, color: "#5a6478", marginTop: 8 }}>
              {dernier.zones.length} zone{dernier.zones.length > 1 ? "s" : ""} entretenue{dernier.zones.length > 1 ? "s" : ""} par {dernier.agent}
            </div>
            {prochain && <div style={{ fontSize: 13, color: "#8a94a6", marginTop: 6 }}>Prochain passage prévu autour du {fmtDateCourt(prochain.toISOString())}</div>}
          </>
        ) : (
          <div style={{ color: "#8a94a6", fontSize: 15, lineHeight: 1.7 }}>Aucun passage enregistré pour {copro?.nom} pour l'instant.</div>
        )}
      </div>
      {passages.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8a94a6", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 18 }}>Historique</div>
          {passages.map((p, i) => <EntreeTimeline key={p.id} p={p} premier={i === 0} onPhoto={setPhoto} />)}
        </>
      )}
      <PhotoViewer photo={photo} onClose={() => setPhoto(null)} />
    </div>
  );
}

// ============================================================
//  ACCUEIL CLIENT (liste des résidences)
// ============================================================
function VueClient({ copros, passagesParCopro, coproIdInitial, onOuvrir, onRetour }) {
  if (copros.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#8a94a6", lineHeight: 1.7 }}>
        Aucune copropriété enregistrée pour le moment.<br />L'équipe SHD configure votre résidence — revenez bientôt.
      </div>
    );
  }
  if (coproIdInitial) {
    const c = copros.find((x) => x.id === coproIdInitial);
    if (c) return <PageResidenceClient copro={c} passages={passagesParCopro[c.id] || []} montrerRetour onRetour={onRetour} />;
  }
  if (copros.length === 1) {
    const c = copros[0];
    return <PageResidenceClient copro={c} passages={passagesParCopro[c.id] || []} montrerRetour={false} />;
  }
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 4 }}>Nos résidences</div>
      <div style={{ fontSize: 14, color: "#8a94a6", marginBottom: 22 }}>Sélectionnez votre résidence pour voir le suivi des passages.</div>
      {copros.map((c) => {
        const dernier = (passagesParCopro[c.id] || [])[0];
        return (
          <button key={c.id} onClick={() => onOuvrir(c)} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid #e9edf3", borderRadius: 14, padding: "16px 18px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: NAVY, fontSize: 16 }}>{c.nom}</div>
              {c.adresse && <div style={{ fontSize: 12.5, color: "#aab2c0", marginTop: 2 }}>{c.adresse}</div>}
              <div style={{ fontSize: 13, color: "#5a6478", marginTop: 6 }}>{dernier ? `Dernier passage ${tempsRelatif(dernier.date).toLowerCase()}` : "Aucun passage pour l'instant"}</div>
            </div>
            <div style={{ color: "#c9d3e0", fontSize: 22, fontWeight: 700 }}>›</div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
//  ESPACE AGENT
// ============================================================
function VueAgent({ copros, addCopro, addPassage }) {
  const [coproId, setCoproId] = useState(copros[0]?.id || "");
  const [agent, setAgent] = useState("");
  const [zones, setZones] = useState([]);
  const [observations, setObservations] = useState("");
  const [photos, setPhotos] = useState([]);
  const [enreg, setEnreg] = useState(false);
  const [message, setMessage] = useState("");
  const [nvNom, setNvNom] = useState("");
  const [nvAdresse, setNvAdresse] = useState("");
  const fileRef = useRef(null);
  useEffect(() => { if (!coproId && copros[0]) setCoproId(copros[0].id); }, [copros]);

  const toggleZone = (z) => setZones((p) => (p.includes(z) ? p.filter((x) => x !== z) : [...p, z]));
  const ajouterPhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - photos.length);
    for (const f of files) {
      try { const data = await compresserImage(f); setPhotos((prev) => [...prev, data]); }
      catch { setMessage("Impossible de lire une photo."); }
    }
    if (fileRef.current) fileRef.current.value = "";
  };
  const ajouterCopro = async () => {
    if (!nvNom.trim()) return;
    const nc = await addCopro({ nom: nvNom.trim(), adresse: nvAdresse.trim(), frequence: 7 });
    if (nc) { setCoproId(nc.id); setNvNom(""); setNvAdresse(""); setMessage(`Copropriété « ${nc.nom} » ajoutée.`); }
  };
  const enregistrer = async () => {
    if (!coproId) return setMessage("Sélectionnez une copropriété.");
    if (!agent.trim()) return setMessage("Indiquez le nom de l'agent.");
    if (zones.length === 0) return setMessage("Cochez au moins une zone entretenue.");
    setEnreg(true);
    const ok = await addPassage(coproId, { agent: agent.trim(), zones, observations: observations.trim(), photos: photos.filter(Boolean) });
    if (ok) { setZones([]); setObservations(""); setPhotos([]); setMessage("✓ Passage enregistré. Visible par les clients immédiatement."); }
    else setMessage("Erreur d'enregistrement, réessayez.");
    setEnreg(false);
  };

  return (
    <div>
      <div style={{ background: "#eef6ee", border: `1px solid ${GREEN}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#2e7d32", fontWeight: 600, marginBottom: 8 }}>
        Mode agent — enregistrement d'un passage
      </div>
      <label style={labelStyle}>Copropriété</label>
      <select value={coproId} onChange={(e) => setCoproId(e.target.value)} style={champStyle}>
        {copros.length === 0 && <option value="">— Ajoutez une copropriété ci-dessous —</option>}
        {copros.map((c) => <option key={c.id} value={c.id}>{c.nom} {c.adresse ? `— ${c.adresse}` : ""}</option>)}
      </select>
      <label style={labelStyle}>Nom de l'agent</label>
      <input value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="Ex. : Karim B." style={champStyle} />
      <label style={labelStyle}>Zones entretenues</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
        {ZONES.map((z) => {
          const actif = zones.includes(z);
          return (
            <button key={z} onClick={() => toggleZone(z)} style={{ padding: "8px 12px", borderRadius: 999, border: actif ? `1.5px solid ${GREEN}` : "1.5px solid #d4dbe6", background: actif ? "#e8f5e9" : "#fff", color: actif ? "#2e7d32" : GREY, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              {actif ? "✓ " : ""}{z}
            </button>
          );
        })}
      </div>
      <label style={labelStyle}>Observations (facultatif)</label>
      <textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Ex. : ampoule grillée au 2e étage signalée au syndic." rows={3} style={{ ...champStyle, resize: "vertical" }} />
      <label style={labelStyle}>Photos (max 4)</label>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={ajouterPhotos} disabled={photos.length >= 4} style={{ marginTop: 6, fontSize: 13 }} />
      {photos.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {photos.map((ph, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={ph} alt={`Photo ${i + 1}`} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }} />
              <button onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} style={{ position: "absolute", top: -6, right: -6, background: ROUGE, color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer", lineHeight: "20px", padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <button onClick={enregistrer} disabled={enreg} style={{ width: "100%", marginTop: 20, padding: 13, background: enreg ? "#9bb" : GREEN, color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
        {enreg ? "Enregistrement…" : "Enregistrer le passage"}
      </button>
      {message && <div style={{ marginTop: 10, fontSize: 13.5, color: NAVY, fontWeight: 600 }}>{message}</div>}
      <div style={{ borderTop: "1px solid #e3e8f0", marginTop: 28, paddingTop: 16 }}>
        <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>+ Ajouter une copropriété</div>
        <input value={nvNom} onChange={(e) => setNvNom(e.target.value)} placeholder="Nom de la résidence" style={{ ...champStyle, marginTop: 10 }} />
        <input value={nvAdresse} onChange={(e) => setNvAdresse(e.target.value)} placeholder="Adresse (facultatif)" style={{ ...champStyle, marginTop: 8 }} />
        <button onClick={ajouterCopro} style={{ marginTop: 10, padding: "10px 18px", background: NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Ajouter</button>
      </div>
    </div>
  );
}

// ============================================================
//  ESPACE GÉRANT
// ============================================================
function CarteKPI({ valeur, label, couleur }) {
  return (
    <div style={{ flex: 1, minWidth: 90, background: "#fff", border: "1px solid #e3e8f0", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: couleur || NAVY, lineHeight: 1 }}>{valeur}</div>
      <div style={{ fontSize: 12, color: "#8a94a6", marginTop: 6, fontWeight: 600 }}>{label}</div>
    </div>
  );
}
function VueGerant({ copros, passagesParCopro, addCopro, updateCopro, deleteCopro, deletePassage }) {
  const [selId, setSelId] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [nvNom, setNvNom] = useState("");
  const [nvAdresse, setNvAdresse] = useState("");
  const [nvFreq, setNvFreq] = useState(7);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [copie, setCopie] = useState(null);

  const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let passagesMois = 0, enRetard = 0;
  copros.forEach((c) => {
    const ps = passagesParCopro[c.id] || [];
    passagesMois += ps.filter((p) => new Date(p.date) >= debutMois).length;
    if (statutCopro(c, ps).code === "retard") enRetard++;
  });

  const copierLien = async (c) => {
    const lien = lienResidence(c);
    try { await navigator.clipboard.writeText(lien); } catch { window.prompt("Copiez le lien :", lien); }
    setCopie(c.id);
    setTimeout(() => setCopie(null), 1800);
  };

  const ajouter = async () => {
    if (!nvNom.trim()) return;
    await addCopro({ nom: nvNom.trim(), adresse: nvAdresse.trim(), frequence: Number(nvFreq) || 0 });
    setNvNom(""); setNvAdresse(""); setNvFreq(7); setAjoutOuvert(false);
  };

  if (selId) {
    const copro = copros.find((c) => c.id === selId);
    if (!copro) { setSelId(null); return null; }
    const passages = passagesParCopro[selId] || [];
    return (
      <div>
        <button onClick={() => setSelId(null)} style={{ background: "transparent", border: "none", color: NAVY, fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0, marginBottom: 14 }}>← Toutes les résidences</button>
        <div style={{ background: "#fff", border: "1px solid #e3e8f0", borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <label style={{ ...labelStyle, marginTop: 0 }}>Nom de la résidence</label>
          <input value={copro.nom} onChange={(e) => updateCopro(selId, { nom: e.target.value })} style={champStyle} />
          <label style={labelStyle}>Adresse</label>
          <input value={copro.adresse || ""} onChange={(e) => updateCopro(selId, { adresse: e.target.value })} style={champStyle} />
          <label style={labelStyle}>Fréquence attendue (jours entre deux passages)</label>
          <input type="number" min={0} value={copro.frequence || 0} onChange={(e) => updateCopro(selId, { frequence: Number(e.target.value) || 0 })} style={champStyle} />
          <div style={{ fontSize: 12, color: "#8a94a6", marginTop: 6 }}>0 = pas de suivi de fréquence.</div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed #e3e8f0" }}>
            <label style={{ ...labelStyle, marginTop: 0 }}>Lien à envoyer au syndic</label>
            <div style={{ fontSize: 12.5, color: "#5a6478", wordBreak: "break-all", background: "#f7f9fc", borderRadius: 8, padding: "8px 10px", marginTop: 6 }}>{lienResidence(copro)}</div>
            <button onClick={() => copierLien(copro)} style={{ marginTop: 8, padding: "8px 14px", background: GREEN, color: "#fff", border: "none", borderRadius: 9, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
              {copie === copro.id ? "✓ Copié" : "Copier le lien"}
            </button>
          </div>

          <button onClick={() => { if (window.confirm(`Supprimer « ${copro.nom} » et tous ses passages ?`)) { deleteCopro(selId); setSelId(null); } }} style={{ marginTop: 16, padding: "9px 16px", background: "#fff", color: ROUGE, border: `1.5px solid ${ROUGE}`, borderRadius: 10, fontWeight: 700, cursor: "pointer", display: "block" }}>
            Supprimer cette résidence
          </button>
        </div>
        <div style={{ fontWeight: 700, color: NAVY, fontSize: 15, marginBottom: 14 }}>Historique des passages ({passages.length})</div>
        {passages.length === 0 ? (
          <div style={{ color: "#8a94a6", fontSize: 14 }}>Aucun passage enregistré.</div>
        ) : passages.map((p, i) => (
          <EntreeTimeline key={p.id} p={p} premier={i === 0} onPhoto={setPhoto} onSupprimer={(pp) => { if (window.confirm("Supprimer ce passage ?")) deletePassage(selId, pp.id); }} />
        ))}
        <PhotoViewer photo={photo} onClose={() => setPhoto(null)} />
      </div>
    );
  }

  const triees = copros.map((c) => ({ c, st: statutCopro(c, passagesParCopro[c.id] || []) }))
    .sort((a, b) => { const o = { retard: 0, bientot: 1, aucun: 2, ok: 3 }; return o[a.st.code] - o[b.st.code]; });

  return (
    <div>
      <div style={{ fontWeight: 800, color: NAVY, fontSize: 20, marginBottom: 14 }}>Tableau de bord</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
        <CarteKPI valeur={copros.length} label="Résidences" />
        <CarteKPI valeur={passagesMois} label="Passages ce mois" couleur={GREEN} />
        <CarteKPI valeur={enRetard} label="En retard" couleur={enRetard > 0 ? ROUGE : NAVY} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>Résidences</div>
        <button onClick={() => setAjoutOuvert((v) => !v)} style={{ background: NAVY, color: "#fff", border: "none", borderRadius: 999, padding: "7px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{ajoutOuvert ? "Annuler" : "+ Résidence"}</button>
      </div>
      {ajoutOuvert && (
        <div style={{ background: "#fff", border: "1px solid #e3e8f0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <input value={nvNom} onChange={(e) => setNvNom(e.target.value)} placeholder="Nom de la résidence" style={champStyle} />
          <input value={nvAdresse} onChange={(e) => setNvAdresse(e.target.value)} placeholder="Adresse (facultatif)" style={{ ...champStyle, marginTop: 8 }} />
          <label style={labelStyle}>Fréquence attendue (jours)</label>
          <input type="number" min={0} value={nvFreq} onChange={(e) => setNvFreq(e.target.value)} style={champStyle} />
          <button onClick={ajouter} style={{ marginTop: 12, padding: "10px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Créer</button>
        </div>
      )}
      {copros.length === 0 ? (
        <div style={{ color: "#8a94a6", padding: "30px 0", textAlign: "center" }}>Aucune résidence. Cliquez sur « + Résidence ».</div>
      ) : triees.map(({ c, st }) => {
        const ps = passagesParCopro[c.id] || [];
        return (
          <div key={c.id} style={{ background: "#fff", border: "1px solid #e3e8f0", borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
            <Pastille couleur={st.couleur} />
            <button onClick={() => setSelId(c.id)} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
              <div style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>{c.nom}</div>
              <div style={{ fontSize: 12.5, color: "#8a94a6", marginTop: 2 }}>{st.dernier ? `Dernier passage ${tempsRelatif(st.dernier.date).toLowerCase()}` : "Aucun passage"} · {ps.length} au total</div>
            </button>
            <button onClick={() => copierLien(c)} title="Copier le lien client" style={{ background: "transparent", border: "1.5px solid #d4dbe6", color: NAVY, borderRadius: 9, padding: "6px 10px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
              {copie === c.id ? "✓" : "Lien"}
            </button>
            <div style={{ fontSize: 12, fontWeight: 700, color: st.couleur, whiteSpace: "nowrap" }}>{st.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
//  APPLICATION
// ============================================================
export default function App() {
  const [vue, setVue] = useState("client");
  const [cibleLogin, setCibleLogin] = useState("agent");
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState(false);
  const [copros, setCopros] = useState([]);
  const [passagesParCopro, setPassagesParCopro] = useState({});
  const [chargement, setChargement] = useState(true);
  const [deepSlug, setDeepSlug] = useState(null);   // résidence ouverte via son lien direct
  const [coproOuverte, setCoproOuverte] = useState(null); // résidence ouverte depuis l'accueil

  // Lecture du lien (#/r/<slug>)
  useEffect(() => {
    const lire = () => {
      const h = window.location.hash || "";
      const m = h.match(/^#\/r\/(.+)$/);
      setDeepSlug(m ? decodeURIComponent(m[1]) : null);
    };
    lire();
    window.addEventListener("hashchange", lire);
    return () => window.removeEventListener("hashchange", lire);
  }, []);

  // Chargement des données
  const rechargerTout = async () => {
    const cs = await chargerCopros();
    setCopros(cs);
    const map = {};
    for (const c of cs) map[c.id] = await chargerPassages(c.id);
    setPassagesParCopro(map);
    setChargement(false);
  };
  useEffect(() => { rechargerTout(); }, []);

  const addCopro = async (c) => {
    const nc = await insererCopro(c);
    if (nc) { setCopros((p) => [...p, nc].sort((a, b) => a.nom.localeCompare(b.nom))); setPassagesParCopro((p) => ({ ...p, [nc.id]: [] })); }
    return nc;
  };
  const updateCopro = async (id, patch) => {
    setCopros((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    await majCopro(id, patch);
  };
  const deleteCopro = async (id) => {
    setCopros((p) => p.filter((c) => c.id !== id));
    setPassagesParCopro((p) => { const x = { ...p }; delete x[id]; return x; });
    await suppCopro(id);
  };
  const addPassage = async (coproId, data) => {
    const row = await insererPassage(coproId, data);
    if (!row) return false;
    const local = { id: row.id, date: row.date, agent: row.agent, zones: row.zones || [], observations: row.observations || "", photos: row.photos || [] };
    setPassagesParCopro((prev) => ({ ...prev, [coproId]: [local, ...(prev[coproId] || [])] }));
    return true;
  };
  const deletePassage = async (coproId, passageId) => {
    setPassagesParCopro((prev) => ({ ...prev, [coproId]: (prev[coproId] || []).filter((p) => p.id !== passageId) }));
    await suppPassage(passageId);
  };

  const valider = () => {
    const attendu = cibleLogin === "gerant" ? CODE_GERANT : CODE_AGENT;
    if (code.trim() === attendu) { setVue(cibleLogin); setErreur(false); setCode(""); }
    else setErreur(true);
  };

  // Résidence ciblée par le lien direct
  const coproDeepLink = deepSlug ? copros.find((c) => slugify(c.nom) === deepSlug) : null;
  const estClient = vue === "client";

  // Si on arrive par un lien direct vers une résidence, on force la vue client.
  const afficherDeepLink = vue === "client" && coproDeepLink;

  return (
    <div style={{ minHeight: "100vh", background: estClient ? "#ffffff" : "#f4f6fa", fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: estClient ? "none" : "1px solid #e3e8f0", padding: estClient ? "18px 16px 6px" : "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap" }}>
        <Logo small />
        <div style={{ display: "flex", gap: 8 }}>
          {vue !== "client" && <button onClick={() => setVue("client")} style={{ background: "transparent", border: "1.5px solid #d4dbe6", color: "#8a94a6", borderRadius: 999, padding: "7px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Client</button>}
          {(vue === "client" || vue === "gerant") && <button onClick={() => { setCibleLogin("agent"); setVue("login"); }} style={{ background: "transparent", border: `1.5px solid ${GREEN}`, color: "#2e7d32", borderRadius: 999, padding: "7px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Agent</button>}
          {(vue === "client" || vue === "agent") && <button onClick={() => { setCibleLogin("gerant"); setVue("login"); }} style={{ background: "transparent", border: `1.5px solid ${NAVY}`, color: NAVY, borderRadius: 999, padding: "7px 12px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Gérant</button>}
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 60px" }}>
        {chargement ? (
          <div style={{ textAlign: "center", color: "#8a94a6", padding: 60 }}>Chargement…</div>
        ) : afficherDeepLink ? (
          <PageResidenceClient copro={coproDeepLink} passages={passagesParCopro[coproDeepLink.id] || []} montrerRetour={false} />
        ) : vue === "client" ? (
          <VueClient
            copros={copros}
            passagesParCopro={passagesParCopro}
            coproIdInitial={coproOuverte}
            onOuvrir={(c) => setCoproOuverte(c.id)}
            onRetour={() => setCoproOuverte(null)}
          />
        ) : vue === "login" ? (
          <div style={{ maxWidth: 360, margin: "40px auto", textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: NAVY, fontSize: 18, marginBottom: 4 }}>Accès {cibleLogin === "gerant" ? "gérant" : "agent"}</div>
            <div style={{ fontSize: 13, color: "#8a94a6", marginBottom: 16 }}>{cibleLogin === "gerant" ? "Réservé à la gestion SHD" : "Réservé aux agents SHD"}</div>
            <input type="password" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && valider()} placeholder="Code d'accès" style={{ width: "100%", padding: 12, borderRadius: 10, border: erreur ? `1.5px solid ${ROUGE}` : "1.5px solid #d4dbe6", fontSize: 16, textAlign: "center", boxSizing: "border-box" }} />
            {erreur && <div style={{ color: ROUGE, fontSize: 13, marginTop: 8 }}>Code incorrect.</div>}
            <button onClick={valider} style={{ width: "100%", marginTop: 14, padding: 12, background: NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Entrer</button>
            <button onClick={() => setVue("client")} style={{ marginTop: 12, background: "transparent", border: "none", color: "#8a94a6", fontSize: 13, cursor: "pointer" }}>← Retour</button>
          </div>
        ) : vue === "agent" ? (
          <VueAgent copros={copros} addCopro={addCopro} addPassage={addPassage} />
        ) : (
          <VueGerant copros={copros} passagesParCopro={passagesParCopro} addCopro={addCopro} updateCopro={updateCopro} deleteCopro={deleteCopro} deletePassage={deletePassage} />
        )}
      </main>

      <footer style={{ textAlign: "center", fontSize: 12, color: "#99a", paddingBottom: 24 }}>SHD Multiservices — Meyzieu · shd-clean.com</footer>
    </div>
  );
}
