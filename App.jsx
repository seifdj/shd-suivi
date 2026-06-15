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
const LOGO_SHD = "data:image/png;base64,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";
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
  noterErreur(error);
  return error ? [] : data || [];
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
// Dernière erreur Supabase rencontrée (affichée à l'écran pour le diagnostic)
let derniereErreurDB = null;
function noterErreur(e) {
  derniereErreurDB = e ? (e.message || JSON.stringify(e)) : null;
  if (e) console.error("Erreur Supabase :", e);
}

async function insererCopro(c) {
  const { data, error } = await supabase
    .from("copros")
    .insert({ nom: c.nom, adresse: c.adresse || "", frequence: c.frequence || 0 })
    .select()
    .single();
  noterErreur(error);
  return error ? null : data;
}
async function majCopro(id, patch) {
  const { error } = await supabase.from("copros").update(patch).eq("id", id);
  noterErreur(error);
}
async function suppCopro(id) {
  const { error } = await supabase.from("copros").delete().eq("id", id);
  noterErreur(error);
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
  const tailleImg = small ? 34 : 44;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <img src={LOGO_SHD} alt="SHD Multiservices" style={{ height: tailleImg, width: "auto", display: "block" }} />
      <div>
        <div style={{ fontWeight: 800, color: NAVY, fontSize: small ? 15 : 18, lineHeight: 1.05, letterSpacing: 0.2 }}>
          SHD <span style={{ fontWeight: 600 }}>Multiservices</span>
        </div>
        <div style={{ fontSize: 11, color: GREEN, fontWeight: 600, letterSpacing: 0.3 }}>Suivi des passages</div>
      </div>
    </div>
  );
}

// Grand logo centré pour la page d'accueil client (rendu premium)
function LogoAccueil() {
  return (
    <div style={{ textAlign: "center", marginBottom: 30 }}>
      <img src={LOGO_SHD} alt="SHD Multiservices" style={{ height: 84, width: "auto", display: "inline-block" }} />
      <div style={{ fontWeight: 800, color: NAVY, fontSize: 22, marginTop: 12, letterSpacing: 0.3 }}>
        SHD <span style={{ fontWeight: 600 }}>Multiservices</span>
      </div>
      <div style={{ fontSize: 13, color: GREEN, fontWeight: 600, letterSpacing: 0.5, marginTop: 2 }}>
        Propreté & entretien de copropriété
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
      <LogoAccueil />
      <div style={{ fontSize: 12, fontWeight: 700, color: "#8a94a6", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Vos résidences</div>
      {copros.map((c) => {
        const dernier = (passagesParCopro[c.id] || [])[0];
        return (
          <button key={c.id} onClick={() => onOuvrir(c)} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid #eef1f6", borderRadius: 16, padding: "18px 20px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(26,60,110,0.05)" }}>
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
  const [erreurDB, setErreurDB] = useState(null);   // message d'erreur Supabase à afficher

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
    setErreurDB(derniereErreurDB);
    setChargement(false);
  };
  useEffect(() => { rechargerTout(); }, []);

  const addCopro = async (c) => {
    derniereErreurDB = null;
    const nc = await insererCopro(c);
    if (nc) { setCopros((p) => [...p, nc].sort((a, b) => a.nom.localeCompare(b.nom))); setPassagesParCopro((p) => ({ ...p, [nc.id]: [] })); }
    setErreurDB(derniereErreurDB);
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
    derniereErreurDB = null;
    const row = await insererPassage(coproId, data);
    setErreurDB(derniereErreurDB);
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
        {erreurDB && (
          <div style={{ background: "#fdecea", border: `1px solid ${ROUGE}`, color: "#a01818", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16, wordBreak: "break-word" }}>
            <strong>Problème de connexion à la base :</strong> {erreurDB}
            <button onClick={() => setErreurDB(null)} style={{ marginLeft: 8, background: "transparent", border: "none", color: "#a01818", cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
        )}
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
