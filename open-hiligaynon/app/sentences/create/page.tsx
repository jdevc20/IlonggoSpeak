"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/contexts/AuthContext";
import { SentenceService } from "@/services/sentenceService";
import { getMaintenanceOptions, groupMaintenanceOptions } from "@/lib/maintenance";
import type { MaintenanceOption } from "@/types/maintenance";

export default function CreateSentencePage() {
  const router = useRouter();
  const { session } = useAuth();
  const [english, setEnglish] = useState("");
  const [hiligaynon, setHiligaynon] = useState("");
  const [sentiment, setSentiment] = useState(1);
  const [intent, setIntent] = useState("");
  const [domain, setDomain] = useState("");
  const [register, setRegister] = useState("");
  const [translationType, setTranslationType] = useState("natural");
  const [languagePair, setLanguagePair] = useState("en-hil");
  const [unitType, setUnitType] = useState("sentence");
  const [confidence, setConfidence] = useState("");
  const [notes, setNotes] = useState("");
  const [isSarcastic, setIsSarcastic] = useState(false);
  const [maintenance, setMaintenance] = useState<MaintenanceOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => groupMaintenanceOptions(maintenance), [maintenance]);
  const options = (category: string) => grouped[category] ?? [];

  useEffect(() => {
    void getMaintenanceOptions()
      .then(({ items }) => {
        setMaintenance(items);
        const groups = groupMaintenanceOptions(items);
        const defaultValue = (category: string, fallback: string) =>
          groups[category]?.find((item) => item.isDefault)?.value ??
          groups[category]?.[0]?.value ??
          fallback;

        setSentiment(Number(defaultValue("sentiment", "1")));
        setIntent(defaultValue("intent", "greeting"));
        setDomain(defaultValue("domain", "daily_life"));
        setRegister(defaultValue("register", "neutral"));
        setTranslationType(defaultValue("translation_type", "natural"));
        setLanguagePair(defaultValue("language_pair", "en-hil"));
        setUnitType(defaultValue("unit_type", "sentence"));
        setIsSarcastic(defaultValue("sarcasm", "false") === "true");
      })
      .catch(() => setError("Could not load metadata maintenance values."));
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!english.trim() || !hiligaynon.trim()) return;

    const parsedConfidence =
      confidence.trim() === "" ? null : Number.parseFloat(confidence);

    try {
      setSubmitting(true);
      setError(null);
      const response = await SentenceService.create({
        english: english.trim(),
        hiligaynon: hiligaynon.trim(),
        sentiment,
        intent: intent || null,
        domain: domain || null,
        register: register || null,
        translationType: translationType || "natural",
        languagePair,
        unitType,
        confidence: parsedConfidence,
        notes: notes.trim() || null,
        isSarcastic,
      });
      const id = response?.data?.id;
      router.push(id ? "/sentences/" + id : "/sentences");
    } catch (err: any) {
      setError(err?.response?.data?.details || "Could not save the translation.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950";

  const renderOptions = (category: string) =>
    options(category).map((item) => (
      <option key={item.id} value={item.value}>{item.label}</option>
    ));

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Team contribution</p>
            <h1 className="mt-1 text-3xl font-black">Add translation record</h1>
            <p className="mt-2 text-sm text-zinc-500">
              This record will be attributed to {session?.user.name} and enter the review queue as Pending.
            </p>
          </div>
          <Link href="/sentences" className="text-sm font-semibold text-zinc-500">Back to corpus</Link>
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-bold">Translation pair</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="text-sm font-semibold">
                English source
                <textarea value={english} onChange={(e) => setEnglish(e.target.value)} rows={4} className={inputClass} required />
              </label>
              <label className="text-sm font-semibold">
                Hiligaynon target
                <textarea value={hiligaynon} onChange={(e) => setHiligaynon(e.target.value)} rows={4} className={inputClass} required />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <h2 className="text-lg font-bold">Linguistic metadata</h2>
              <p className="mt-1 text-sm text-zinc-500">Values are maintained by the Language Lead and selected from controlled lists.</p>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-semibold">Intent
                <select value={intent} onChange={(e) => setIntent(e.target.value)} className={inputClass}>{renderOptions("intent")}</select>
              </label>
              <label className="text-sm font-semibold">Sentiment
                <select value={sentiment} onChange={(e) => setSentiment(Number(e.target.value))} className={inputClass}>{renderOptions("sentiment")}</select>
              </label>
              <label className="text-sm font-semibold">Register
                <select value={register} onChange={(e) => setRegister(e.target.value)} className={inputClass}>{renderOptions("register")}</select>
              </label>
              <label className="text-sm font-semibold">Domain
                <select value={domain} onChange={(e) => setDomain(e.target.value)} className={inputClass}>{renderOptions("domain")}</select>
              </label>
              <label className="text-sm font-semibold">Sarcasm
                <select value={String(isSarcastic)} onChange={(e) => setIsSarcastic(e.target.value === "true")} className={inputClass}>{renderOptions("sarcasm")}</select>
              </label>
              <label className="text-sm font-semibold">Translation type
                <select value={translationType} onChange={(e) => setTranslationType(e.target.value)} className={inputClass}>{renderOptions("translation_type")}</select>
              </label>
              <label className="text-sm font-semibold">Language pair
                <select value={languagePair} onChange={(e) => setLanguagePair(e.target.value)} className={inputClass}>{renderOptions("language_pair")}</select>
              </label>
              <label className="text-sm font-semibold">Unit type
                <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className={inputClass}>{renderOptions("unit_type")}</select>
              </label>
              <label className="text-sm font-semibold">Confidence
                <input type="number" min="0" max="1" step="0.01" value={confidence} onChange={(e) => setConfidence(e.target.value)} className={inputClass} placeholder="Optional, e.g. 0.98" />
              </label>
            </div>
            <label className="mt-5 block text-sm font-semibold">Notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} />
            </label>
          </section>

          <div className="flex justify-end gap-3">
            <Link href="/sentences" className="inline-flex h-11 items-center rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-900">Cancel</Link>
            <button type="submit" disabled={submitting || maintenance.length === 0} className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white disabled:opacity-50">
              {submitting ? "Saving…" : "Submit for review"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
