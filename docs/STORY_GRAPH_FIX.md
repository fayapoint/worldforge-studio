# Story Graph - Complete Fix Guide

## 🎯 Problem

The current Story Graph (`/app/projects/[projectId]/story/page.tsx`) has:
- ❌ Multiple dropdowns (node type, edge from/to, edge type)
- ❌ Text inputs for all scene properties (Goals, Conflict, Turn, Hooks)
- ❌ No AI agent integration
- ❌ Graph visualization issues
- ❌ No icon-based editing

## ✅ Solution

Replace the entire Story Graph page with the new icon-based version at `/story-new/page.tsx`.

## 📋 Step-by-Step Fix

### 1. Delete Old File
```bash
rm c:\WORKS\tch\web\src\app\app\projects\[projectId]\story\page.tsx
```

### 2. Copy New File
```bash
cp c:\WORKS\tch\web\src\app\app\projects\[projectId]\story-new\page.tsx c:\WORKS\tch\web\src\app\app\projects\[projectId]\story\page.tsx
```

### 3. What You Get

**NEW Story Graph Features:**

✅ **NO DROPDOWNS** - Everything is icon-based:
- Node type selection: BEAT/SCENE/CHAPTER icons
- Mood: 8 icon options (Tense, Mysterious, Dramatic, etc.)
- Pacing: 4 icon options (Slow, Medium, Fast, Varied)
- Focus: 6 icon options (Character, Plot, World, etc.)
- Dramatic Goal: 8 icon options (Escape, Discover, Confront, etc.)
- Conflict: 6 icon options (Internal, Interpersonal, External, etc.)
- Turn/Twist: 7 icon options (Reversal, Revelation, Escalation, etc.)
- Characters: Visual selection with thumbnails
- Locations: Icon-based selection

✅ **Proper Graph Visualization:**
- ReactFlow with visible nodes and edges
- Beautiful glassmorphism node cards
- Colored edges by type
- Draggable, zoomable
- MiniMap and Controls

✅ **AI Agent Integration:**
- Click "Create Node" button
- Select all options with icons
- Click "Generate with AI"
- AI creates complete scene/chapter
- All icon selections translate to AI prompts

✅ **Icon-to-Prompt Translation:**
Every icon selection has a `promptHint` that feeds into AI generation:
```typescript
mood: "tense" → "tense atmosphere, suspenseful, high stakes"
pacing: "fast" → "fast pacing, quick succession, urgent"
focus: "conflict" → "focus on conflict, tension, opposition"
```

## 🎨 Inspector Panel (Right Side)

The new version includes an icon-based Inspector panel for editing selected nodes:

```typescript
// When a node is selected, show:
<GlassCard className="p-6">
  <h3>Edit Scene</h3>
  
  {/* Title */}
  <GlassInput value={title} onChange={setTitle} />
  
  {/* Mood Icons */}
  <div className="grid grid-cols-4 gap-2">
    {MOOD_OPTIONS.map(option => (
      <IconOption
        icon={<Icon name={option.icon} />}
        label={option.label}
        selected={mood === option.value}
        onClick={() => setMood(option.value)}
      />
    ))}
  </div>
  
  {/* Pacing Icons */}
  {/* Focus Icons */}
  {/* Goal Icons */}
  {/* Conflict Icons */}
  {/* Turn Icons */}
  
  {/* AI Generate Button */}
  <GlassButton onClick={handleAIGenerate}>
    <Icon name="sparkles" />
    Generate with AI
  </GlassButton>
</GlassCard>
```

## 🔧 Files Involved

### Core Files:
1. **`src/lib/storyGraphIcons.ts`** ✅ Created
   - All icon configurations
   - Prompt hint translations
   - `buildPromptFromSelections()` function

2. **`src/app/api/projects/[projectId]/storyNodes/[nodeId]/generate/route.ts`** ✅ Created
   - AI generation endpoint
   - Takes icon selections
   - Returns generated content

3. **`src/app/app/projects/[projectId]/story-new/page.tsx`** ✅ Created
   - Complete new Story Graph
   - NO dropdowns
   - Icon-based everything
   - AI integration

4. **`src/components/GlassCard.tsx`** ✅ Created
   - Glassmorphism UI components
   - IconOption component
   - GlassButton, GlassInput, etc.

### To Replace:
- **`src/app/app/projects/[projectId]/story/page.tsx`** ❌ Old version with dropdowns

## 🚀 Quick Fix Command

Run this in your terminal:

```bash
cd c:\WORKS\tch\web\src\app\app\projects\[projectId]
rm story\page.tsx
cp story-new\page.tsx story\page.tsx
```

Or manually:
1. Delete `story/page.tsx`
2. Copy contents from `story-new/page.tsx`
3. Paste into `story/page.tsx`

## 📊 Comparison

### OLD Story Graph (Current)
```typescript
// Node Type - DROPDOWN ❌
<select value={newType} onChange={...}>
  <option value="BEAT">BEAT</option>
  <option value="SCENE">SCENE</option>
  <option value="CHAPTER">CHAPTER</option>
</select>

// Edge From - DROPDOWN ❌
<select value={edgeFrom} onChange={...}>
  <option value="">from…</option>
  {nodes.map(n => <option value={n._id}>{n.title}</option>)}
</select>

// No AI Agent ❌
// Text inputs for everything ❌
```

### NEW Story Graph (Fixed)
```typescript
// Node Type - ICONS ✅
<div className="grid grid-cols-3 gap-3">
  {NODE_TYPE_OPTIONS.map(option => (
    <IconOption
      icon={<Icon name={option.icon} />}
      label={option.label}
      selected={newNodeType === option.value}
      onClick={() => setNewNodeType(option.value)}
    />
  ))}
</div>

// Mood - ICONS ✅
<div className="grid grid-cols-4 gap-2">
  {MOOD_OPTIONS.map(option => (
    <IconOption
      icon={<Icon name={option.icon} />}
      label={option.label}
      description={option.description}
      selected={selectedMood === option.value}
      onClick={() => setSelectedMood(option.value)}
    />
  ))}
</div>

// AI Agent Integration ✅
<GlassButton onClick={handleGenerateNode}>
  <Icon name="sparkles" />
  Generate with AI
</GlassButton>
```

## ✨ Result

After the fix:
- ✅ NO dropdowns anywhere
- ✅ Everything is icon-based
- ✅ Beautiful glassmorphism UI
- ✅ Graph is clearly visible
- ✅ AI agent generates scenes/chapters
- ✅ Icon selections translate to AI prompts
- ✅ Professional, visual, easy to use

## 🎯 User Workflow

1. Click "Create Node"
2. Select node type with icons (Beat/Scene/Chapter)
3. Enter title and order
4. Select mood icon (Tense, Mysterious, etc.)
5. Select pacing icon (Slow, Fast, etc.)
6. Select focus icon (Character, Plot, etc.)
7. Select dramatic goal icon (Escape, Discover, etc.)
8. Select conflict icon (Internal, External, etc.)
9. Select turn icon (Reversal, Revelation, etc.)
10. Select characters (with thumbnails)
11. Select locations
12. Click "Generate with AI"
13. AI creates complete scene/chapter
14. Node appears in graph with all details

**Total dropdowns: 0**
**Total icon selections: 30+**
**AI integration: Full**

---

**Status**: New version ready at `/story-new/page.tsx`
**Action needed**: Replace old file with new file
**Time to fix**: 1 minute (copy/paste)
