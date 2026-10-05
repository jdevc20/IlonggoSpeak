CREATE TABLE "MaintenanceOption" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaintenanceOption_category_code_key"
  ON "MaintenanceOption"("category", "code");

CREATE INDEX "MaintenanceOption_category_active_sortOrder_idx"
  ON "MaintenanceOption"("category", "active", "sortOrder");

INSERT INTO "MaintenanceOption"
("id","category","code","label","value","description","sortOrder","active","isDefault")
VALUES
('intent:greeting','intent','greeting','Greeting','greeting','Salutations and opening greetings.',10,true,true),
('intent:farewell','intent','farewell','Farewell','farewell','Closing or leave-taking expressions.',20,true,false),
('intent:gratitude','intent','gratitude','Gratitude','gratitude','Thanks and appreciation.',30,true,false),
('intent:apology','intent','apology','Apology','apology','Apologies and expressions of regret.',40,true,false),
('intent:request','intent','request','Request','request','Requests for an action or item.',50,true,false),
('intent:question','intent','question','Question','Information-seeking questions.',60,true,false),
('intent:statement','intent','statement','Statement','Declarative information or description.',70,true,false),
('intent:command','intent','command','Command','Direct instructions or imperatives.',80,true,false),
('intent:confirmation','intent','confirmation','Confirmation','Confirming information or an action.',90,true,false),
('intent:refusal','intent','refusal','Refusal','Declining or rejecting a request.',100,true,false),
('intent:introduction','intent','introduction','Introduction','Introducing oneself or another person.',110,true,false),
('intent:clarification','intent','clarification','Clarification','Clarifying or correcting meaning.',120,true,false),
('intent:compliment','intent','compliment','Compliment','Praise or positive evaluation.',130,true,false),
('intent:well_wish','intent','well_wish','Well wish','well_wish','Wishes for health, success, or well-being.',140,true,false),
('intent:agreement','intent','agreement','Agreement','agreement','Expressing agreement.',150,true,false),
('intent:disagreement','intent','disagreement','Disagreement','disagreement','Expressing disagreement.',160,true,false),

('sentiment:negative','sentiment','negative','Negative','0','Negative emotional polarity.',10,true,false),
('sentiment:neutral','sentiment','neutral','Neutral','1','Neutral or non-emotional polarity.',20,true,true),
('sentiment:positive','sentiment','positive','Positive','2','Positive emotional polarity.',30,true,false),

('register:formal','register','formal','Formal','formal','Formal, institutional, or highly polite usage.',10,true,false),
('register:neutral','register','neutral','Neutral','neutral','Standard unmarked usage.',20,true,true),
('register:friendly','register','friendly','Friendly','friendly','Warm and friendly everyday usage.',30,true,false),
('register:conversational','register','conversational','Conversational','conversational','Natural spoken conversation.',40,true,false),
('register:informal','register','informal','Informal','informal','Casual speech among familiar people.',50,true,false),
('register:slang','register','slang','Slang','slang','Colloquial or slang-heavy expression.',60,true,false),
('register:respectful','register','respectful','Respectful','respectful','Respectful or honorific usage.',70,true,false),

('domain:daily_life','domain','daily_life','Daily life','daily_life','General everyday conversation.',10,true,true),
('domain:greetings','domain','greetings','Greetings','greetings','Greetings, introductions, and leave-taking.',20,true,false),
('domain:family','domain','family','Family','family','Family and household context.',30,true,false),
('domain:food','domain','food','Food','food','Food, cooking, dining, and drinks.',40,true,false),
('domain:travel','domain','travel','Travel','travel','Travel, directions, and places.',50,true,false),
('domain:work','domain','work','Work','work','Workplace and professional context.',60,true,false),
('domain:education','domain','education','Education','education','School, learning, and education.',70,true,false),
('domain:health','domain','health','Health','health','General health and wellness language.',80,true,false),
('domain:shopping','domain','shopping','Shopping','shopping','Buying, selling, prices, and markets.',90,true,false),
('domain:transportation','domain','transportation','Transportation','transportation','Vehicles and public transportation.',100,true,false),
('domain:weather','domain','weather','Weather','weather','Weather and climate.',110,true,false),
('domain:emotions','domain','emotions','Emotions','emotions','Feelings and emotional expression.',120,true,false),
('domain:culture','domain','culture','Culture','culture','Customs, traditions, and cultural context.',130,true,false),
('domain:technology','domain','technology','Technology','technology','Computers, devices, and digital technology.',140,true,false),
('domain:public_services','domain','public_services','Public services','public_services','Government and public-service interactions.',150,true,false),

('sarcasm:false','sarcasm','not_sarcastic','Not sarcastic','false','Literal/non-sarcastic expression.',10,true,true),
('sarcasm:true','sarcasm','sarcastic','Sarcastic','true','Sarcastic or ironic expression.',20,true,false),

('translation_type:natural','translation_type','natural','Natural','natural','Natural target-language phrasing that preserves meaning.',10,true,true),
('translation_type:literal','translation_type','literal','Literal','literal','Close word-for-word or structure-preserving translation.',20,true,false),
('translation_type:idiomatic','translation_type','idiomatic','Idiomatic','idiomatic','Uses a target-language idiom or conventional expression.',30,true,false),
('translation_type:contextual','translation_type','contextual','Contextual','contextual','Meaning adapted to the surrounding context.',40,true,false),

('language_pair:en-hil','language_pair','en-hil','English → Hiligaynon','en-hil','Primary Ilonggo Speak translation direction.',10,true,true),
('language_pair:hil-en','language_pair','hil-en','Hiligaynon → English','hil-en','Reverse translation direction.',20,true,false),

('unit_type:sentence','unit_type','sentence','Sentence','sentence','Complete sentence or utterance.',10,true,true),
('unit_type:phrase','unit_type','phrase','Phrase','phrase','Phrase or short expression.',20,true,false),
('unit_type:word','unit_type','word','Word','word','Single lexical item.',30,true,false),
('unit_type:idiom','unit_type','idiom','Idiom','idiom','Fixed idiomatic expression.',40,true,false)
ON CONFLICT ("category","code") DO NOTHING;
