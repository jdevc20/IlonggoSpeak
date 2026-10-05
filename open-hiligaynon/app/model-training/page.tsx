"use client";

import { RoleGate } from "@/components/RoleGate";
import { WorkspacePlaceholder } from "@/components/WorkspacePlaceholder";

export default function ModelTrainingPage() {
  return (
    <RoleGate roles={["ADMIN"]}>
      <WorkspacePlaceholder
        eyebrow="Language Lead"
        title="Model Training"
        description="Prepare controlled training runs from immutable verified datasets. This workspace is reserved for the Language Lead."
        items={[
          "Select dataset version",
          "Choose base translation model",
          "Configure training hyperparameters",
          "Start and track a training run",
        ]}
      />
    </RoleGate>
  );
}
