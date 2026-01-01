"use client";

import { useState } from "react";
import type { Entity, EntityType } from "@/lib/models";
import { Badge, Card, Icon, PrimaryButton, SecondaryButton } from "@/lib/ui";
import { WIZARD_CONFIGS, type WizardField, type WizardFieldOption, QUICK_SELECT_OPTIONS } from "@/lib/wizardConfig";

type WizardData = Record<string, any>;

type EntityWizardProps = {
  entityType: EntityType;
  existingEntity?: Entity | null;
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
};

export function EntityWizard({ entityType, existingEntity, onComplete, onCancel }: EntityWizardProps) {
  const config = WIZARD_CONFIGS[entityType];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Pre-fill wizard data from existing entity
  const [wizardData, setWizardData] = useState<WizardData>(() => {
    if (existingEntity) {
      return {
        ...existingEntity.attributes,
        name: existingEntity.name,
        summary: existingEntity.summary,
        ...(existingEntity.character || {}),
      };
    }
    return {};
  });

  const currentStep = config.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === config.steps.length - 1;

  const updateField = (key: string, value: any) => {
    setWizardData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onComplete(wizardData);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const canProceed = () => {
    const requiredFields = currentStep.fields.filter((f) => f.required);
    return requiredFields.every((f) => {
      const value = wizardData[f.key];
      return value !== undefined && value !== null && value !== "";
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                  <Icon name={currentStep.icon as any} className="h-5 w-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">{currentStep.title}</h3>
                  <p className="text-sm text-zinc-600">{currentStep.description}</p>
                </div>
              </div>
            </div>
            <Badge tone="neutral">
              Step {currentStepIndex + 1} of {config.steps.length}
            </Badge>
          </div>

          <div className="mt-4 flex gap-1">
            {config.steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  idx <= currentStepIndex ? "bg-indigo-500" : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {currentStep.fields.map((field) => (
            <WizardFieldComponent
              key={field.key}
              field={field}
              value={wizardData[field.key]}
              onChange={(value) => updateField(field.key, value)}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-200 pt-6">
          <div className="flex gap-2">
            <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
            {!isFirstStep && <SecondaryButton onClick={handleBack}>Back</SecondaryButton>}
          </div>
          <PrimaryButton onClick={handleNext} disabled={!canProceed()}>
            {isLastStep ? "Complete & Generate" : "Next"}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

type WizardFieldComponentProps = {
  field: WizardField;
  value: any;
  onChange: (value: any) => void;
};

function WizardFieldComponent({ field, value, onChange }: WizardFieldComponentProps) {
  const quickOptions = QUICK_SELECT_OPTIONS[field.key];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-900">
          {field.label}
          {field.required && <span className="ml-1 text-red-500">*</span>}
        </label>
        {field.description && <span className="text-xs text-zinc-500">{field.description}</span>}
      </div>

      {/* Quick Select Icons */}
      {quickOptions && quickOptions.length > 0 && (field.type === "text" || field.type === "textarea") && (
        <div className="flex flex-wrap gap-1.5">
          {quickOptions.map((opt: WizardFieldOption) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const currentVal = value || "";
                const newVal = currentVal ? `${currentVal}, ${opt.value}` : opt.value;
                onChange(newVal);
              }}
              className="group flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs transition-all hover:border-indigo-300 hover:bg-indigo-50"
              title={opt.description}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-zinc-600 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                <Icon name={opt.icon as any} className="h-3 w-3" />
              </div>
              <span className="text-zinc-700 group-hover:text-indigo-700">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {field.type === "text" && (
        <input
          type="text"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          value={value || ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder={field.placeholder}
        />
      )}

      {field.type === "number" && (
        <input
          type="number"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          value={value || ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          placeholder={field.placeholder}
        />
      )}

      {field.type === "textarea" && (
        <textarea
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          value={value || ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder={field.placeholder}
          rows={field.rows || 4}
        />
      )}

      {field.type === "select" && field.options && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {field.options.map((option) => (
            <OptionButton
              key={option.value}
              option={option}
              selected={value === option.value}
              onClick={() => onChange(option.value)}
            />
          ))}
        </div>
      )}

      {field.type === "multiselect" && field.options && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {field.options.map((option) => {
            const selectedValues = Array.isArray(value) ? value : [];
            const isSelected = selectedValues.includes(option.value);
            return (
              <OptionButton
                key={option.value}
                option={option}
                selected={isSelected}
                onClick={() => {
                  if (isSelected) {
                    onChange(selectedValues.filter((v) => v !== option.value));
                  } else {
                    onChange([...selectedValues, option.value]);
                  }
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

type OptionButtonProps = {
  option: WizardFieldOption;
  selected: boolean;
  onClick: () => void;
};

function OptionButton({ option, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
        selected
          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
          : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
      }`}
      title={option.description}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
          selected ? "bg-indigo-500 text-white" : "bg-zinc-100 text-zinc-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
        }`}
      >
        <Icon name={option.icon as any} className="h-5 w-5" />
      </div>
      <div>
        <div className={`text-xs font-medium ${selected ? "text-indigo-900" : "text-zinc-700"}`}>
          {option.label}
        </div>
        {option.description && (
          <div className="mt-0.5 text-[10px] text-zinc-500 line-clamp-2">{option.description}</div>
        )}
      </div>
      {selected && (
        <div className="absolute right-2 top-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
            <Icon name="check" className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </button>
  );
}
