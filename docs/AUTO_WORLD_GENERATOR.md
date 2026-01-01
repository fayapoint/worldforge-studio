# Auto-World Generator System

## 🎯 Vision

Each user gets their own **auto-generated personalized world** based on "They Can Hear" canonical universe.

## ✨ Key Features

### 1. One-Click or Customize
- **Instant Generation**: Random story segment + auto-mixed entities
- **Custom Generation**: Choose segment, preferences, then generate

### 2. Story Segments (~1 minute each)
- **The Awakening**: First whispers, reality cracks
- **Hidden Truths**: Secrets surface, discoveries made
- **Face to Face**: Confrontation moment
- **The Truth Revealed**: Everything clicks

### 3. Entity Mixing
- Pulls from **canonical TCH entities** (admin-only project)
- Incorporates **user's existing entities**
- **Generates new entities** as needed
- Creates **cohesive story** that makes sense

### 4. Beautiful Glassmorphism UI
- No ugly dropdowns
- Icon-based selection
- Frosted glass aesthetic
- Smooth animations
- Gradient accents

## 📦 Components Built

### WorldGenerator Component
**File**: `src/components/WorldGenerator.tsx`

**Features**:
- Choice screen (instant vs custom)
- Story segment selection with icons
- Beautiful glassmorphism cards
- Smooth transitions
- Loading states

### GlassCard Component Library
**File**: `src/components/GlassCard.tsx`

**Exports**:
- `GlassCard` - Base frosted glass container
- `GlassButton` - Primary/secondary/ghost buttons
- `IconOption` - Icon-based selection cards
- `GlassInput` - Text/textarea inputs
- `GlassSlider` - Range sliders with labels

### World Generation API
**File**: `src/app/api/worlds/generate/route.ts`

**Process**:
1. Loads canonical TCH entities
2. Loads user's existing entities
3. Selects story segment (random or chosen)
4. Calls Claude 3.5 Sonnet with comprehensive prompt
5. AI generates:
   - Story title & synopsis
   - Full ~1-minute narrative
   - Entity usage plan
   - New entities to create
   - Key story moments
6. Creates new entities in database
7. Updates project with generated story

## 🎨 UI Design System

### Colors
- **Primary**: Indigo 600 → Purple 600 gradient
- **Secondary**: Purple 500 → Pink 600 gradient
- **Background**: Indigo 50 → Purple 50 → Pink 50 gradient
- **Glass**: White/40 with backdrop blur

### Components Style
```css
/* Glass Card */
bg-white/40 backdrop-blur-xl border-white/20 shadow-lg

/* Selected State */
ring-2 ring-indigo-500 bg-white/80

/* Hover State */
hover:scale-105 hover:bg-white/60 hover:shadow-xl

/* Primary Button */
bg-gradient-to-r from-indigo-600 to-purple-600
```

## 🔧 Integration Points

### New Project Flow
```
1. User creates project
   ↓
2. Redirect to WorldGenerator
   ↓
3. User chooses: Instant or Customize
   ↓
4. If Instant: Random segment, auto-generate
   If Customize: Select segment, then generate
   ↓
5. AI generates complete world
   ↓
6. Entities created, story saved
   ↓
7. Redirect to World page (now with glassmorphism)
```

### Admin Protection
- Canonical TCH project ID stored in config
- Only admin users can edit canonical project
- All other users get their own generated worlds
- Canonical entities are read-only for users

## 📋 Next Steps

### High Priority
1. **Integrate WorldGenerator into project creation flow**
   - Update projects page to show "Generate My World" button
   - Replace old seed button

2. **Update World page with glassmorphism**
   - Replace all dropdowns with IconOption components
   - Use GlassCard for all containers
   - Beautiful entity grid with icons

3. **Implement admin protection**
   - Add isCanonical flag to projects
   - Check user roles before allowing edits
   - Show read-only view for non-admins on canonical

### Medium Priority
4. **Create canonical TCH seeding script**
   - Import all Book 1 entities
   - Set up story segments
   - Mark as canonical/admin-only

5. **Polish existing pages**
   - Replace all remaining dropdowns
   - Apply glassmorphism throughout
   - Consistent icon usage

## 🎯 User Experience

### For Regular Users
1. Create project → See beautiful "Generate My World" screen
2. Choose instant (one click) or customize (pick segment)
3. AI generates complete world in seconds
4. Get fully functional story with characters, locations, narrative
5. Can edit/customize their generated world
6. Each world is unique and personal

### For Admin (You)
1. Access canonical TCH project
2. Edit/update canonical entities
3. These become the source for all user worlds
4. Control the master story universe

## 💡 Technical Highlights

- **Smart Entity Mixing**: AI intelligently combines canonical + user entities
- **Coherent Stories**: Each segment is self-contained but fits TCH universe
- **Flexible Generation**: Works with 0 entities or many existing ones
- **Beautiful UI**: Modern glassmorphism, no ugly dropdowns
- **One-Click Magic**: Users can get complete world instantly
- **Customization**: Or they can fine-tune before generation

## 🚀 Ready For

✅ WorldGenerator component complete
✅ GlassCard library complete  
✅ World generation API complete
✅ Beautiful UI design system established

**Next**: Integrate into project flow and update World page styling
