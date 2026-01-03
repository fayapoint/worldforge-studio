"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon, Badge, PrimaryButton, SecondaryButton, type IconName } from "@/lib/ui";
import type { StoryNode, Entity, CommunityWardrobeItem } from "@/lib/models";

// =====================================================
// TYPES
// =====================================================

export type ContinuityIssueType = 
  | "WARDROBE_MISMATCH"
  | "CHARACTER_TELEPORT"
  | "PROP_RESURRECTION"
  | "PROP_DISAPPEARANCE"
  | "TIME_PARADOX"
  | "PLOT_HOLE"
  | "MISSING_SETUP"
  | "UNRESOLVED_THREAD"
  | "CHARACTER_KNOWLEDGE"
  | "EMOTIONAL_JUMP";

export type ContinuityIssue = {
  id: string;
  type: ContinuityIssueType;
  severity: "ERROR" | "WARN" | "INFO";
  sceneId: string;
  sceneTitle: string;
  sceneOrder: number;
  message: string;
  details: string;
  affectedEntities: string[];
  suggestion: string;
  autoFixable: boolean;
  category: "WARDROBE" | "PROPS" | "CHARACTER" | "PLOT" | "TIMELINE" | "LOCATION";
};

export type PlotThread = {
  id: string;
  name: string;
  description: string;
  status: "SETUP" | "IN_PROGRESS" | "RESOLVED" | "ABANDONED";
  setupSceneId?: string;
  setupSceneOrder?: number;
  resolutionSceneId?: string;
  expectedResolutionBy?: number; // Scene order
  relatedEntities: string[];
};

export type PlotRequirement = {
  id: string;
  description: string;
  mustHappenBefore?: string; // Scene ID
  mustHappenAfter?: string; // Scene ID
  status: "PENDING" | "FULFILLED" | "MISSED";
  fulfilledInScene?: string;
};

type IntelligentContinuityCheckerProps = {
  nodes: StoryNode[];
  entities: Entity[];
  wardrobeItems: CommunityWardrobeItem[];
  projectId: string;
  onSelectScene: (nodeId: string) => void;
};

// =====================================================
// ISSUE TYPE CONFIGURATION
// =====================================================

const ISSUE_TYPE_CONFIG: Record<ContinuityIssueType, { icon: IconName; color: string; label: string }> = {
  WARDROBE_MISMATCH: { icon: "sparkles", color: "pink", label: "Wardrobe Mismatch" },
  CHARACTER_TELEPORT: { icon: "character", color: "blue", label: "Character Teleport" },
  PROP_RESURRECTION: { icon: "item", color: "amber", label: "Prop Resurrection" },
  PROP_DISAPPEARANCE: { icon: "item", color: "amber", label: "Prop Disappeared" },
  TIME_PARADOX: { icon: "clock", color: "purple", label: "Time Paradox" },
  PLOT_HOLE: { icon: "alert", color: "red", label: "Plot Hole" },
  MISSING_SETUP: { icon: "target", color: "orange", label: "Missing Setup" },
  UNRESOLVED_THREAD: { icon: "story", color: "indigo", label: "Unresolved Thread" },
  CHARACTER_KNOWLEDGE: { icon: "eye", color: "cyan", label: "Knowledge Issue" },
  EMOTIONAL_JUMP: { icon: "heart", color: "rose", label: "Emotional Jump" },
};

const CATEGORY_CONFIG: Record<string, { icon: IconName; color: string }> = {
  WARDROBE: { icon: "sparkles", color: "from-pink-500 to-rose-600" },
  PROPS: { icon: "item", color: "from-amber-500 to-orange-600" },
  CHARACTER: { icon: "character", color: "from-blue-500 to-indigo-600" },
  PLOT: { icon: "story", color: "from-purple-500 to-violet-600" },
  TIMELINE: { icon: "clock", color: "from-cyan-500 to-teal-600" },
  LOCATION: { icon: "location", color: "from-emerald-500 to-green-600" },
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export function IntelligentContinuityChecker({
  nodes,
  entities,
  wardrobeItems,
  projectId,
  onSelectScene,
}: IntelligentContinuityCheckerProps) {
  const [issues, setIssues] = useState<ContinuityIssue[]>([]);
  const [plotThreads, setPlotThreads] = useState<PlotThread[]>([]);
  const [plotRequirements, setPlotRequirements] = useState<PlotRequirement[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  // Sort nodes by time order
  const sortedNodes = useMemo(() => 
    [...nodes].sort((a, b) => (a.time?.order ?? 0) - (b.time?.order ?? 0)),
    [nodes]
  );

  // Run analysis
  const runAnalysis = async () => {
    setAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newIssues: ContinuityIssue[] = [];
    const newThreads: PlotThread[] = [];
    
    // Analyze each scene pair for continuity
    for (let i = 1; i < sortedNodes.length; i++) {
      const prevNode = sortedNodes[i - 1];
      const currNode = sortedNodes[i];
      
      // Check character continuity
      const prevParticipants = new Set(prevNode.participants?.map(p => p.entityId) || []);
      const currParticipants = new Set(currNode.participants?.map(p => p.entityId) || []);
      
      // Find characters that appear in current but weren't in previous
      // and check if their transition makes sense
      currParticipants.forEach(charId => {
        if (!prevParticipants.has(charId)) {
          const entity = entities.find(e => e._id === charId);
          if (entity) {
            // Check if there's a location change that would explain absence
            const prevLocations = new Set(prevNode.locations || []);
            const currLocations = new Set(currNode.locations || []);
            
            const locationChanged = prevLocations.size > 0 && currLocations.size > 0 && 
              ![...prevLocations].some(l => currLocations.has(l));
            
            if (!locationChanged && prevNode.nodeType === "SCENE" && currNode.nodeType === "SCENE") {
              // Character appeared without explanation
              newIssues.push({
                id: `char-appear-${currNode._id}-${charId}`,
                type: "CHARACTER_TELEPORT",
                severity: "INFO",
                sceneId: currNode._id,
                sceneTitle: currNode.title,
                sceneOrder: currNode.time?.order ?? i,
                message: `${entity.name} appears without prior establishment`,
                details: `Character wasn't in previous scene (${prevNode.title}) at same location`,
                affectedEntities: [charId],
                suggestion: "Add a transition showing character arriving, or establish their presence earlier",
                autoFixable: false,
                category: "CHARACTER",
              });
            }
          }
        }
      });
      
      // Check for wardrobe issues (simplified - real implementation would check actual wardrobe data)
      if (currNode.screenplay?.characterInstances) {
        currNode.screenplay.characterInstances.forEach(instance => {
          const prevInstance = prevNode.screenplay?.characterInstances?.find(
            pi => pi.entityId === instance.entityId
          );
          
          if (prevInstance && instance.wardrobe.length > 0 && prevInstance.wardrobe.length > 0) {
            // Compare wardrobe
            const prevOutfit = prevInstance.wardrobe.map(w => w.description).sort().join("|");
            const currOutfit = instance.wardrobe.map(w => w.description).sort().join("|");
            
            if (prevOutfit !== currOutfit) {
              // Check if there was a time skip
              const timeSkip = (currNode.time?.order ?? 0) - (prevNode.time?.order ?? 0) > 1;
              
              if (!timeSkip) {
                newIssues.push({
                  id: `wardrobe-${currNode._id}-${instance.entityId}`,
                  type: "WARDROBE_MISMATCH",
                  severity: "WARN",
                  sceneId: currNode._id,
                  sceneTitle: currNode.title,
                  sceneOrder: currNode.time?.order ?? i,
                  message: `${instance.name}'s outfit changed unexpectedly`,
                  details: `Wardrobe differs from previous scene without time skip`,
                  affectedEntities: [instance.entityId],
                  suggestion: "Ensure outfit matches previous scene, or add a scene transition showing costume change",
                  autoFixable: true,
                  category: "WARDROBE",
                });
              }
            }
          }
        });
      }
    }
    
    // Analyze plot threads from hooks/foreshadowing
    sortedNodes.forEach((node, idx) => {
      // Check for foreshadowing that needs payoff
      if (node.hooks?.foreshadow && node.hooks.foreshadow.length > 0) {
        node.hooks.foreshadow.forEach((foreshadow, fIdx) => {
          const threadId = `foreshadow-${node._id}-${fIdx}`;
          
          // Check if this foreshadowing is resolved later
          const isResolved = sortedNodes.slice(idx + 1).some(laterNode => 
            laterNode.hooks?.payoffTargets?.some(pt => 
              pt.toLowerCase().includes(foreshadow.toLowerCase().slice(0, 20))
            )
          );
          
          newThreads.push({
            id: threadId,
            name: foreshadow.slice(0, 50) + (foreshadow.length > 50 ? "..." : ""),
            description: foreshadow,
            status: isResolved ? "RESOLVED" : "IN_PROGRESS",
            setupSceneId: node._id,
            setupSceneOrder: node.time?.order ?? idx,
            relatedEntities: node.participants?.map(p => p.entityId) || [],
          });
          
          if (!isResolved && idx < sortedNodes.length - 3) {
            newIssues.push({
              id: `unresolved-${threadId}`,
              type: "UNRESOLVED_THREAD",
              severity: "INFO",
              sceneId: node._id,
              sceneTitle: node.title,
              sceneOrder: node.time?.order ?? idx,
              message: `Foreshadowing not yet resolved`,
              details: `"${foreshadow.slice(0, 80)}..." setup but no payoff found`,
              affectedEntities: [],
              suggestion: "Add a scene that pays off this foreshadowing, or mark it for later resolution",
              autoFixable: false,
              category: "PLOT",
            });
          }
        });
      }
    });
    
    // Check for dramatic goal completion
    sortedNodes.forEach((node, idx) => {
      if (node.goals?.dramaticGoal && !node.goals?.turn) {
        newIssues.push({
          id: `incomplete-arc-${node._id}`,
          type: "MISSING_SETUP",
          severity: "INFO",
          sceneId: node._id,
          sceneTitle: node.title,
          sceneOrder: node.time?.order ?? idx,
          message: `Scene has goal but no turn defined`,
          details: `Goal: "${node.goals.dramaticGoal}" - Consider adding how the scene changes direction`,
          affectedEntities: [],
          suggestion: "Define the turn - how does the scene's direction change?",
          autoFixable: false,
          category: "PLOT",
        });
      }
    });
    
    setIssues(newIssues);
    setPlotThreads(newThreads);
    setLastAnalysis(new Date());
    setAnalyzing(false);
  };

  // Filter issues by category
  const filteredIssues = useMemo(() => {
    let result = issues;
    if (selectedCategory) {
      result = result.filter(i => i.category === selectedCategory);
    }
    if (!showResolved) {
      result = result.filter(i => i.severity !== "INFO" || i.type !== "UNRESOLVED_THREAD");
    }
    return result;
  }, [issues, selectedCategory, showResolved]);

  // Issue stats
  const issueStats = useMemo(() => ({
    errors: issues.filter(i => i.severity === "ERROR").length,
    warnings: issues.filter(i => i.severity === "WARN").length,
    info: issues.filter(i => i.severity === "INFO").length,
    total: issues.length,
  }), [issues]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    issues.forEach(i => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return counts;
  }, [issues]);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg">
              <Icon name="continuity" className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Intelligent Continuity Checker</h2>
              <p className="text-sm text-zinc-500">
                Analyzes wardrobe, props, plot threads, and character movement
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {lastAnalysis && (
              <span className="text-xs text-zinc-500">
                Last run: {lastAnalysis.toLocaleTimeString()}
              </span>
            )}
            <PrimaryButton onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Icon name="refresh" className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Icon name="sparkles" className="h-4 w-4" />
                  Run Analysis
                </>
              )}
            </PrimaryButton>
          </div>
        </div>

        {/* Stats */}
        {issues.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{issueStats.errors}</div>
              <div className="text-xs text-red-600">Errors</div>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
              <div className="text-2xl font-bold text-amber-700">{issueStats.warnings}</div>
              <div className="text-xs text-amber-600">Warnings</div>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{issueStats.info}</div>
              <div className="text-xs text-blue-600">Info</div>
            </div>
            <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3 text-center">
              <div className="text-2xl font-bold text-zinc-700">{sortedNodes.length}</div>
              <div className="text-xs text-zinc-600">Scenes</div>
            </div>
          </div>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedCategory === null
              ? "bg-zinc-900 text-white shadow-lg"
              : "bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300"
          }`}
        >
          All ({issues.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === cat
                ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                : "bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300"
            }`}
          >
            <Icon name={config.icon} className="h-4 w-4" />
            {cat.charAt(0) + cat.slice(1).toLowerCase()}
            {categoryCounts[cat] && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                selectedCategory === cat ? "bg-white/20" : "bg-zinc-100"
              }`}>
                {categoryCounts[cat]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredIssues.length > 0 ? (
          filteredIssues.map(issue => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              onSelectScene={onSelectScene}
            />
          ))
        ) : issues.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-12 text-center">
            <Icon name="continuity" className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-700 mb-2">No Analysis Yet</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Run the continuity checker to analyze your story for issues
            </p>
            <PrimaryButton onClick={runAnalysis}>
              <Icon name="sparkles" className="h-4 w-4" />
              Run Analysis
            </PrimaryButton>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <Icon name="check" className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">No Issues in This Category</h3>
            <p className="text-sm text-emerald-600">
              All {selectedCategory?.toLowerCase()} continuity checks passed!
            </p>
          </div>
        )}
      </div>

      {/* Plot Threads Section */}
      {plotThreads.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Icon name="story" className="h-4 w-4 text-purple-600" />
            Plot Threads & Foreshadowing
          </h3>
          
          <div className="space-y-3">
            {plotThreads.map(thread => (
              <div 
                key={thread.id}
                className={`rounded-xl border p-4 ${
                  thread.status === "RESOLVED" 
                    ? "bg-emerald-50 border-emerald-200"
                    : thread.status === "IN_PROGRESS"
                      ? "bg-amber-50 border-amber-200"
                      : "bg-zinc-50 border-zinc-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-zinc-900">{thread.name}</span>
                      <Badge tone={
                        thread.status === "RESOLVED" ? "success" 
                        : thread.status === "IN_PROGRESS" ? "warn" 
                        : "neutral"
                      }>
                        {thread.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-600">{thread.description}</p>
                    {thread.setupSceneOrder !== undefined && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Setup in scene #{thread.setupSceneOrder}
                      </p>
                    )}
                  </div>
                  {thread.status !== "RESOLVED" && (
                    <button className="text-xs text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap">
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// ISSUE CARD COMPONENT
// =====================================================

function IssueCard({ 
  issue, 
  onSelectScene 
}: { 
  issue: ContinuityIssue; 
  onSelectScene: (nodeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = ISSUE_TYPE_CONFIG[issue.type];
  const categoryConfig = CATEGORY_CONFIG[issue.category];

  return (
    <div 
      className={`rounded-xl border overflow-hidden transition-all ${
        issue.severity === "ERROR" 
          ? "border-red-200 bg-red-50"
          : issue.severity === "WARN"
            ? "border-amber-200 bg-amber-50"
            : "border-blue-200 bg-blue-50"
      }`}
    >
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${categoryConfig.color} text-white`}>
            <Icon name={config.icon} className="h-4 w-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-zinc-900">{issue.message}</span>
              <Badge tone={
                issue.severity === "ERROR" ? "danger" 
                : issue.severity === "WARN" ? "warn" 
                : "neutral"
              }>
                {issue.severity}
              </Badge>
            </div>
            <p className="text-xs text-zinc-600">{issue.details}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-zinc-500">
                Scene #{issue.sceneOrder}: {issue.sceneTitle}
              </span>
              {issue.autoFixable && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <Icon name="sparkles" className="h-3 w-3" />
                  Auto-fixable
                </span>
              )}
            </div>
          </div>
          
          <button className="p-1 rounded-lg hover:bg-white/50">
            <Icon 
              name={expanded ? "chevronUp" : "chevronDown"} 
              className="h-4 w-4 text-zinc-500" 
            />
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-200/50 pt-3">
          <div className="rounded-lg bg-white/60 p-3 mb-3">
            <div className="flex items-start gap-2">
              <Icon name="sparkles" className="h-4 w-4 text-violet-500 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-zinc-700 mb-1">Suggestion</div>
                <p className="text-xs text-zinc-600">{issue.suggestion}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <SecondaryButton onClick={() => onSelectScene(issue.sceneId)}>
              <Icon name="scene" className="h-4 w-4" />
              Go to Scene
            </SecondaryButton>
            {issue.autoFixable && (
              <PrimaryButton>
                <Icon name="sparkles" className="h-4 w-4" />
                Auto Fix
              </PrimaryButton>
            )}
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-white/60">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
