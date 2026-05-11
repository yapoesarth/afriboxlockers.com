import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { toast } from "sonner";
import { MapPin, Send, Mail, Building2, Boxes } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/* ---------- Locker availability map ---------- */
export function LockerMap() {
  const [stations, setStations] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`${API}/lockers`)
      .then((res) => {
        if (!mounted) return;
        setStations(res.data);
        setActive(res.data[0]);
      })
      .catch(() => toast.error("Impossible de charger le réseau de casiers."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Map lat/lon to relative position on map placeholder (Africa-bounded)
  const project = (lat, lon) => {
    // Simple linear projection within bounds
    const minLon = -20,
      maxLon = 50;
    const minLat = -10,
      maxLat = 25;
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x, y };
  };

  // Cluster offset: stations in the same city would otherwise sit on a single
  // screen pixel and overlap. Group by city and place coincident pins on a
  // small ring around the centroid so each remains individually clickable.
  const positionedStations = React.useMemo(() => {
    if (!stations.length) return [];
    const byCity = new Map();
    stations.forEach((s) => {
      const arr = byCity.get(s.city) || [];
      arr.push(s);
      byCity.set(s.city, arr);
    });
    const out = [];
    byCity.forEach((arr) => {
      if (arr.length === 1) {
        const s = arr[0];
        out.push({ ...s, _pos: project(s.latitude, s.longitude) });
        return;
      }
      const cx =
        arr.reduce((a, s) => a + project(s.latitude, s.longitude).x, 0) /
        arr.length;
      const cy =
        arr.reduce((a, s) => a + project(s.latitude, s.longitude).y, 0) /
        arr.length;
      const r = 2.6;
      arr.forEach((s, i) => {
        const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
        out.push({
          ...s,
          _pos: { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r },
        });
      });
    });
    return out;
  }, [stations]);

  return (
    <section
      id="network"
      className="relative py-28 md:py-36 px-6 md:px-12"
      data-testid="locker-map-section"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 max-w-2xl">
          <span className="eyebrow">Réseau 07</span>
          <h2 className="display-h2 text-4xl md:text-5xl lg:text-6xl text-white mt-4 mb-5">
            En direct sur tout le continent.
          </h2>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed">
            Chaque nœud rapporte sa capacité en temps réel. Épinglez une
            station pour prévisualiser la disponibilité avant de demander
            l'accès.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6 items-stretch">
          {/* Map */}
          <div
            className="relative glass overflow-hidden"
            style={{ minHeight: "440px" }}
            data-testid="locker-map"
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(74,222,128,0.10) 0%, transparent 60%), linear-gradient(180deg, #0A1F14 0%, #061410 100%)",
              }}
            />
            {/* Continent outline */}
            <svg
              viewBox="0 0 800 600"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="800" height="600" fill="url(#grid)" />
              {/* Stylised African continent shape */}
              <path
                d="M340 110 L420 95 L495 130 L555 175 L580 240 L580 320 L545 385 L535 450 L490 520 L420 555 L375 540 L330 490 L300 440 L295 380 L260 350 L240 295 L260 245 L290 195 L320 145 Z"
                fill="rgba(16,185,129,0.04)"
                stroke="rgba(45,212,191,0.25)"
                strokeWidth="1"
              />
            </svg>

            {/* Station pins */}
            <div className="absolute inset-0">
              {positionedStations.map((s) => {
                const p = s._pos;
                const isActive = active?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s)}
                    className="absolute group"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, zIndex: isActive ? 5 : 1 }}
                    data-testid={`pin-${s.id}`}
                  >
                    <span
                      className="block rounded-full"
                      style={{
                        width: isActive ? 14 : 10,
                        height: isActive ? 14 : 10,
                        background:
                          s.status === "maintenance" ? "#F59E0B" : "#16A34A",
                        boxShadow: `0 0 ${isActive ? 18 : 10}px ${
                          s.status === "maintenance"
                            ? "rgba(245,158,11,0.7)"
                            : "rgba(16,185,129,0.85)"
                        }`,
                        transform: "translate(-50%, -50%)",
                        transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                      }}
                    />
                    {isActive && (
                      <span
                        className="absolute mono text-[10px] tracking-[0.18em] text-mint whitespace-nowrap"
                        style={{
                          left: 14,
                          top: -7,
                          textShadow: "0 0 8px rgba(45,212,191,0.6)",
                        }}
                      >
                        {s.name.toUpperCase()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="absolute top-4 left-4 hud-pill">
              <span className="hud-dot" />
              <span className="text-[10px]">RÉSEAU EN DIRECT</span>
            </div>
            <div className="absolute bottom-4 right-4 mono text-[10px] tracking-[0.22em] text-zinc-600">
              {stations.length} STATIONS
            </div>
          </div>

          {/* Station detail */}
          <div className="glass p-7 md:p-8 flex flex-col" data-testid="station-detail">
            {loading && (
              <div className="text-zinc-500 text-sm">Chargement du réseau…</div>
            )}
            {active && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <span className="eyebrow">Profil de la station</span>
                  <span
                    className="mono text-[10px] tracking-[0.22em]"
                    style={{
                      color:
                        active.status === "maintenance" ? "#F59E0B" : "#4ADE80",
                    }}
                  >
                    {active.status === "maintenance"
                      ? "MAINTENANCE"
                      : "EN LIGNE"}
                  </span>
                </div>
                <h3 className="display-h2 text-2xl md:text-3xl text-white mb-1">
                  {active.name}
                </h3>
                <div className="text-zinc-500 text-sm mb-6 flex items-center gap-2">
                  <MapPin size={13} />
                  {active.district} · {active.city}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                    <div className="hud text-[9px] mb-2">Unités totales</div>
                    <div className="font-display text-3xl text-white">
                      {active.total_units}
                    </div>
                  </div>
                  <div className="rounded-lg border border-mint/20 bg-mint/[0.04] p-4">
                    <div
                      className="hud text-[9px] mb-2"
                      style={{ color: "#4ADE80" }}
                    >
                      Disponibles
                    </div>
                    <div
                      className="font-display text-3xl"
                      style={{
                        color: active.available_units === 0 ? "#F59E0B" : "#86EFAC",
                      }}
                    >
                      {active.available_units}
                    </div>
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="mb-7">
                  <div className="flex justify-between mono text-[10px] tracking-[0.18em] text-zinc-500 mb-2">
                    <span>UTILISATION</span>
                    <span>
                      {Math.round(
                        (1 - active.available_units / active.total_units) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background:
                          "linear-gradient(90deg, #16A34A, #4ADE80, #86EFAC)",
                        boxShadow: "0 0 12px rgba(45,212,191,0.6)",
                      }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          (1 - active.available_units / active.total_units) *
                          100
                        }%`,
                      }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      document
                        .getElementById("booking")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="btn-primary text-sm"
                    data-testid="book-from-station"
                  >
                    <Boxes size={14} />
                    Réserver un compartiment
                  </button>
                  <button className="btn-ghost text-sm" data-testid="view-station">
                    Détails de la station
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Booking form ---------- */
export function BookingForm() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    locker_size: "medium",
    pickup_window: "Matin (08:00 — 12:00)",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/booking`, form);
      toast.success("Demande reçue. Notre équipe vous contactera sous 24h.");
      setForm({
        full_name: "",
        email: "",
        phone: "",
        city: "",
        locker_size: "medium",
        pickup_window: "Matin (08:00 — 12:00)",
        notes: "",
      });
    } catch (err) {
      toast.error(
        err?.response?.data?.detail || "Impossible d'envoyer la demande. Réessayez."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="booking"
      className="relative py-28 md:py-36 px-6 md:px-12"
      data-testid="booking-section"
    >
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr,1.2fr] gap-12 items-start">
        <div>
          <span className="eyebrow">Accès 08</span>
          <h2 className="display-h2 text-4xl md:text-5xl lg:text-6xl text-white mt-4 mb-6">
            Réservez un
            <br />
            compartiment.
          </h2>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-md mb-8">
            Opérateurs, détaillants et particuliers peuvent demander un
            compartiment récurrent ou unique. Nous attribuons sous 24 heures.
          </p>
          <ul className="space-y-3 text-sm text-zinc-500">
            <li className="flex items-start gap-3">
              <span className="mono text-mint">→</span>
              <span>Transfert chiffré de bout en bout à chaque nœud</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mono text-mint">→</span>
              <span>Options réfrigérées et grand format sur demande</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mono text-mint">→</span>
              <span>Mobile money + paiement par carte pris en charge</span>
            </li>
          </ul>
        </div>

        <form
          onSubmit={submit}
          className="glass p-7 md:p-9 space-y-5"
          data-testid="booking-form"
        >
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Nom complet">
              <Input
                required
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="afri-input"
                data-testid="booking-name"
              />
            </Field>
            <Field label="E-mail">
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="afri-input"
                data-testid="booking-email"
              />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Téléphone (facultatif)">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="afri-input"
                data-testid="booking-phone"
              />
            </Field>
            <Field label="Ville">
              <Input
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="afri-input"
                placeholder="Dakar, Lagos, Nairobi…"
                data-testid="booking-city"
              />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Taille du casier">
              <Select
                value={form.locker_size}
                onValueChange={(v) => setForm({ ...form, locker_size: v })}
              >
                <SelectTrigger
                  className="afri-input"
                  data-testid="booking-size"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0c0c0e] border-white/10 text-zinc-200">
                  <SelectItem value="small">Petit — moins de 30L</SelectItem>
                  <SelectItem value="medium">Moyen — 30 à 120L</SelectItem>
                  <SelectItem value="large">Grand — 120 à 400L</SelectItem>
                  <SelectItem value="xl">Volumineux — jusqu'à 800L</SelectItem>
                  <SelectItem value="cold">Réfrigéré</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Plage de retrait">
              <Select
                value={form.pickup_window}
                onValueChange={(v) =>
                  setForm({ ...form, pickup_window: v })
                }
              >
                <SelectTrigger
                  className="afri-input"
                  data-testid="booking-window"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0c0c0e] border-white/10 text-zinc-200">
                  <SelectItem value="Matin (08:00 — 12:00)">
                    Matin (08:00 — 12:00)
                  </SelectItem>
                  <SelectItem value="Après-midi (12:00 — 17:00)">
                    Après-midi (12:00 — 17:00)
                  </SelectItem>
                  <SelectItem value="Soirée (17:00 — 21:00)">
                    Soirée (17:00 — 21:00)
                  </SelectItem>
                  <SelectItem value="Récurrent en semaine">
                    Récurrent en semaine
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Notes (facultatif)">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="afri-input min-h-[88px]"
              placeholder="Volume, fréquence, manipulation spéciale…"
              data-testid="booking-notes"
            />
          </Field>

          <Button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center hover:opacity-100"
            data-testid="booking-submit"
          >
            <Send size={14} />
            {submitting ? "Envoi…" : "Envoyer la demande"}
          </Button>
        </form>
      </div>
    </section>
  );
}

/* ---------- Newsletter ---------- */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.post(`${API}/newsletter`, { email });
      toast.success("Vous êtes sur la liste. Bienvenue.");
      setEmail("");
    } catch (err) {
      toast.error(
        err?.response?.data?.detail ||
          "Impossible d'inscrire cette adresse. Réessayez."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="newsletter"
      className="relative py-24 md:py-32 px-6 md:px-12"
      data-testid="newsletter-section"
    >
      <div className="max-w-5xl mx-auto glass p-10 md:p-16 relative overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(45,212,191,0.4) 0%, transparent 70%)",
          }}
        />
        <div className="relative grid md:grid-cols-[1.3fr,1fr] gap-10 items-end">
          <div>
            <span className="eyebrow">Fréquence 09</span>
            <h2 className="display-h2 text-3xl md:text-4xl lg:text-5xl text-white mt-4 leading-[1.05]">
              Transmissions trimestrielles.
              <br />
              <span className="text-zinc-500">Aucun bruit.</span>
            </h2>
            <p className="text-zinc-400 text-sm md:text-base mt-5 max-w-md leading-relaxed">
              Expansions du réseau, récits d'infrastructure et briefings
              opérateurs. Quatre fois par an.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-3" data-testid="newsletter-form">
            <Field label="E-mail">
              <div className="flex gap-3">
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@ville.africa"
                  className="afri-input"
                  data-testid="newsletter-email"
                />
                <Button
                  type="submit"
                  disabled={busy}
                  className="btn-primary !rounded-md hover:opacity-100"
                  data-testid="newsletter-submit"
                >
                  <Mail size={14} />
                  {busy ? "…" : "Rejoindre"}
                </Button>
              </div>
            </Field>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
export function Footer() {
  return (
    <footer
      className="relative border-t border-white/5 py-14 px-6 md:px-12 mt-12"
      data-testid="footer"
    >
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/afribox-logo.png"
              alt="AFRIBOX"
              className="w-10 h-10 object-contain"
              style={{ filter: "brightness(1.15)" }}
            />
            <div className="font-display text-2xl text-white">AFRIBOX</div>
          </div>
          <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
            Infrastructure intelligente de colis pour les villes africaines.
            Conçue à Dakar, Abidjan, Lagos, Accra, Nairobi & Casablanca.
          </p>
        </div>
        <div>
          <div className="hud text-[10px] mb-4">PRODUIT</div>
          <ul className="space-y-2 text-zinc-500 text-sm">
            <li>Fonctionnement</li>
            <li>Application mobile</li>
            <li>Sécurité</li>
            <li>Smart City</li>
          </ul>
        </div>
        <div>
          <div className="hud text-[10px] mb-4">ENTREPRISE</div>
          <ul className="space-y-2 text-zinc-500 text-sm">
            <li>À propos</li>
            <li>Kit presse</li>
            <li>Carrières</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 flex flex-wrap justify-between gap-4 mono text-[10px] tracking-[0.22em] text-zinc-600">
        <span>© 2026 AFRIBOX INFRASTRUCTURE</span>
        <span className="flex items-center gap-2">
          <span className="hud-dot" />
          RÉSEAU EN LIGNE · DAKAR · ABIDJAN · LAGOS
        </span>
      </div>
    </footer>
  );
}

/* ---------- Field helper ---------- */
function Field({ label, children }) {
  return (
    <div>
      <Label className="text-[11px] tracking-[0.18em] uppercase text-zinc-500 mb-2 block mono">
        {label}
      </Label>
      {children}
    </div>
  );
}
