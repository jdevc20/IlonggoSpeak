"use client";

import { RoleGate } from "@/components/RoleGate";
import { WorkspacePlaceholder } from "@/components/WorkspacePlaceholder";

export default function ModelEvaluationPage() {
  return (
    <RoleGate roles={["REVIEWER", "ADMIN"]}>
      <WorkspacePlaceholder
        eyebrow="Quality assurance"
        title="Model Evaluation"
        description="Compare candidate translation models against a held-out Hiligaynon evaluation set and structured human review."
        items={[
          "chrF++ and BLEU metrics",
          "Meaning accuracy",
          "Grammar and naturalness review",
          "Domain and register breakdown",
        ]}
      />
    </RoleGate>
  );
}
