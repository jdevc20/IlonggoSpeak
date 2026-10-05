"use client";

import { RoleGate } from "@/components/RoleGate";
import { WorkspacePlaceholder } from "@/components/WorkspacePlaceholder";

export default function ModelVersionsPage() {
  return (
    <RoleGate roles={["REVIEWER", "ADMIN"]}>
      <WorkspacePlaceholder
        eyebrow="Model registry"
        title="Model Versions"
        description="Track which immutable dataset, training configuration, and evaluation results produced each Ilonggo Speak model version."
        items={[
          "Model version and lifecycle status",
          "Training dataset lineage",
          "Evaluation score history",
          "Promotion or rollback decision",
        ]}
      />
    </RoleGate>
  );
}
