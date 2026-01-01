"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon, type IconName } from "@/lib/ui";
import {
  GOAL_OPTIONS,
  CONFLICT_OPTIONS,
  TURN_OPTIONS,
  HOOK_OPTIONS,
  PROPERTY_PRESETS,
  BUILT_IN_PROMPTS,
  buildPropertiesPrompt,
  type PropertyOption,
  type PropertyPreset,
  type PromptLibraryItem,
} from "@/lib/propertiesPromptOptions";

// =====================================================
// TOOLTIP COMPONENT
// =====================================================
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg shadow-xl max-w-xs whitespace-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPACT ICON SELECTOR
// =====================================================
type CompactIconSelectorProps = {
  options: PropertyOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
};

function CompactIconSelector({ options, value, onChange, columns = 4 }: CompactIconSelectorProps) {
  return (
    <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <Tooltip key={option.value} text={option.promptText}>
          <button
            onClick={() => onChange(value === option.value ? "" : option.value)}
            className={`group relative flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              value === option.value
                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                : "bg-white/40 hover:bg-white/70 text-zinc-700 hover:scale-105"
            }`}
          >
            <Icon name={option.icon as IconName} className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-medium truncate w-full text-center leading-tight">{option.label}</span>
            {value === option.value && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                <Icon name="check" className="h-2 w-2 text-white" />
              </div>
            )}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

// =====================================================
// SECTION HEADER WITH COLLAPSE
// =====================================================
function SectionHeader({ 
  title, 
  icon, 
  expanded, 
  onToggle,
  hasSelection,
  selectionLabel,
}: { 
  title: string; 
  icon: IconName; 
  expanded: boolean;
  onToggle: () => void;
  hasSelection?: boolean;
  selectionLabel?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-2 rounded-xl bg-white/30 hover:bg-white/50 transition-all"
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${hasSelection ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : 'bg-white/60 text-zinc-700'}`}>
          <Icon name={icon} className="h-3.5 w-3.5" />
        </div>
        <span className="font-semibold text-sm text-zinc-900">{title}</span>
        {hasSelection && selectionLabel && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-500 text-white rounded-full truncate max-w-[80px]">
            {selectionLabel}
          </span>
        )}
      </div>
      <Icon 
        name={expanded ? "chevronUp" : "chevronDown"} 
        className="h-4 w-4 text-zinc-500 transition-transform" 
      />
    </button>
  );
}

// =====================================================
// QUICK PRESET BUTTON
// =====================================================
function QuickPresetButton({ 
  preset, 
  selected,
  onClick 
}: { 
  preset: PropertyPreset;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip text={preset.tooltip}>
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
          selected
            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
            : "bg-white/50 hover:bg-white/80 text-zinc-700 hover:scale-105"
        }`}
      >
        <Icon name={preset.icon as IconName} className="h-5 w-5 mb-1" />
        <span className="text-[10px] font-semibold text-center leading-tight">{preset.name}</span>
      </button>
    </Tooltip>
  );
}

// =====================================================
// PROMPT LIBRARY ITEM BUTTON
// =====================================================
function PromptLibraryItemButton({
  item,
  selected,
  onClick,
}: {
  item: PromptLibraryItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip text={item.promptText}>
      <button
        onClick={onClick}
        className={`flex items-center gap-2 p-2 rounded-xl transition-all w-full text-left ${
          selected
            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg"
            : "bg-white/40 hover:bg-white/70 text-zinc-700"
        }`}
      >
        <Icon name={item.icon as IconName} className="h-4 w-4 flex-shrink-0" />
        <span className="text-xs font-medium truncate">{item.label}</span>
        {selected && (
          <Icon name="check" className="h-3 w-3 ml-auto flex-shrink-0" />
        )}
      </button>
    </Tooltip>
  );
}

// =====================================================
// CUSTOM PROMPT INPUT
// =====================================================
function CustomPromptInput({
  value,
  onChange,
  onSave,
  placeholder,
  category,
}: {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder: string;
  category: string;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing && !value) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full flex items-center gap-2 p-2 rounded-xl bg-white/30 hover:bg-white/50 text-zinc-500 text-sm transition-all border-2 border-dashed border-white/40 hover:border-indigo-300"
      >
        <Icon name="plus" className="h-4 w-4" />
        <span>Add custom {category}...</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl bg-white/60 border border-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        rows={2}
        autoFocus={isEditing}
        onFocus={() => setIsEditing(true)}
      />
      <div className="flex gap-2">
        {onSave && (
          <button
            onClick={onSave}
            className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-1"
          >
            <Icon name="plus" className="h-3 w-3" />
            Save to Library
          </button>
        )}
        <button
          onClick={() => {
            onChange("");
            setIsEditing(false);
          }}
          className="px-3 py-1.5 rounded-lg bg-white/40 text-zinc-700 text-xs font-medium hover:bg-white/60 transition-all"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

// =====================================================
// MAIN PROPERTIES PROMPT BUILDER
// =====================================================
export type PropertySelections = {
  goal: string;
  goalCustom: string;
  conflict: string;
  conflictCustom: string;
  turn: string;
  turnCustom: string;
  hook: string;
  hookCustom: string;
};

type PropertiesPromptBuilderProps = {
  initialSelections?: Partial<PropertySelections>;
  onSelectionsChange?: (selections: PropertySelections) => void;
  onSave?: (selections: PropertySelections) => void;
  saving?: boolean;
};

export function PropertiesPromptBuilder({
  initialSelections,
  onSelectionsChange,
  onSave,
  saving = false,
}: PropertiesPromptBuilderProps) {
  const [selections, setSelections] = useState<PropertySelections>({
    goal: "",
    goalCustom: "",
    conflict: "",
    conflictCustom: "",
    turn: "",
    turnCustom: "",
    hook: "",
    hookCustom: "",
    ...initialSelections,
  });

  const [activePreset, setActivePreset] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["quick-presets", "goal"]));
  const [activeLibraryTab, setActiveLibraryTab] = useState<'icons' | 'library'>('icons');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'goal' | 'conflict' | 'turn' | 'hook'>('all');

  // User's custom prompts (would be stored in localStorage or API in real implementation)
  const [customPrompts, setCustomPrompts] = useState<PromptLibraryItem[]>([]);

  // Load custom prompts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tch-custom-prompts');
      if (saved) {
        setCustomPrompts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load custom prompts:', e);
    }
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onSelectionsChange) {
      onSelectionsChange(selections);
    }
  }, [selections, onSelectionsChange]);

  const updateSelection = (key: keyof PropertySelections, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }));
    setActivePreset("");
  };

  const applyPreset = (presetId: string) => {
    const preset = PROPERTY_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelections(prev => ({
        ...prev,
        goal: preset.selections.goal || "",
        conflict: preset.selections.conflict || "",
        turn: preset.selections.turn || "",
        hook: preset.selections.hook || "",
      }));
      setActivePreset(presetId);
    }
  };

  const applyLibraryItem = (item: PromptLibraryItem) => {
    const customKey = `${item.category}Custom` as keyof PropertySelections;
    setSelections(prev => ({
      ...prev,
      [item.category]: "",
      [customKey]: item.promptText,
    }));
  };

  const saveCustomPrompt = (category: 'goal' | 'conflict' | 'turn' | 'hook') => {
    const customKey = `${category}Custom` as keyof PropertySelections;
    const customValue = selections[customKey];
    
    if (!customValue.trim()) return;

    const newPrompt: PromptLibraryItem = {
      id: `custom-${Date.now()}`,
      label: customValue.slice(0, 30) + (customValue.length > 30 ? '...' : ''),
      icon: category === 'goal' ? 'target' : category === 'conflict' ? 'warning' : category === 'turn' ? 'wand' : 'star',
      promptText: customValue,
      category,
      isBuiltIn: false,
    };

    const updated = [...customPrompts, newPrompt];
    setCustomPrompts(updated);
    localStorage.setItem('tch-custom-prompts', JSON.stringify(updated));
  };

  const clearAll = () => {
    setSelections({
      goal: "",
      goalCustom: "",
      conflict: "",
      conflictCustom: "",
      turn: "",
      turnCustom: "",
      hook: "",
      hookCustom: "",
    });
    setActivePreset("");
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getSelectionLabel = (category: 'goal' | 'conflict' | 'turn' | 'hook'): string | undefined => {
    const value = selections[category];
    const customValue = selections[`${category}Custom` as keyof PropertySelections];
    
    if (customValue) return "Custom";
    if (!value) return undefined;
    
    const options = category === 'goal' ? GOAL_OPTIONS 
      : category === 'conflict' ? CONFLICT_OPTIONS 
      : category === 'turn' ? TURN_OPTIONS 
      : HOOK_OPTIONS;
    
    return options.find(o => o.value === value)?.label;
  };

  const hasAnySelection = Object.values(selections).some(v => v !== "");
  const selectionCount = [
    selections.goal || selections.goalCustom,
    selections.conflict || selections.conflictCustom,
    selections.turn || selections.turnCustom,
    selections.hook || selections.hookCustom,
  ].filter(Boolean).length;

  const generatedSummary = useMemo(() => {
    return buildPropertiesPrompt({
      goal: selections.goal,
      conflict: selections.conflict,
      turn: selections.turn,
      hook: selections.hook,
    });
  }, [selections]);

  // Filter library items
  const filteredLibraryItems = useMemo(() => {
    const allItems = [...BUILT_IN_PROMPTS, ...customPrompts];
    if (libraryFilter === 'all') return allItems;
    return allItems.filter(item => item.category === libraryFilter);
  }, [customPrompts, libraryFilter]);

  return (
    <div className="flex flex-col h-full">
      {/* Summary Header */}
      <div className="flex-shrink-0 p-3 border-b border-white/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon name="target" className="h-4 w-4 text-purple-600" />
            <span className="font-semibold text-sm text-zinc-900">Dramatic Elements</span>
            {selectionCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded-full">
                {selectionCount}/4 set
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasAnySelection && (
              <button
                onClick={clearAll}
                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-all"
                title="Clear all"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Quick status badges */}
        <div className="flex flex-wrap gap-1.5">
          {(['goal', 'conflict', 'turn', 'hook'] as const).map(cat => {
            const label = getSelectionLabel(cat);
            const customValue = selections[`${cat}Custom` as keyof PropertySelections];
            const hasValue = label || customValue;
            
            return (
              <div
                key={cat}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${
                  hasValue 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
                    : 'bg-white/40 text-zinc-500'
                }`}
              >
                <Icon 
                  name={cat === 'goal' ? 'target' : cat === 'conflict' ? 'warning' : cat === 'turn' ? 'wand' : 'star'} 
                  className="h-3 w-3" 
                />
                <span className="capitalize">{cat}:</span>
                <span className="truncate max-w-[60px]">
                  {label || (customValue ? 'Custom' : 'Not set')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Toggle: Icons vs Library */}
      <div className="flex-shrink-0 p-2 border-b border-white/20">
        <div className="flex gap-1 bg-white/30 rounded-xl p-1">
          <button
            onClick={() => setActiveLibraryTab('icons')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLibraryTab === 'icons'
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                : "text-zinc-600 hover:bg-white/50"
            }`}
          >
            <Icon name="layers" className="h-3.5 w-3.5" />
            Quick Icons
          </button>
          <button
            onClick={() => setActiveLibraryTab('library')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeLibraryTab === 'library'
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                : "text-zinc-600 hover:bg-white/50"
            }`}
          >
            <Icon name="book" className="h-3.5 w-3.5" />
            Prompt Library
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {activeLibraryTab === 'icons' ? (
          <>
            {/* Quick Presets */}
            <div className="space-y-2">
              <SectionHeader 
                title="Quick Presets" 
                icon="sparkles" 
                expanded={expandedSections.has("quick-presets")}
                onToggle={() => toggleSection("quick-presets")}
                hasSelection={!!activePreset}
                selectionLabel={PROPERTY_PRESETS.find(p => p.id === activePreset)?.name}
              />
              {expandedSections.has("quick-presets") && (
                <div className="grid grid-cols-4 gap-1.5 p-2 bg-white/20 rounded-xl">
                  {PROPERTY_PRESETS.map(preset => (
                    <QuickPresetButton
                      key={preset.id}
                      preset={preset}
                      selected={activePreset === preset.id}
                      onClick={() => applyPreset(preset.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Goal Section */}
            <div className="space-y-2">
              <SectionHeader 
                title="Dramatic Goal" 
                icon="target" 
                expanded={expandedSections.has("goal")}
                onToggle={() => toggleSection("goal")}
                hasSelection={!!(selections.goal || selections.goalCustom)}
                selectionLabel={getSelectionLabel('goal')}
              />
              {expandedSections.has("goal") && (
                <div className="space-y-2 p-2 bg-white/20 rounded-xl">
                  <CompactIconSelector
                    options={GOAL_OPTIONS}
                    value={selections.goal}
                    onChange={(v) => updateSelection("goal", v)}
                    columns={4}
                  />
                  <CustomPromptInput
                    value={selections.goalCustom}
                    onChange={(v) => updateSelection("goalCustom", v)}
                    onSave={() => saveCustomPrompt('goal')}
                    placeholder="Or write a custom goal..."
                    category="goal"
                  />
                </div>
              )}
            </div>

            {/* Conflict Section */}
            <div className="space-y-2">
              <SectionHeader 
                title="Conflict" 
                icon="warning" 
                expanded={expandedSections.has("conflict")}
                onToggle={() => toggleSection("conflict")}
                hasSelection={!!(selections.conflict || selections.conflictCustom)}
                selectionLabel={getSelectionLabel('conflict')}
              />
              {expandedSections.has("conflict") && (
                <div className="space-y-2 p-2 bg-white/20 rounded-xl">
                  <CompactIconSelector
                    options={CONFLICT_OPTIONS}
                    value={selections.conflict}
                    onChange={(v) => updateSelection("conflict", v)}
                    columns={5}
                  />
                  <CustomPromptInput
                    value={selections.conflictCustom}
                    onChange={(v) => updateSelection("conflictCustom", v)}
                    onSave={() => saveCustomPrompt('conflict')}
                    placeholder="Or write a custom conflict..."
                    category="conflict"
                  />
                </div>
              )}
            </div>

            {/* Turn Section */}
            <div className="space-y-2">
              <SectionHeader 
                title="Turn / Twist" 
                icon="wand" 
                expanded={expandedSections.has("turn")}
                onToggle={() => toggleSection("turn")}
                hasSelection={!!(selections.turn || selections.turnCustom)}
                selectionLabel={getSelectionLabel('turn')}
              />
              {expandedSections.has("turn") && (
                <div className="space-y-2 p-2 bg-white/20 rounded-xl">
                  <CompactIconSelector
                    options={TURN_OPTIONS}
                    value={selections.turn}
                    onChange={(v) => updateSelection("turn", v)}
                    columns={4}
                  />
                  <CustomPromptInput
                    value={selections.turnCustom}
                    onChange={(v) => updateSelection("turnCustom", v)}
                    onSave={() => saveCustomPrompt('turn')}
                    placeholder="Or write a custom turn..."
                    category="turn"
                  />
                </div>
              )}
            </div>

            {/* Hook Section */}
            <div className="space-y-2">
              <SectionHeader 
                title="Hook" 
                icon="star" 
                expanded={expandedSections.has("hook")}
                onToggle={() => toggleSection("hook")}
                hasSelection={!!(selections.hook || selections.hookCustom)}
                selectionLabel={getSelectionLabel('hook')}
              />
              {expandedSections.has("hook") && (
                <div className="space-y-2 p-2 bg-white/20 rounded-xl">
                  <CompactIconSelector
                    options={HOOK_OPTIONS}
                    value={selections.hook}
                    onChange={(v) => updateSelection("hook", v)}
                    columns={5}
                  />
                  <CustomPromptInput
                    value={selections.hookCustom}
                    onChange={(v) => updateSelection("hookCustom", v)}
                    onSave={() => saveCustomPrompt('hook')}
                    placeholder="Or write a custom hook..."
                    category="hook"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Library Tab */
          <div className="space-y-3">
            {/* Category Filter */}
            <div className="flex gap-1 flex-wrap">
              {(['all', 'goal', 'conflict', 'turn', 'hook'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setLibraryFilter(cat)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    libraryFilter === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/40 text-zinc-600 hover:bg-white/60'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Library Items */}
            <div className="space-y-1.5">
              {filteredLibraryItems.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No prompts in library yet
                </div>
              ) : (
                filteredLibraryItems.map(item => (
                  <PromptLibraryItemButton
                    key={item.id}
                    item={item}
                    selected={
                      selections[`${item.category}Custom` as keyof PropertySelections] === item.promptText
                    }
                    onClick={() => applyLibraryItem(item)}
                  />
                ))
              )}
            </div>

            {/* Custom prompts section */}
            {customPrompts.length > 0 && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="users" className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-zinc-700">Your Custom Prompts</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-200 text-purple-700 rounded-full">
                    {customPrompts.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {customPrompts
                    .filter(item => libraryFilter === 'all' || item.category === libraryFilter)
                    .map(item => (
                      <PromptLibraryItemButton
                        key={item.id}
                        item={item}
                        selected={
                          selections[`${item.category}Custom` as keyof PropertySelections] === item.promptText
                        }
                        onClick={() => applyLibraryItem(item)}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      {onSave && (
        <div className="flex-shrink-0 p-3 border-t border-white/20">
          <button
            onClick={() => onSave(selections)}
            disabled={saving || !hasAnySelection}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? (
              <>
                <Icon name="clock" className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="check" className="h-4 w-4" />
                Apply Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default PropertiesPromptBuilder;
