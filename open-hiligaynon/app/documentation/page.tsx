"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/contexts/AuthContext";
import { roleLabel } from "@/lib/auth";

const topics = [
  ["overview", "Project overview"],
  ["architecture", "How the system works"],
  ["roles", "Team roles"],
  ["workflow", "Translation workflow"],
  ["metadata", "Metadata standards"],
  ["datasets", "Dataset generation"],
  ["ml-roadmap", "Machine learning roadmap"],
  ["training-service", "Python ML service"],
  ["model-training", "Model training"],
  ["evaluation", "Model evaluation"],
  ["versions", "Model versions"],
  ["translation-api", "Translation API"],
  ["roadmap", "Delivery plan"],
] as const;

const statusBadge = (status: "current" | "planned") =>
  status === "current"
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";

function Status({ children, status }: { children: ReactNode; status: "current" | "planned" }) {
  return (
    <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " + statusBadge(status)}>
      {children}
    </span>
  );
}

function Section({
  id,
  title,
  eyebrow,
  children,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-zinc-200 py-10 last:border-b-0 dark:border-zinc-800">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
      <div className="mt-5 space-y-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}

export default function DocumentationPage() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100">
      <AppNav />

      <div className="mx-auto grid w-full max-w-screen-2xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:self-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                Ilonggo Speak Wiki
              </p>
              <p className="mt-2 text-sm font-semibold">
                Project, workflow, roles, and model-development plans.
              </p>
            </div>

            <nav
              aria-label="Documentation topics"
              className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
            >
              {topics.map(([id, label]) => (
                <a
                  key={id}
                  href={"#" + id}
                  className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 rounded-2xl border border-zinc-200 bg-white px-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:px-8">
          <header className="border-b border-zinc-200 py-10 dark:border-zinc-800">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              Team documentation
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">
              Ilonggo Speak Project Wiki
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
              This documentation explains what Ilonggo Speak does today, how each team role uses it,
              and how the project is planned to evolve from a reviewed Hiligaynon corpus workspace
              into a versioned machine-translation platform.
            </p>

            {session && (
              <div className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
                <span className="text-zinc-500 dark:text-zinc-400">Your current access:</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  {roleLabel(session.user.role)}
                </span>
              </div>
            )}
          </header>

          <Section id="overview" title="Project overview" eyebrow="Purpose">
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">Ilonggo Speak</strong> is an internal
              team workspace for building high-quality English ↔ Hiligaynon language data. The immediate
              goal is not to let the public vote on translations. Instead, the system uses controlled team
              review so the corpus can become trustworthy enough for dataset generation and future model training.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <Status status="current">Current</Status>
                <p className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">Language-data workspace</p>
                <p className="mt-1">Corpus contribution, review, verification, dictionary data, metadata maintenance, and dataset generation.</p>
              </div>
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <Status status="planned">Planned</Status>
                <p className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">Translation-model platform</p>
                <p className="mt-1">Python training jobs, evaluation, model registry, inference, and a translation API.</p>
              </div>
            </div>
          </Section>

          <Section id="architecture" title="How the system works" eyebrow="Architecture">
            <div className="overflow-x-auto rounded-xl bg-zinc-950 p-5 font-mono text-xs leading-6 text-zinc-200">
              <pre>{`Next.js frontend (Netlify)
        ↓
Node / Express API (Render)
        ↓
PostgreSQL corpus + datasets
        ↓
Verified training data
        ↓
Python ML service            ← planned
        ↓
Fine-tuned model             ← planned
        ↓
Evaluation + versioning      ← planned
        ↓
Translation API              ← planned`}</pre>
            </div>
            <p>
              The web application and Node API remain responsible for users, workflow, metadata, and corpus
              management. Machine-learning work should be separated into a Python service so long-running
              training and GPU workloads do not block normal application traffic.
            </p>
          </Section>

          <Section id="roles" title="Team roles" eyebrow="Access model">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-3 pr-4 font-bold">Role</th>
                    <th className="py-3 pr-4 font-bold">Main responsibility</th>
                    <th className="py-3 pr-4 font-bold">Can do</th>
                    <th className="py-3 font-bold">Cannot do</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-4 pr-4 font-bold text-blue-700 dark:text-blue-300">Contributor</td>
                    <td className="py-4 pr-4">Add useful English–Hiligaynon translation pairs.</td>
                    <td className="py-4 pr-4">Create records, edit own pending records, browse workspace data.</td>
                    <td className="py-4">Approve, verify, delete, or generate datasets.</td>
                  </tr>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-4 pr-4 font-bold text-blue-700 dark:text-blue-300">Reviewer</td>
                    <td className="py-4 pr-4">Check linguistic quality before final verification.</td>
                    <td className="py-4 pr-4">Review pending data, approve/reject, inspect datasets, evaluate model results.</td>
                    <td className="py-4">Final verification, team administration, dataset generation, model training.</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4 font-bold text-blue-700 dark:text-blue-300">Language Lead / Admin</td>
                    <td className="py-4 pr-4">Own standards, final quality, datasets, and future model releases.</td>
                    <td className="py-4 pr-4">Verify records, delete data, maintain metadata, generate datasets, manage model workflow.</td>
                    <td className="py-4">No additional workflow restriction inside the team workspace.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="workflow" title="Translation workflow" eyebrow="Quality control">
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ["1", "Contributor", "Creates a translation", "pending"],
                ["2", "Reviewer", "Checks meaning and naturalness", "approved / rejected"],
                ["3", "Language Lead", "Performs final verification", "verified"],
                ["4", "Dataset", "Uses verified records only", "training-ready"],
              ].map(([step, who, action, state]) => (
                <div key={step} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Step {step}</p>
                  <p className="mt-2 font-black text-zinc-900 dark:text-zinc-100">{who}</p>
                  <p className="mt-2">{action}</p>
                  <p className="mt-3 font-mono text-xs text-blue-600 dark:text-blue-400">{state}</p>
                </div>
              ))}
            </div>
            <p>
              Verified data is treated as the trusted source for model development. If a verified record is later
              found to be incorrect, fix the corpus first and regenerate the dataset rather than manually patching
              a model without traceability.
            </p>
          </Section>

          <Section id="metadata" title="Metadata standards" eyebrow="Linguistic context">
            <p>
              Each translation can carry structured labels so future datasets can be filtered and evaluated more
              precisely. Current controlled fields include intent, sentiment, register, domain, sarcasm,
              translation type, language pair, and unit type.
            </p>
            <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Example</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <code>Intent: greeting</code>
                <code>Sentiment: positive</code>
                <code>Register: friendly</code>
                <code>Domain: greetings</code>
                <code>Sarcasm: false</code>
                <code>Translation type: natural</code>
                <code>Language pair: en → hil</code>
                <code>Unit type: sentence</code>
              </div>
            </div>
          </Section>

          <Section id="datasets" title="Dataset generation" eyebrow="Training data">
            <Status status="current">Available now</Status>
            <p>
              A dataset is an immutable snapshot of verified records selected for a specific training or evaluation
              purpose. The generator can filter eligible data, assign train/validation/test splits, and record who
              generated the dataset.
            </p>
            <div className="overflow-x-auto rounded-xl bg-zinc-950 p-5 font-mono text-xs leading-6 text-zinc-200">
              <pre>{`Verified Corpus
      ↓
Dataset Generator
      ↓
Train split
Validation split
Test split
      ↓
Versioned dataset`}</pre>
            </div>
            <p>
              The test split should remain untouched during training. It is used later to measure whether a new
              model actually generalizes to data it did not learn from.
            </p>
          </Section>

          <Section id="ml-roadmap" title="Machine learning roadmap" eyebrow="Future capability">
            <Status status="planned">Planned</Status>
            <p>
              Ilonggo Speak is designed so the verified corpus becomes the foundation for a future English ↔
              Hiligaynon translation model. The recommended approach is to fine-tune an existing multilingual
              sequence-to-sequence model rather than train a large model from zero.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["1", "Prepare", "Clean and version training data."],
                ["2", "Fine-tune", "Adapt a multilingual base model."],
                ["3", "Evaluate", "Measure quality and run human review."],
                ["4", "Release", "Promote a tested model version to inference."],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <p className="text-xs font-black text-blue-600">{number}</p>
                  <p className="mt-2 font-bold text-zinc-900 dark:text-zinc-100">{title}</p>
                  <p className="mt-1">{text}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="training-service" title="Python ML service" eyebrow="Planned service">
            <Status status="planned">Not connected yet</Status>
            <p>
              The next major backend component should be a separate Python service using tools such as FastAPI,
              PyTorch, Transformers, Datasets, and SacreBLEU. It will receive a dataset/version reference and run
              model jobs independently from the normal Node API.
            </p>
            <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Recommended responsibility split</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Node API: corpus, auth, roles, datasets, job metadata, permissions.</li>
                <li>Python service: training, evaluation, inference, model artifact production.</li>
                <li>Model storage: versioned model files outside PostgreSQL.</li>
              </ul>
            </div>
          </Section>

          <Section id="model-training" title="Model training" eyebrow="Planned workflow">
            <Status status="planned">Planned</Status>
            <p>
              Training will take a selected dataset and a base multilingual model, tokenize English/Hiligaynon
              pairs, fine-tune the model, and save the resulting artifact as a candidate version.
            </p>
            <p>
              The Model Training page is currently an organizational placeholder. A future implementation should
              create asynchronous jobs with states such as <code>queued</code>, <code>preparing_dataset</code>,
              <code>training</code>, <code>evaluating</code>, and <code>completed</code>. The browser should never
              wait on one long HTTP request for an entire training run.
            </p>
          </Section>

          <Section id="evaluation" title="Model evaluation" eyebrow="Quality gate">
            <Status status="planned">Planned</Status>
            <p>
              A trained model should not become active simply because training completed. Each candidate should be
              evaluated against the held-out test set and then reviewed by people who understand natural Hiligaynon.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">Automatic metrics</p>
                <p className="mt-2">BLEU, chrF / chrF++, loss, and regression checks.</p>
              </div>
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">Human evaluation</p>
                <p className="mt-2">Meaning, grammar, naturalness, Hiligaynon authenticity, register, and contamination checks.</p>
              </div>
            </div>
          </Section>

          <Section id="versions" title="Model versions" eyebrow="Release management">
            <Status status="planned">Planned</Status>
            <p>
              Every completed model should be traceable to the dataset, base model, training configuration, metrics,
              and release status that produced it. Never overwrite one anonymous model file.
            </p>
            <div className="rounded-xl bg-zinc-950 p-5 font-mono text-xs leading-6 text-zinc-200">
              <pre>{`v0.1  archived
v0.2  candidate
v0.3  production`}</pre>
            </div>
            <p>
              This makes rollback possible: if a new release performs worse in production, the Language Lead can
              switch back to a previously approved version.
            </p>
          </Section>

          <Section id="translation-api" title="Translation API" eyebrow="Inference">
            <Status status="planned">Planned</Status>
            <p>
              Once a model version passes evaluation, the Python service can expose inference internally. The normal
              Ilonggo Speak Node API should proxy the request so authentication, logging, rate limits, and version
              selection remain centralized.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">Request</p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-200">{`{
  "text": "Where are you going?",
  "sourceLanguage": "en",
  "targetLanguage": "hil"
}`}</pre>
              </div>
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">Response</p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-200">{`{
  "translation": "Diin ka makadto?",
  "modelVersion": "0.3.0"
}`}</pre>
              </div>
            </div>
          </Section>

          <Section id="roadmap" title="Delivery plan" eyebrow="Roadmap">
            <div className="space-y-3">
              {[
                ["Phase 1", "Corpus quality", "Build and verify reliable Hiligaynon data.", "current"],
                ["Phase 2", "Dataset discipline", "Version datasets and protect train/validation/test separation.", "current"],
                ["Phase 3", "Python ML service", "Add health, job handling, training, evaluation, and artifact storage.", "planned"],
                ["Phase 4", "Baseline model", "Fine-tune the first multilingual baseline and record metrics.", "planned"],
                ["Phase 5", "Model registry", "Track candidates, production versions, and rollback history.", "planned"],
                ["Phase 6", "Translation API", "Serve the approved model through authenticated inference.", "planned"],
                ["Phase 7", "Feedback loop", "Turn reviewed model mistakes into new corpus improvements.", "planned"],
              ].map(([phase, title, description, status]) => (
                <div key={phase} className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[110px_180px_1fr_auto] sm:items-center">
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-400">{phase}</p>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{title}</p>
                  <p>{description}</p>
                  <Status status={status as "current" | "planned"}>
                    {status === "current" ? "Current" : "Planned"}
                  </Status>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="font-bold text-blue-900 dark:text-blue-100">Core project rule</p>
              <p className="mt-2 text-blue-900/80 dark:text-blue-100/80">
                The verified corpus is the source of truth. Models can always be retrained; corrupted or poorly
                reviewed language data is much harder to repair later.
              </p>
            </div>

            <p>
              For day-to-day use, start with <Link href="/sentences" className="font-semibold text-blue-600 hover:underline">Corpus</Link>,
              move quality work through the <Link href="/review-queue" className="font-semibold text-blue-600 hover:underline">Review Queue</Link>,
              inspect <Link href="/verified" className="font-semibold text-blue-600 hover:underline">Verified Data</Link>,
              and generate datasets only when the verified records meet the intended training purpose.
            </p>
          </Section>
        </main>
      </div>
    </div>
  );
}
