"use client";

import { useState } from "react";
import { Icon } from "@/lib/ui";
import type { PresetOption } from "@/lib/characterPresets";

type PresetIconSelectorProps = {
  options: PresetOption[];
  value?: string;
  onChange: (value: string, option: PresetOption) => void;
  label: string;
  description?: string;
  showAll?: boolean;
  columns?: 3 | 4 | 5 | 6;
  size?: "sm" | "md" | "lg";
  multiSelect?: boolean;
  selectedValues?: string[];
  onMultiChange?: (values: string[]) => void;
};

export function PresetIconSelector({
  options,
  value,
  onChange,
  label,
  description,
  showAll = false,
  columns = 4,
  size = "md",
  multiSelect = false,
  selectedValues = [],
  onMultiChange,
}: PresetIconSelectorProps) {
  const [expanded, setExpanded] = useState(false);

  const displayOptions = showAll || expanded ? options : options.slice(0, columns * 2);
  const hasMore = !showAll && options.length > columns * 2;

  const handleSelect = (option: PresetOption) => {
    if (multiSelect && onMultiChange) {
      const newValues = selectedValues.includes(option.value)
        ? selectedValues.filter((v) => v !== option.value)
        : [...selectedValues, option.value];
      onMultiChange(newValues);
    } else {
      onChange(option.value, option);
    }
  };

  const isSelected = (optValue: string) => {
    if (multiSelect) {
      return selectedValues.includes(optValue);
    }
    return value === optValue;
  };

  const sizeClasses = {
    sm: {
      container: "p-1.5",
      icon: "h-3.5 w-3.5",
      text: "text-[9px]",
      gap: "gap-0.5",
    },
    md: {
      container: "p-2",
      icon: "h-4 w-4",
      text: "text-[10px]",
      gap: "gap-1",
    },
    lg: {
      container: "p-3",
      icon: "h-5 w-5",
      text: "text-xs",
      gap: "gap-1.5",
    },
  };

  const gridClasses = {
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-zinc-700">{label}</div>
          {description && <div className="text-[10px] text-zinc-500">{description}</div>}
        </div>
        {value && !multiSelect && (
          <button
            type="button"
            onClick={() => onChange("", options[0])}
            className="text-[10px] text-zinc-400 hover:text-zinc-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Options Grid */}
      <div className={`grid ${gridClasses[columns]} gap-1.5`}>
        {displayOptions.map((option) => {
          const selected = isSelected(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className={`group relative flex flex-col items-center ${sizeClasses[size].gap} ${sizeClasses[size].container} rounded-xl border transition-all ${
                selected
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50/50"
              }`}
              title={option.description}
            >
              <Icon
                name={option.icon as any}
                className={`${sizeClasses[size].icon} ${
                  selected ? "text-indigo-600" : "text-zinc-400 group-hover:text-indigo-500"
                }`}
              />
              <span className={`${sizeClasses[size].text} font-medium text-center leading-tight`}>
                {option.label}
              </span>

              {/* Selected indicator */}
              {selected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <Icon name="check" className="h-2.5 w-2.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 text-[10px] font-medium hover:bg-zinc-200 transition-all"
        >
          <Icon name={expanded ? "chevronUp" : "chevronDown"} className="h-3 w-3" />
          {expanded ? "Show Less" : `Show ${options.length - columns * 2} More`}
        </button>
      )}
    </div>
  );
}

export function CompactPresetSelector({
  options,
  value,
  onChange,
  placeholder = "Select...",
}: {
  options: PresetOption[];
  value?: string;
  onChange: (value: string, option: PresetOption) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
          selectedOption
            ? "border-indigo-300 bg-indigo-50 text-indigo-900"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
        }`}
      >
        {selectedOption ? (
          <>
            <Icon name={selectedOption.icon as any} className="h-4 w-4 text-indigo-600" />
            <span className="flex-1 text-left font-medium">{selectedOption.label}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-zinc-400">{placeholder}</span>
        )}
        <Icon name="chevronDown" className="h-4 w-4 text-zinc-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-zinc-200 shadow-xl max-h-64 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value, option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all ${
                  value === option.value
                    ? "bg-indigo-50 text-indigo-900"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <Icon name={option.icon as any} className="h-4 w-4" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-[10px] text-zinc-500">{option.description}</div>
                </div>
                {value === option.value && (
                  <Icon name="check" className="h-4 w-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function InlinePresetChips({
  options,
  selectedValues,
  onChange,
  maxShow = 6,
}: {
  options: PresetOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  maxShow?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayOptions = showAll ? options : options.slice(0, maxShow);

  const toggleValue = (value: string) => {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value]
    );
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayOptions.map((option) => {
        const selected = selectedValues.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleValue(option.value)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
              selected
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <Icon name={option.icon as any} className="h-3 w-3" />
            {option.label}
          </button>
        );
      })}
      {!showAll && options.length > maxShow && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-medium hover:bg-zinc-300"
        >
          +{options.length - maxShow} more
        </button>
      )}
    </div>
  );
}
