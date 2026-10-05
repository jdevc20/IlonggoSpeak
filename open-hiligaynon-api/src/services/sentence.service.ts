import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { normalizeText } from "../utils/normalize.js";

const sentenceInclude = {
  sourceText: {
    include: {
      language: true,
    },
  },
  targetText: {
    include: {
      language: true,
      annotation: true,
      tokens: {
        include: {
          lexeme: {
            include: {
              senses: true,
            },
          },
        },
        orderBy: {
          tokenOrder: "asc" as const,
        },
      },
      grammarAnnotations: {
        orderBy: {
          createdAt: "asc" as const,
        },
      },
    },
  },
} satisfies Prisma.TranslationInclude;

type SentenceRecord = Prisma.TranslationGetPayload<{
  include: typeof sentenceInclude;
}>;

export interface SentenceQueryParams {
  skip?: number;
  take?: number;
  search?: string;
  sentiment?: number;
  isSarcastic?: boolean;
  status?: string;
}

export interface CreateSentenceInput {
  english: string;
  hiligaynon: string;
  sentiment?: number;
  intent?: string | null;
  isSarcastic?: boolean;
  status?: string;
  createdBy?: string | null;
  translationType?: string;
  confidence?: number | null;
  notes?: string | null;
  register?: string | null;
  domain?: string | null;
  languagePair?: string | null;
  unitType?: string | null;
}

export type UpdateSentenceInput = Partial<CreateSentenceInput>;

const toSentenceDto = (record: SentenceRecord) => {
  const annotation = record.targetText.annotation;

  return {
    id: record.id,
    english: record.sourceText.text,
    hiligaynon: record.targetText.text,
    normalizedEnglish: record.sourceText.normalizedText,
    normalizedHiligaynon: record.targetText.normalizedText,
    status: record.status,
    sentiment: annotation?.sentiment ?? 1,
    intent: annotation?.intent ?? null,
    isSarcastic: annotation?.isSarcastic ?? false,
    register: annotation?.register ?? null,
    domain: annotation?.domain ?? null,
    translationType: record.translationType,
    confidence: record.confidence,
    notes: record.notes,
    createdBy: record.createdBy,
    reviewedBy: record.reviewedBy,
    reviewedAt: record.reviewedAt,
    verifiedBy: record.verifiedBy,
    verifiedAt: record.verifiedAt,
    sourceLanguage: record.sourceText.language.code,
    targetLanguage: record.targetText.language.code,
    languagePair: `${record.sourceText.language.code}-${record.targetText.language.code}`,
    unitType: record.targetText.unitType,
    sourceTextId: record.sourceTextId,
    targetTextId: record.targetTextId,
    tokens: record.targetText.tokens.map((token) => ({
      id: token.id,
      tokenOrder: token.tokenOrder,
      text: token.text,
      normalized: token.normalized,
      lemma: token.lexeme?.lemma ?? null,
      lexemeId: token.lexemeId,
      pos: token.partOfSpeech ?? token.lexeme?.partOfSpeech ?? null,
      morphologicalFeatures: token.morphologicalFeatures,
      dependencyRelation: token.dependencyRelation,
      headTokenOrder: token.headTokenOrder,
      isSlang: token.isSlang,
      contextNote: token.contextNote,
      senses: token.lexeme?.senses ?? [],
    })),
    grammarAnnotations: record.targetText.grammarAnnotations,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

const getOrCreateLanguage = async (
  tx: Prisma.TransactionClient,
  code: string,
  name: string,
  nativeName: string
) => {
  return tx.language.upsert({
    where: { code },
    update: {},
    create: { code, name, nativeName },
  });
};

const getOrCreateTextUnit = async (
  tx: Prisma.TransactionClient,
  languageId: string,
  text: string,
  unitType = "sentence"
) => {
  const normalizedText = normalizeText(text);

  return tx.textUnit.upsert({
    where: {
      languageId_normalizedText_unitType: {
        languageId,
        normalizedText,
        unitType,
      },
    },
    update: {
      text: text.trim(),
    },
    create: {
      languageId,
      text: text.trim(),
      normalizedText,
      unitType,
    },
  });
};

const upsertTargetAnnotation = async (
  tx: Prisma.TransactionClient,
  textUnitId: string,
  data: {
    sentiment?: number;
    intent?: string | null;
    isSarcastic?: boolean;
    register?: string | null;
    domain?: string | null;
  }
) => {
  const updateData: Prisma.LinguisticAnnotationUpdateInput = {};

  if (data.sentiment !== undefined) updateData.sentiment = data.sentiment;
  if (data.intent !== undefined) updateData.intent = data.intent;
  if (data.isSarcastic !== undefined) updateData.isSarcastic = data.isSarcastic;
  if (data.register !== undefined) updateData.register = data.register;
  if (data.domain !== undefined) updateData.domain = data.domain;

  return tx.linguisticAnnotation.upsert({
    where: { textUnitId },
    update: updateData,
    create: {
      textUnitId,
      sentiment: data.sentiment ?? 1,
      intent: data.intent ?? null,
      isSarcastic: data.isSarcastic ?? false,
      register: data.register ?? null,
      domain: data.domain ?? null,
    },
  });
};

export const getAllSentences = async (params: SentenceQueryParams = {}) => {
  const {
    skip = 0,
    take = 50,
    search,
    sentiment,
    isSarcastic,
    status,
  } = params;

  const conditions: Prisma.TranslationWhereInput[] = [
    {
      sourceText: {
        is: {
          language: {
            is: { code: "en" },
          },
        },
      },
    },
    {
      targetText: {
        is: {
          language: {
            is: { code: "hil" },
          },
        },
      },
    },
  ];

  if (search) {
    const normalized = normalizeText(search);

    conditions.push({
      OR: [
        {
          sourceText: {
            is: {
              normalizedText: { contains: normalized },
            },
          },
        },
        {
          targetText: {
            is: {
              normalizedText: { contains: normalized },
            },
          },
        },
      ],
    });
  }

  if (status) {
    conditions.push({ status });
  }

  if (sentiment !== undefined || isSarcastic !== undefined) {
    const annotationFilter: Prisma.LinguisticAnnotationWhereInput = {};
    if (sentiment !== undefined) annotationFilter.sentiment = sentiment;
    if (isSarcastic !== undefined) annotationFilter.isSarcastic = isSarcastic;

    conditions.push({
      targetText: {
        is: {
          annotation: {
            is: annotationFilter,
          },
        },
      },
    });
  }

  const where: Prisma.TranslationWhereInput = { AND: conditions };

  const [translations, totalCount] = await prisma.$transaction([
    prisma.translation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: sentenceInclude,
    }),
    prisma.translation.count({ where }),
  ]);

  return {
    items: translations.map(toSentenceDto),
    meta: {
      total: totalCount,
      skip,
      take,
    },
  };
};

export const getSentenceById = async (id: string) => {
  const translation = await prisma.translation.findUnique({
    where: { id },
    include: sentenceInclude,
  });

  return translation ? toSentenceDto(translation) : null;
};

export const createSentence = async (data: CreateSentenceInput) => {
  const translationId = await prisma.$transaction(async (tx) => {
    const [english, hiligaynon] = await Promise.all([
      getOrCreateLanguage(tx, "en", "English", "English"),
      getOrCreateLanguage(tx, "hil", "Hiligaynon", "Hiligaynon"),
    ]);

    const unitType = data.unitType ?? "sentence";
    const sourceText = await getOrCreateTextUnit(tx, english.id, data.english, unitType);
    const targetText = await getOrCreateTextUnit(tx, hiligaynon.id, data.hiligaynon, unitType);

    await upsertTargetAnnotation(tx, targetText.id, data);

    const existingPair = await tx.translation.findFirst({
      where: {
        sourceTextId: sourceText.id,
        targetTextId: targetText.id,
      },
    });

    if (existingPair) {
      return existingPair.id;
    }

    const translation = await tx.translation.create({
      data: {
        sourceTextId: sourceText.id,
        targetTextId: targetText.id,
        status: "pending",
        createdBy: data.createdBy ?? null,
        translationType: data.translationType ?? "natural",
        confidence: data.confidence ?? null,
        notes: data.notes ?? null,
      },
    });

    return translation.id;
  });

  return getSentenceById(translationId);
};

export const updateSentence = async (
  id: string,
  data: UpdateSentenceInput,
  resetModeration = false
) => {
  const existing = await prisma.translation.findUnique({
    where: { id },
    include: {
      sourceText: true,
      targetText: true,
    },
  });

  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    let sourceTextId = existing.sourceTextId;
    let targetTextId = existing.targetTextId;

    const unitType = data.unitType ?? existing.targetText.unitType;

    if (data.english !== undefined || data.unitType !== undefined) {
      const english = await getOrCreateLanguage(tx, "en", "English", "English");
      const sourceText = await getOrCreateTextUnit(
        tx,
        english.id,
        data.english ?? existing.sourceText.text,
        unitType
      );
      sourceTextId = sourceText.id;
    }

    if (data.hiligaynon !== undefined || data.unitType !== undefined) {
      const hiligaynon = await getOrCreateLanguage(tx, "hil", "Hiligaynon", "Hiligaynon");
      const targetText = await getOrCreateTextUnit(
        tx,
        hiligaynon.id,
        data.hiligaynon ?? existing.targetText.text,
        unitType
      );
      targetTextId = targetText.id;
    }

    const hasAnnotationUpdate =
      data.sentiment !== undefined ||
      data.intent !== undefined ||
      data.isSarcastic !== undefined ||
      data.register !== undefined ||
      data.domain !== undefined;

    if (hasAnnotationUpdate) {
      await upsertTargetAnnotation(tx, targetTextId, data);
    }

    await tx.translation.update({
      where: { id },
      data: {
        sourceTextId,
        targetTextId,
        ...(resetModeration
          ? {
              status: "pending",
              reviewedBy: null,
              reviewedAt: null,
              verifiedBy: null,
              verifiedAt: null,
            }
          : {}),
        ...(data.translationType !== undefined
          ? { translationType: data.translationType }
          : {}),
        ...(data.confidence !== undefined ? { confidence: data.confidence } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });
  });

  return getSentenceById(id);
};

export const deleteSentence = async (id: string) => {
  return prisma.translation.delete({
    where: { id },
  });
};

export const deleteSentencesBulk = async (ids: string[]) => {
  return prisma.translation.deleteMany({
    where: {
      id: { in: ids },
    },
  });
};

export type ModerationTargetStatus = "approved" | "verified" | "rejected";

export const setModerationStatus = async (
  id: string,
  targetStatus: ModerationTargetStatus,
  actorUsername: string
) => {
  const now = new Date();

  const result =
    targetStatus === "approved"
      ? await prisma.translation.updateMany({
          where: { id, status: "pending" },
          data: {
            status: "approved",
            reviewedBy: actorUsername,
            reviewedAt: now,
          },
        })
      : targetStatus === "verified"
        ? await prisma.translation.updateMany({
            where: { id, status: "approved" },
            data: {
              status: "verified",
              verifiedBy: actorUsername,
              verifiedAt: now,
            },
          })
        : await prisma.translation.updateMany({
            where: { id, status: { in: ["pending", "approved"] } },
            data: {
              status: "rejected",
              reviewedBy: actorUsername,
              reviewedAt: now,
              verifiedBy: null,
              verifiedAt: null,
            },
          });

  if (result.count !== 1) {
    return null;
  }

  return getSentenceById(id);
};
