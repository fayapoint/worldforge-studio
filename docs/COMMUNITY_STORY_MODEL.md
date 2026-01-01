# Community Story Platform - Data Model

## Vision
A collaborative storytelling platform where users contribute chapters to "They Can Hear" - an ever-growing, community-driven narrative universe with a locked canonical baseline.

## Core Concepts

### 1. Canonical Baseline
- **Locked Story Foundation**: Official "They Can Hear" characters, locations, and world rules
- **Immutable Core**: Canonical entities cannot be modified by users
- **Complete & Perfect**: All baseline entities are fully developed with comprehensive details
- **AI Context Source**: Serves as the authoritative reference for all story generation

### 2. User Story Forks
- **Personal Versions**: Each user can create their own story branch
- **Entity Modifications**: Users can customize characters, add locations, change tones
- **Timeline Insertion**: Contribute chapters at ANY point in the canonical timeline
- **Continuity Tracking**: System tracks divergence from canonical baseline

### 3. Community Contributions
- **Chapter Submissions**: Users generate new story chapters
- **Compliance Review**: Automated + manual review for continuity
- **Community Approval**: Voting/review system for quality
- **Integration**: Approved chapters can become canonical or remain as community variants

## Updated Data Model

### Collections

#### `canonicalEntities`
Locked baseline entities that form the story foundation.

```typescript
{
  _id: ObjectId,
  type: "CHARACTER" | "LOCATION" | "FACTION" | "ITEM" | "RULE" | "LORE",
  name: string,
  canonicalVersion: number, // Version of canonical baseline
  locked: true, // Always true for canonical
  
  // Full entity data (comprehensive and complete)
  summary: string,
  character?: CharacterDetails, // Fully developed
  media?: EntityMedia,
  attributes: object,
  relationships: EntityRelationship[],
  
  // Story context
  firstAppearsInChapter?: ObjectId,
  keyMoments: {
    chapterId: ObjectId,
    description: string,
    stateChange?: object
  }[],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

#### `userEntityForks`
User-modified versions of canonical entities.

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  canonicalEntityId: ObjectId,
  
  // What changed from canonical
  modifications: {
    field: string,
    canonicalValue: any,
    userValue: any,
    reason?: string
  }[],
  
  // Merged entity data
  mergedData: Entity, // Canonical + user modifications
  
  // Fork metadata
  forkedAt: Date,
  lastSyncedCanonicalVersion: number,
  divergenceScore: number, // 0-100, how different from canonical
  
  // Usage tracking
  usedInChapters: ObjectId[]
}
```

#### `canonicalChapters`
Official story chapters (approved and integrated).

```typescript
{
  _id: ObjectId,
  chapterNumber: number,
  title: string,
  
  // Story structure
  bookNumber?: number,
  partNumber?: number,
  
  // Timeline
  timelineOrder: number, // Absolute position in story
  inWorldDate?: string,
  duration?: string,
  
  // Content
  synopsis: string,
  fullText?: string, // If available
  scenes: {
    sceneId: string,
    title: string,
    synopsis: string,
    participants: ObjectId[], // canonicalEntityIds
    location: ObjectId,
    keyEvents: string[]
  }[],
  
  // Story mechanics
  dramaticBeats: {
    beat: string,
    description: string
  }[],
  cliffhanger?: string,
  foreshadowing: string[],
  payoffs: string[], // What this chapter resolves
  
  // World state
  worldStateBefore: object,
  worldStateAfter: object,
  entityStates: {
    entityId: ObjectId,
    stateBefore: object,
    stateAfter: object
  }[],
  
  // Metadata
  locked: true,
  canonicalVersion: number,
  createdAt: Date
}
```

#### `userChapterContributions`
User-generated chapters (pending or approved).

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  
  // Insertion point
  insertAfterChapter: ObjectId | null, // null = beginning
  insertBeforeChapter: ObjectId | null, // null = end
  timelinePosition: number,
  
  // Chapter data
  title: string,
  synopsis: string,
  fullText: string,
  
  // User customizations
  toneModifiers: {
    darkness: number, // 0-100
    humor: number,
    tension: number,
    romance: number
  },
  arcDirection: string, // User's intended story direction
  
  // Entities used
  canonicalEntities: ObjectId[],
  userModifiedEntities: ObjectId[], // References to userEntityForks
  newEntities: ObjectId[], // User-created entities
  
  // Story mechanics
  scenes: Scene[],
  dramaticBeats: Beat[],
  
  // Compliance
  complianceStatus: "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION",
  complianceScore: number, // 0-100
  complianceIssues: {
    severity: "ERROR" | "WARNING" | "INFO",
    category: "CONTINUITY" | "CHARACTER" | "TIMELINE" | "TONE" | "QUALITY",
    message: string,
    suggestion?: string
  }[],
  
  // Community
  communityStatus: "PRIVATE" | "SHARED" | "CANONICAL_CANDIDATE",
  upvotes: number,
  downvotes: number,
  reviews: {
    userId: ObjectId,
    rating: number,
    comment: string,
    createdAt: Date
  }[],
  
  // Metadata
  version: number,
  createdAt: Date,
  updatedAt: Date,
  submittedAt?: Date,
  approvedAt?: Date
}
```

#### `userStoryBranches`
User's personal story timeline/version.

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  branchName: string,
  
  // Timeline composition
  chapters: {
    chapterId: ObjectId,
    type: "CANONICAL" | "USER_CONTRIBUTION" | "COMMUNITY",
    order: number,
    customizations?: {
      toneAdjustments?: object,
      entityOverrides?: ObjectId[] // userEntityForks
    }
  }[],
  
  // Branch metadata
  divergenceFromCanonical: number, // 0-100
  totalChapters: number,
  userChapters: number,
  
  // Settings
  defaultTone: object,
  preferredGenres: string[],
  contentRatings: string[],
  
  // Sharing
  isPublic: boolean,
  followers: ObjectId[],
  
  createdAt: Date,
  updatedAt: Date
}
```

#### `complianceRules`
Rules for validating chapter contributions.

```typescript
{
  _id: ObjectId,
  ruleType: "CHARACTER_CONSISTENCY" | "TIMELINE_LOGIC" | "WORLD_RULES" | "TONE_MATCH" | "QUALITY_THRESHOLD",
  
  // Rule definition
  name: string,
  description: string,
  severity: "ERROR" | "WARNING" | "INFO",
  
  // Validation logic
  validationFunction: string, // Function name or AI prompt
  parameters: object,
  
  // Scoring
  weight: number, // Impact on overall compliance score
  
  active: boolean,
  createdAt: Date
}
```

## Key Workflows

### 1. User Starts Contributing
```
1. User views canonical story timeline
2. Selects insertion point (after Chapter X)
3. System loads:
   - Canonical world state at that point
   - All canonical entities and their states
   - Story context and momentum
4. User can:
   - Fork/modify entities for their version
   - Add new entities
   - Set tone preferences
5. AI generates chapter using:
   - Canonical baseline as context
   - User modifications
   - Story continuity from insertion point
```

### 2. Chapter Generation with AI
```
1. User provides:
   - Insertion point
   - Tone/arc preferences
   - Entity modifications
   - Story direction hints
2. System builds comprehensive prompt:
   - Full canonical context up to insertion point
   - All relevant entity details (canonical + user mods)
   - World state and rules
   - Continuity requirements
3. AI generates chapter
4. System runs compliance checks
5. User reviews and refines
6. Submit for community review (optional)
```

### 3. Compliance Review
```
1. Automated checks:
   - Character consistency (personality, abilities, relationships)
   - Timeline logic (no contradictions)
   - World rules compliance
   - Entity state tracking
   - Tone appropriateness
2. AI-powered review:
   - Narrative quality
   - Writing style match
   - Emotional beats
   - Pacing
3. Community review (if submitted):
   - Peer ratings
   - Comments and suggestions
4. Final score and decision
```

### 4. Integration Paths
```
A. Private Branch:
   - Stays in user's personal timeline
   - Can share with followers
   - No impact on canonical

B. Community Variant:
   - Published to community gallery
   - Others can read/fork
   - Voted on by community
   
C. Canonical Candidate:
   - High compliance score
   - Community approval
   - Admin review
   - Can become official canonical chapter
```

## Technical Implementation Notes

### Canonical Entity Loading
- All canonical entities preloaded and cached
- Immutable references for AI context
- Version tracking for updates

### User Fork Management
- Copy-on-write for entity modifications
- Diff tracking from canonical
- Merge conflicts handled gracefully

### AI Context Building
- Comprehensive prompt assembly
- Entity state at specific timeline points
- Relationship graphs
- World rules and constraints

### Compliance Scoring
- Weighted rule system
- AI-assisted evaluation
- Human override capability
- Continuous learning from approvals

### Performance Considerations
- Canonical data heavily cached
- Lazy loading of user forks
- Efficient timeline queries
- Indexed by timelineOrder

## Migration from Current Model

1. Seed `canonicalEntities` with "They Can Hear" baseline
2. Convert existing `entities` to canonical or user forks
3. Create initial `canonicalChapters` from story outline
4. Build compliance rules based on story bible
5. Enable user contribution workflow
