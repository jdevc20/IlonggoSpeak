"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/contexts/AuthContext";
import { SentenceService } from "@/services/sentenceService";
import type { Sentence } from "@/types/sentence";
import { getMaintenanceOptions, groupMaintenanceOptions } from "@/lib/maintenance";
import type { MaintenanceOption } from "@/types/maintenance";

export default function TranslationDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { session } = useAuth();

  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [english, setEnglish] = useState("");
  const [hiligaynon, setHiligaynon] = useState("");
  const [sentiment, setSentiment] = useState(1);
  const [intent, setIntent] = useState("");
  const [domain, setDomain] = useState("");
  const [register, setRegister] = useState("");
  const [translationType, setTranslationType] = useState("natural");
  const [confidence, setConfidence] = useState("");
  const [notes, setNotes] = useState("");
  const [isSarcastic, setIsSarcastic] = useState(false);
  const [languagePair, setLanguagePair] = useState("en-hil");
  const [unitType, setUnitType] = useState("sentence");
  const [maintenance, setMaintenance] = useState<MaintenanceOption[]>([]);
  const grouped = useMemo(() => groupMaintenanceOptions(maintenance), [maintenance]);
  const options = (category: string) => grouped[category] ?? [];

  const hydrate = (data: Sentence) => {
    setEnglish(data.english);
    setHiligaynon(data.hiligaynon);
    setSentiment(data.sentiment);
    setIntent(data.intent ?? "");
    setDomain(data.domain ?? "");
    setRegister(data.register ?? "");
    setTranslationType(data.translationType || "natural");
    setConfidence(data.confidence === null ? "" : String(data.confidence));
    setNotes(data.notes ?? "");
    setIsSarcastic(data.isSarcastic);
    setLanguagePair(data.languagePair || "en-hil");
    setUnitType(data.unitType || "sentence");
  };

  const load = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [data, metadata] = await Promise.all([
        SentenceService.get(id),
        getMaintenanceOptions(),
      ]);
      setMaintenance(metadata.items);
      setSentence(data);
      hydrate(data);
    } catch {
      setError("Could not load this translation record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <AppNav />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-zinc-500">
          Loading translation…
        </div>
      </div>
    );
  }

  if (!sentence || !session) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-black">Translation unavailable</h1>
          <p className="mt-2 text-zinc-500">{error || "Record not found."}</p>
        </main>
      </div>
    );
  }

  const role = session.user.role;
  const canEdit =
    role === "ADMIN" ||
    (role === "REVIEWER" && sentence.status === "pending") ||
    (role === "CONTRIBUTOR" &&
      sentence.status === "pending" &&
      sentence.createdBy === session.user.username);
  const canApprove =
    (role === "REVIEWER" || role === "ADMIN") && sentence.status === "pending";
  const canVerify = role === "ADMIN" && sentence.status === "approved";
  const canReject =
    (role === "REVIEWER" || role === "ADMIN") &&
    (sentence.status === "pending" || sentence.status === "approved");

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;

    const parsedConfidence =
      confidence.trim() === "" ? null : Number.parseFloat(confidence);

    try {
      setSaving(true);
      setError(null);
      const response = await SentenceService.update(sentence.id, {
        english: english.trim(),
        hiligaynon: hiligaynon.trim(),
        sentiment,
        intent: intent.trim() || null,
        domain: domain.trim() || null,
        register: register.trim() || null,
        translationType: translationType || "natural",
        languagePair,
        unitType,
        confidence: parsedConfidence,
        notes: notes.trim() || null,
        isSarcastic,
      });

      if (response?.data) {
        setSentence(response.data);
        hydrate(response.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.details || "Could not save the translation.");
    } finally {
      setSaving(false);
    }
  };

  const review = async (status: "approved" | "verified" | "rejected") => {
    try {
      setSaving(true);
      setError(null);
      const response = await SentenceService.moderate(sentence.id, status);
      if (response?.data) {
        setSentence(response.data);
        hydrate(response.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.details || "Could not update review status.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:disabled:bg-zinc-900";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/sentences" className="text-sm font-semibold text-blue-600">← Corpus</Link>
            <h1 className="mt-2 text-3xl font-black">Translation record</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Team-owned translation with reviewer and Language Lead audit history.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canApprove && (
              <button onClick={() => void review("approved")} disabled={saving} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">
                Approve
              </button>
            )}
            {canVerify && (
              <button onClick={() => void review("verified")} disabled={saving} className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white">
                Verify
              </button>
            )}
            {canReject && (
              <button onClick={() => void review("rejected")} disabled={saving} className="h-10 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-600">
                Reject
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">English</p>
            <p className="mt-4 text-xl font-bold">{sentence.english}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-white p-6 dark:border-blue-900 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Hiligaynon</p>
            <p className="mt-4 text-xl font-black text-blue-700 dark:text-blue-400">{sentence.hiligaynon}</p>
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Status", sentence.status],
            ["Created by", sentence.createdBy || "legacy import"],
            ["Reviewed by", sentence.reviewedBy || "—"],
            ["Verified by", sentence.verifiedBy || "—"],
            ["Domain", sentence.domain || "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
              <p className="mt-1 break-words text-sm font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xl font-black">Linguistic analysis</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold">Tokens</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sentence.tokens.length === 0 ? (
                  <span className="text-sm text-zinc-500">No token annotations.</span>
                ) : (
                  sentence.tokens.map((token) => (
                    <span key={token.id} className="rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800">
                      {token.text}{token.pos ? " · " + token.pos : ""}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold">Grammar annotations</p>
              <div className="mt-3 space-y-2">
                {sentence.grammarAnnotations.length === 0 ? (
                  <span className="text-sm text-zinc-500">No grammar annotations.</span>
                ) : (
                  sentence.grammarAnnotations.map((item) => (
                    <div key={item.id} className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-950">
                      <span className="font-semibold">{item.category}: {item.label}</span>
                      {item.value ? <span className="text-zinc-500"> · {item.value}</span> : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-600">Record editor</p>
              <h2 className="mt-1 text-xl font-black">Translation metadata</h2>
              {!canEdit && (
                <p className="mt-2 text-sm text-zinc-500">
                  Your role or this record's workflow state does not permit editing.
                </p>
              )}
            </div>
          </div>

          <form onSubmit={save} className="mt-5 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-semibold">
                English source
                <textarea disabled={!canEdit} rows={4} value={english} onChange={(e) => setEnglish(e.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-semibold">
                Hiligaynon target
                <textarea disabled={!canEdit} rows={4} value={hiligaynon} onChange={(e) => setHiligaynon(e.target.value)} className={inputClass} />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-semibold">Intent
                <select disabled={!canEdit} value={intent} onChange={(e) => setIntent(e.target.value)} className={inputClass}>
                  {options("intent").map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Sentiment
                <select disabled={!canEdit} value={sentiment} onChange={(e) => setSentiment(Number(e.target.value))} className={inputClass}>
                  {options("sentiment").map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Register
                <select disabled={!canEdit} value={register} onChange={(e) => setRegister(e.target.value)} className={inputClass}>
                  {options("register").map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Domain
                <select disabled={!canEdit} value={domain} onChange={(e) => setDomain(e.target.value)} className={inputClass}>
                  {options("domain").map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Sarcasm
                <select disabled={!canEdit} value={String(isSarcastic)} onChange={(e) => setIsSarcastic(e.target.value === "true")} className={inputClass}>
                  {options("sarcasm").map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Translation type
                <select disabled={!canEdit} value={translationType} onChange={(e) => setTranslationType(e.target.value)} className={inputClass}>
                  {options("translation_type").map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Language pair
                <select disabled={!canEdit} value={languagePair} onChange={(e) => setLanguagePair(e.target.value)} className={inputClass}>
                  {options("language_pair").map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Unit type
                <select disabled={!canEdit} value={unitType} onChange={(e) => setUnitType(e.target.value)} className={inputClass}>
                  {options("unit_type").map((item) => <option key={item.id} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Confidence
                <input disabled={!canEdit} type="number" min="0" max="1" step="0.01" value={confidence} onChange={(e) => setConfidence(e.target.value)} className={inputClass} />
              </label>
            </div>

            <label className="block text-sm font-semibold">
              Notes
              <textarea disabled={!canEdit} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
            </label>

            {canEdit && (
              <div className="flex justify-end">
                <button type="submit" disabled={saving || !english.trim() || !hiligaynon.trim()} className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white disabled:opacity-50">
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
