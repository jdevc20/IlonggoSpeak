# Ilonggo Speak

Ilonggo Speak is a **team-only Hiligaynon language engineering workspace** for building a controlled English ↔ Hiligaynon corpus, reviewing linguistic data, generating versioned datasets, and preparing translation-model workflows.

The application is designed around three internal roles:

| Role | Responsibility |
|---|---|
| Contributor | Create translations and edit their own pending records |
| Reviewer | Review pending translations, approve or reject records |
| Admin / Language Lead | Final verification, deletion, dataset generation, team administration, model training |

There is no public registration. Team accounts are configured statically in the API environment.

## Workspace

The frontend is organized into:

- Dashboard
- Corpus
- Dictionary
- Review Queue
- Verified Data
- Datasets
- Model Training
- Model Evaluation
- Model Versions
- Team
- Settings

## Review workflow

```text
Contributor
    |
    v
 pending
    |
    v
Reviewer
  |     \
  v      v
approved rejected
  |
  v
Language Lead
  |
  v
verified
  |
  v
Dataset generation
```

Only `verified` translations are eligible for generated training datasets.

Records retain internal team audit fields:

- `createdBy`
- `reviewedBy`
- `reviewedAt`
- `verifiedBy`
- `verifiedAt`

Editing an approved or verified record as the Language Lead resets its review state to `pending`.

## Architecture

```text
IlonggoSpeak/
├── open-hiligaynon/          # Next.js frontend
├── open-hiligaynon-api/      # Express + TypeScript + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── src/
│       ├── auth/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── lib/
│       └── utils/
└── Postman/
```

The directory names are retained for deployment compatibility; the product name is **Ilonggo Speak**.

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| API | Express, Node.js, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| HTTP client | Axios |
| Team sessions | Server-signed HMAC token |

## Static team authentication

Accounts are read from server environment variables. Credentials are never stored in the frontend and must never use a `NEXT_PUBLIC_*` variable.

Copy:

```bash
open-hiligaynon-api/.env.example -> open-hiligaynon-api/.env
```

Configure:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ilonggo_speak

CORS_ORIGINS=http://localhost:3000

TEAM_AUTH_SECRET=replace-with-a-random-secret-at-least-32-characters-long
TEAM_SESSION_TTL_HOURS=12

TEAM_ACCOUNTS_JSON=[{"id":"contributor-1","name":"Contributor One","username":"contributor","password":"change-me","role":"CONTRIBUTOR"},{"id":"reviewer-1","name":"Reviewer One","username":"reviewer","password":"change-me","role":"REVIEWER"},{"id":"language-lead-1","name":"Language Lead","username":"admin","password":"change-me","role":"ADMIN"}]
```

Use deployment secret/environment controls for real passwords and `TEAM_AUTH_SECRET`. Do not commit production credentials.

### Authentication API

```http
POST /api/auth/login
GET  /api/auth/me
GET  /api/auth/team
```

`GET /api/auth/team` is restricted to the Language Lead and returns sanitized account information without passwords.

Protected requests use:

```http
Authorization: Bearer <team-session-token>
```

## Corpus API

Base path: `/api/sentences`.

| Method | Path | Access |
|---|---|---|
| GET | `/api/sentences` | Team |
| POST | `/api/sentences` | Team |
| GET | `/api/sentences/:id` | Team |
| PATCH | `/api/sentences/:id` | Role/ownership rules |
| PATCH | `/api/sentences/:id/status` | Reviewer / Language Lead |
| DELETE | `/api/sentences/:id` | Language Lead |
| POST | `/api/sentences/bulk-delete` | Language Lead |

Status transitions:

- `pending -> approved`: Reviewer or Language Lead
- `pending -> rejected`: Reviewer or Language Lead
- `approved -> verified`: Language Lead only
- `approved -> rejected`: Reviewer or Language Lead

## Linguistic data model

The corpus uses normalized language entities instead of storing each translation as a single flat row.

```text
Language
   |
   └── TextUnit
          ├── LinguisticAnnotation
          ├── TokenAnnotation ──> Lexeme ──> LexemeSense
          ├── GrammarAnnotation
          ├── TextSource ──> SourceRecord
          |
          ├── source of ──> Translation
          └── target of ──> Translation
                            ├── TranslationSource
                            └── DatasetItem ──> Dataset
```

### Main models

**TextUnit** stores language text independently from translation relationships.

**Translation** connects source and target text and stores workflow state, confidence, notes, team audit information, provenance, and dataset membership.

**LinguisticAnnotation** stores text-level labels such as sentiment, intent, register, domain, and extensible metadata.

**TokenAnnotation** stores ordered token-level annotations, lexeme links, morphology, dependency metadata, and contextual notes.

**Lexeme / LexemeSense / LexemeTranslation** provide the reusable dictionary layer.

**GrammarAnnotation** stores grammar structures for text or token ranges.

**SourceRecord** tracks controlled source/provenance information.

**Dataset / DatasetItem** provide immutable dataset versions and explicit train / validation / test membership.

## Engine API

Base path: `/api/engine`.

```http
GET /api/engine/dictionary?q=gid&language=hil
GET /api/engine/text-units/:id/analysis
GET /api/engine/datasets/:id/export
POST /api/engine/datasets/generate
```

Dictionary and analysis require a signed-in team account.

Dataset export requires Reviewer or Language Lead access.

Dataset generation is restricted to the Language Lead and always selects only `verified` translations.

Generated datasets record the Language Lead username in `generatedBy`.

## Dataset workflow

Dataset versions should be immutable once used for model training.

Example:

```text
Verified corpus
      |
      v
hil-general-v1
      |
      ├── train
      ├── validation
      └── test
      |
      v
Model training run
```

When corpus data changes, create a new dataset version instead of mutating a version already used for training.

## Model workspaces

The UI now separates:

- **Model Training** — Language Lead only
- **Model Evaluation** — Reviewer and Language Lead
- **Model Versions** — Reviewer and Language Lead

These sections establish the product workflow and access boundaries. A Python ML/training service can be integrated later without coupling training execution to the Node corpus API.

## Local development

### API

```bash
cd open-hiligaynon-api
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### Frontend

```bash
cd open-hiligaynon
cp .env.example .env.local
npm install
npm run dev
```

Frontend environment:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

Adjust the URL to match the API port used locally.

## Production migration

```bash
npm run db:deploy
```

For the existing schema repair workflow:

```bash
npm run db:force-migrate
```

## Training-data rule

A translation should not enter model training merely because it exists in the corpus. Use only Language Lead-verified records with known provenance and explicit dataset membership.

## License

Project source code is licensed under the [MIT License](LICENSE). Dataset/source rights should continue to be tracked independently through source and dataset metadata.
