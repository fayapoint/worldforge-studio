/**
 * Bootstrap Script: "They Can Hear" - Episodes 1-3
 * 
 * This script populates the database with the complete screenplay data
 * including characters, chapters (episodes), scenes, and dialog.
 * 
 * Run with: node scripts/bootstrap_tch_screenplay.js
 */

const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    });
    console.log("Loaded environment from .env.local");
  } else {
    console.log(".env.local not found, using defaults");
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "worldforge";

// =====================================================
// CHARACTER DEFINITIONS
// =====================================================
const CHARACTERS = {
  ANGELA: {
    name: "Angela Cruz",
    type: "CHARACTER",
    summary: "48-year-old warm, tidy woman whose voice makes strangers feel like they've known her for years. The first 'receiver' of the clicking phenomenon.",
    tags: ["protagonist", "victim", "first-contact"],
    character: {
      fullName: "Angela Cruz",
      age: "48",
      role: "Heart of the story; the first 'receiver'",
      archetype: "Warm caretaker meets reluctant witness",
      personality: "Warm, empathetic, grounded routine. Doubts herself too quickly; apologizes for fear.",
      appearance: "Warm, tidy appearance. The kind of woman whose voice makes strangers feel like they've known her for years.",
      backstory: "Lives in a modest apartment in Tijuca, Rio de Janeiro. Has a nephew Ricardo whom she calls often.",
      motivation: "To be believed, to protect her family, to understand what's happening",
      voiceNotes: "Talks to her apartment like it's alive. Leaves voice messages because hearing a loved one's voice stabilizes her.",
    },
  },
  RICARDO: {
    name: "Ricardo",
    type: "CHARACTER",
    summary: "30s, focused, competent, charming under pressure. Photo studio professional who missed his aunt's final call.",
    tags: ["protagonist", "guilt", "bridge-character"],
    character: {
      fullName: "Ricardo",
      age: "30s",
      role: "Guilt vector + bridge between worlds (real life ↔ internet)",
      archetype: "Competent modern professional forced into myth",
      personality: "Problem-solver, technical eye, leadership in chaos. Prioritizes 'urgent work' over 'important people'.",
      appearance: "Focused, competent, charming under pressure. Professional attire for photo shoots.",
      backstory: "Works at a photo studio, assists with shoots. Angela's nephew who she calls frequently.",
      motivation: "Redemption for not answering Angela's call, understanding the truth",
      voiceNotes: "Comforts himself by managing variables. When grief hits, he spirals into replaying audio.",
    },
  },
  PEDRO: {
    name: "Pedro",
    type: "CHARACTER",
    summary: "17-year-old curious outsider who creates the r/TheyListenToUs subreddit and becomes a signal tower for the phenomenon.",
    tags: ["protagonist", "investigator", "catalyst"],
    character: {
      fullName: "Pedro",
      age: "17",
      role: "The investigator catalyst; builds the community",
      archetype: "Curious outsider who becomes a signal tower",
      personality: "Nervous humor as defense. Persistent, pattern recognition, digital fluency. Can't resist turning fear into content.",
      appearance: "Teen with cheap lapel mic, phone mounted on tiny tripod. Documentary style.",
      backstory: "A kid who wants to document the world because the world keeps ignoring him. Has a small YouTube/social media channel.",
      motivation: "To be taken seriously, to document truth, to understand the mystery",
      voiceNotes: "Seeks elders because they treat stories like knowledge, not jokes.",
    },
  },
  KATHRINE: {
    name: "Kathrine",
    type: "CHARACTER",
    summary: "Late 20s/early 30s, cautious veteran who knows the rules. Has been tracking the phenomenon longer than anyone.",
    tags: ["protagonist", "veteran", "rules-keeper"],
    character: {
      fullName: "Kathrine",
      age: "Late 20s / early 30s",
      role: "Cautious veteran; knows the rules; introduces discipline",
      archetype: "Survivor with receipts",
      personality: "Systems thinking, boundaries, crisis control. Speaks in rules when scared. Control can become rigidity.",
      appearance: "Not glamorous, not messy—controlled. Minimalist space with blackout curtains.",
      backstory: "Learned 'curiosity has a price' through unknown experiences. Has been tracking the phenomenon for months.",
      motivation: "Containment, survival, protecting others from making her mistakes",
      voiceNotes: "Keeps a notebook full of patterns, dates, incidents. Her space is designed like a bunker.",
    },
  },
  NICOLE: {
    name: "Nicole",
    type: "CHARACTER",
    summary: "Mid-20s model with magnetic presence. Reads people fast, emotionally perceptive, understands attention economy.",
    tags: ["supporting", "observer", "potential-ally"],
    character: {
      fullName: "Nicole",
      age: "Mid-20s",
      role: "Mirror + 'normal world' pressure; potential ally or victim later",
      archetype: "Observant charismatic presence, underestimated intelligence",
      personality: "Reads people fast; emotionally perceptive; resilient. Keeps things light when things get heavy.",
      appearance: "Model with magnetic presence. Light energy but with an edge—used to being watched.",
      backstory: "Professional model who works with Ricardo at shoots. Has her own brand and understands attention economy.",
      motivation: "To be seen as more than surface, curiosity about Ricardo's distress",
      voiceNotes: "Notices Ricardo's tension before he admits it. Used to being watched; therefore, she notices watchers.",
    },
  },
  SEU_ARMANDO: {
    name: "Seu Armando",
    type: "CHARACTER",
    summary: "70s elder who plays dominoes in the park. Knows about the spiders and speaks in ominous truths.",
    tags: ["supporting", "elder", "wisdom"],
    character: {
      fullName: "Seu Armando",
      age: "70s",
      role: "Elder wisdom, ominous truth-teller",
      archetype: "Wise elder who weighs whether listeners can handle the truth",
      personality: "Direct, measured, speaks in truths that land like prophecy",
      appearance: "Park elder, plays dominoes",
      voiceNotes: "Uses domino clicks as emphasis. 'You just stop being interesting.'",
    },
  },
  DONA_LURDES: {
    name: "Dona Lurdes",
    type: "CHARACTER",
    summary: "Late 60s elder who crosses herself without thinking. Shares stories about her cousin in Niterói.",
    tags: ["supporting", "elder", "witness"],
    character: {
      fullName: "Dona Lurdes",
      age: "Late 60s",
      role: "Elder witness, spreader of stories",
      archetype: "Superstitious elder who knows more than she lets on",
      personality: "Conspiratorial, religious, fearful",
      appearance: "Park elder at the domino table",
      voiceNotes: "Crosses herself without thinking. Has a cousin in Niterói who heard them.",
    },
  },
};

// =====================================================
// EPISODE 1 SCENES
// =====================================================
const EPISODE_1_SCENES = [
  {
    title: "Angela Discovers the Sound",
    sceneDirection: "INT. ANGELA'S APARTMENT – KITCHEN – MIDDAY",
    openingAction: "Sunlight through lace curtains makes the room look softer than it is. A small apartment in a lived-in building: chipped tile, a fridge with family photos held by tourist magnets, a potted basil plant that's trying its best. ANGELA CRUZ (48) moves with practiced routine, cooking beans, humming a half-remembered song. The FAN oscillates. The POT bubbles.",
    atmosphereNotes: "Domestic warmth giving way to subtle dread. The clicking begins subtly, like a distant pen tapping.",
    pacing: "SLOW",
    tension: "BUILDING",
    synopsis: "Angela hears strange clicking sounds in her apartment while cooking. She discovers a jumping spider that seems to be communicating with her.",
    dramaticGoal: "Establish Angela as a relatable character and introduce the first sign of the supernatural threat.",
    conflict: "Angela vs. her own perception of reality",
    hook: "A spider that seems to respond to human attention",
    characters: [
      {
        entityKey: "ANGELA",
        position: "CENTER",
        expression: "curious then fearful",
        currentAction: "cooking beans, then investigating sounds",
        dialogLines: [
          { text: "Minha nossa… I'm hearing things now.", emotion: "dismissive", direction: "under her breath" },
          { text: "Okay. Okay, Angela. You're tired. It's the fan. It's the building. Pipes. Electricity. Anything.", emotion: "nervous", direction: "forcing a laugh, shaky" },
          { text: "Ricardo's gonna laugh at me. But… at least he'll answer.", emotion: "hopeful" },
        ],
      },
    ],
  },
  {
    title: "Ricardo at the Photo Shoot",
    sceneDirection: "INT. PHOTO STUDIO – AFTERNOON",
    openingAction: "A different universe. Bright white cyc wall. Reflectors. A softbox hum. A photographer calls directions in Portuguese with English peppered in. Fashion energy, controlled chaos.",
    atmosphereNotes: "Professional, glossy, clean—the 'normal' world that will soon be fractured.",
    pacing: "MEDIUM",
    tension: "LOW",
    synopsis: "Ricardo is busy at a photo shoot when Angela calls. He ignores the call, prioritizing work.",
    dramaticGoal: "Establish Ricardo's world and his fatal flaw—prioritizing urgent work over important people.",
    conflict: "Ricardo's professional obligations vs. family connection",
    turn: "The choice to ignore Angela's call sets the tragedy in motion.",
    characters: [
      {
        entityKey: "RICARDO",
        position: "CENTER",
        expression: "focused",
        currentAction: "assisting the shoot, adjusting lighting",
        dialogLines: [
          { text: "Got it—drop the key a hair. Nicole, chin down, eyes up. Perfect. Hold.", emotion: "professional" },
          { text: "My aunt calls for everything. If she burns the rice, I get a report.", emotion: "dismissive", direction: "forced smile without looking away from monitor" },
        ],
      },
      {
        entityKey: "NICOLE",
        position: "FOREGROUND",
        expression: "magnetic, predatory elegance",
        currentAction: "modeling, hitting poses",
        dialogLines: [
          { text: "Family emergency?", emotion: "curious" },
          { text: "You sure?", emotion: "observant", direction: "clocking the tension" },
        ],
      },
    ],
  },
  {
    title: "Angela's Voice Message",
    sceneDirection: "INT. ANGELA'S APARTMENT – LIVING ROOM – CONTINUOUS",
    openingAction: "Ringing goes to voicemail. Angela's voice tries to sound normal and fails. She glances at the wall where the spider still watches.",
    atmosphereNotes: "Desperate intimacy, a woman trying to be believed before she fully believes herself.",
    pacing: "SLOW",
    tension: "BUILDING",
    synopsis: "Angela leaves a desperate voice message for Ricardo, describing the clicking sounds and the spider.",
    dramaticGoal: "Create the artifact that will haunt Ricardo—the voice message he didn't answer.",
    conflict: "Angela vs. her fear of sounding crazy",
    characters: [
      {
        entityKey: "ANGELA",
        position: "CENTER",
        expression: "fearful, desperate",
        currentAction: "leaving voice message, watching the spider",
        dialogLines: [
          { text: "Oi, meu querido. It's me. Listen—don't laugh, okay? I… I think I'm hearing something. In the apartment.", emotion: "nervous", direction: "voice message" },
          { text: "There's this spider, one of those that jump— Salticidae? You showed me once. And… I swear to God, Ricardo, I can hear it.", emotion: "desperate", direction: "voice message, lowering voice" },
          { text: "Not like… feet on the wall. Like… talking. Clicking. Inside my head. I'm not crazy. I'm not.", emotion: "pleading", direction: "voice message" },
          { text: "Call me when you can, okay? I'll make coffee. Just… call me.", emotion: "hopeful", direction: "voice message" },
        ],
      },
    ],
  },
  {
    title: "Pedro in the Park",
    sceneDirection: "EXT. PUBLIC PARK – LATE AFTERNOON",
    openingAction: "A neighborhood park with a small fountain and tired palm trees. The air is warm, humid, alive with traffic noise and distant laughter. PEDRO (17) sits alone at a bench with a cheap lapel mic clipped to his shirt, phone mounted on a tiny tripod.",
    atmosphereNotes: "Documentary texture, warmth giving way to unease. The domino clicks foreshadow the spider sounds.",
    pacing: "MEDIUM",
    tension: "BUILDING",
    synopsis: "Pedro records content in the park and overhears elders talking about spiders that 'listen'. He investigates.",
    dramaticGoal: "Introduce Pedro and plant seeds of the folklore surrounding the spiders.",
    conflict: "Pedro's desire for content vs. genuine growing fear",
    hook: "The elders' ominous knowledge about spiders that don't need ears to hear.",
    characters: [
      {
        entityKey: "PEDRO",
        position: "CENTER",
        expression: "curious, nervous",
        currentAction: "recording vlog, then approaching elders",
        dialogLines: [
          { text: "What's up. Pedro here. Today I'm in the park because— honestly? I needed air. And also… the old guys here tell the weirdest stories.", emotion: "casual" },
          { text: "Sometimes it's ghosts. Sometimes it's government. But today? One of them said something about spiders.", emotion: "intrigued", direction: "lowering voice" },
          { text: "Boa tarde. Sorry— I didn't mean to eavesdrop. I heard you say 'spiders' and— I'm doing a little… story thing.", emotion: "nervous" },
          { text: "It's for my channel. But— I'm serious. What did you mean?", emotion: "earnest" },
          { text: "Who comes closer?", emotion: "curious" },
          { text: "Spiders don't have ears.", emotion: "skeptical" },
          { text: "That's… creepy.", emotion: "unsettled", direction: "trying to keep it light" },
          { text: "Wait—she heard spiders?", emotion: "excited" },
          { text: "How do you… stop it?", emotion: "fearful", direction: "lowering voice" },
        ],
      },
      {
        entityKey: "SEU_ARMANDO",
        position: "LEFT",
        expression: "weighing, ominous",
        currentAction: "playing dominoes, speaking truths",
        dialogLines: [
          { text: "Story thing. Everything is story now.", emotion: "dismissive" },
          { text: "And still they hear. You ever clap in a room and feel like something clapped back?", emotion: "ominous" },
          { text: "You hear that? Domino is loud because it wants to be loud. Spiders… don't want to be loud.", emotion: "warning", direction: "tapping domino tile hard" },
          { text: "You don't. You just stop being interesting.", emotion: "matter-of-fact", direction: "shrug" },
        ],
      },
      {
        entityKey: "DONA_LURDES",
        position: "RIGHT",
        expression: "fearful, conspiratorial",
        currentAction: "playing dominoes, crossing herself",
        dialogLines: [
          { text: "We don't say too much. When you say too much, they come closer.", emotion: "warning", direction: "crossing herself" },
          { text: "My cousin in Niterói— she said she heard them. At night. Like… radio. Like static with meaning.", emotion: "conspiratorial", direction: "leaning in" },
        ],
      },
    ],
  },
  {
    title: "Nightfall - Angela's Terror",
    sceneDirection: "INT. ANGELA'S APARTMENT – NIGHT",
    openingAction: "The apartment now lit by TV glow and a single lamp. Angela has turned on every light like brightness can keep reality stable. She's cleaned obsessively: baseboards wiped, corners inspected, slippers in hand like a pathetic club.",
    atmosphereNotes: "Mounting dread. Domestic space turned hostile. The clicking becomes a chorus.",
    pacing: "MEDIUM",
    tension: "HIGH",
    synopsis: "Angela is overwhelmed as spiders multiply throughout her apartment. The clicking becomes inescapable.",
    dramaticGoal: "Build unbearable tension before the attack.",
    conflict: "Angela vs. the multiplying threat",
    turn: "The spiders are not singular—they are everywhere.",
    characters: [
      {
        entityKey: "ANGELA",
        position: "CENTER",
        expression: "terrified",
        currentAction: "trying to maintain control, then fleeing",
        dialogLines: [
          { text: "Just… sleep. Just sleep. Tomorrow you'll laugh.", emotion: "desperate", direction: "whispering to herself" },
          { text: "Ricardo… please…", emotion: "pleading" },
          { text: "No. No, no…", emotion: "terrified" },
          { text: "It's just one. It's just one.", emotion: "denial", direction: "horrified at herself for grabbing slipper" },
          { text: "How did you— Where did you come from?", emotion: "horror", direction: "whisper" },
          { text: "So many…", emotion: "awe-horror", direction: "whispered, almost reverent" },
        ],
      },
    ],
  },
  {
    title: "The Attack",
    sceneDirection: "INT. ANGELA'S APARTMENT – BEDROOM – CONTINUOUS",
    openingAction: "Angela bolts toward the bedroom. The spiders do not chase like animals. They converge like a system. They pour from vents, from sockets, from the gap under the door.",
    atmosphereNotes: "Horror climax. Suggestion over explicit gore. Sound design carries the terror.",
    pacing: "FAST",
    tension: "CLIMAX",
    synopsis: "Angela is overwhelmed by the spider swarm. She tries to call Ricardo one last time but he doesn't answer.",
    dramaticGoal: "Deliver the horror payoff while maintaining restraint—suggest rather than show.",
    conflict: "Angela vs. the swarm",
    closingAction: "The clicking becomes softer, almost intimate, like whispers close to the ear. Angela's eyes stare upward at the ceiling. In the TV glow bleeding through the bedroom doorway, we see nothing explicit—only the outline of Angela's face as it disappears under motion. Then—Silence.",
    characters: [
      {
        entityKey: "ANGELA",
        position: "CENTER",
        expression: "pure terror",
        currentAction: "fleeing, calling Ricardo, being overwhelmed",
        dialogLines: [],
      },
    ],
  },
  {
    title: "Ricardo Discovers the News",
    sceneDirection: "INT. RICARDO'S APARTMENT – MORNING",
    openingAction: "Ricardo wakes on a sofa, still in last night's clothes. A camera bag on the floor. His phone dead beside him. He groans, plugs it in, rubs his face.",
    atmosphereNotes: "Morning-after mundanity shattered by news. Guilt becomes physical.",
    pacing: "MEDIUM",
    tension: "HIGH",
    synopsis: "Ricardo wakes to discover Angela has died. He listens to her voice message for the first time.",
    dramaticGoal: "Transform Ricardo from bystander to guilt-driven protagonist.",
    conflict: "Ricardo vs. his own guilt and disbelief",
    turn: "The realization that he could have done something.",
    characters: [
      {
        entityKey: "RICARDO",
        position: "CENTER",
        expression: "shocked, devastated",
        currentAction: "waking up, checking phone, watching news",
        dialogLines: [
          { text: "No. No, no, no—", emotion: "denial" },
          { text: "Auntie…?", emotion: "desperate", direction: "staring at phone" },
        ],
      },
    ],
  },
  {
    title: "Pedro Creates the Subreddit",
    sceneDirection: "INT. PEDRO'S BEDROOM – NIGHT",
    openingAction: "Posters, cables, cheap LED strip lights, a messy desk with a secondhand laptop. Pedro's eyes are bright from obsession. He's watching clips on his screen: 'spider infestation,' 'apartment sealed,' 'weird clicking audio,' 'Rio de Janeiro.'",
    atmosphereNotes: "Teen obsession meets digital horror. The birth of a community.",
    pacing: "MEDIUM",
    tension: "BUILDING",
    synopsis: "Pedro creates r/TheyListenToUs and immediately gets a message from Kathrine.",
    dramaticGoal: "Birth the community that will become central to the story.",
    conflict: "Pedro's desire to share vs. the warnings he received",
    hook: "Kathrine's immediate response suggests a wider phenomenon.",
    characters: [
      {
        entityKey: "PEDRO",
        position: "CENTER",
        expression: "obsessed, then terrified",
        currentAction: "creating subreddit, posting, messaging",
        dialogLines: [
          { text: "Okay. So I know how this sounds. But I talked to people in the park and they said… they listen. And now—someone died.", emotion: "excited-nervous", direction: "whispering to camera" },
          { text: "Oh… no…", emotion: "fearful", direction: "whisper, seeing Kathrine's message" },
          { text: "We're not alone.", emotion: "terrified-thrilled", direction: "whisper to himself" },
        ],
      },
    ],
  },
];

// =====================================================
// EPISODE 2 SCENES
// =====================================================
const EPISODE_2_SCENES = [
  {
    title: "Ricardo's Sleepless Morning",
    sceneDirection: "INT. RICARDO'S APARTMENT – EARLY MORNING",
    openingAction: "Ricardo hasn't slept. The TV is paused on a news frame: the building, the tape. Ricardo sits at his kitchen table with his phone in hand, replaying Angela's voicemail like it's a prayer. His coffee sits untouched. His eyes are red.",
    atmosphereNotes: "Grief and guilt. The apartment feels different—corners have weight.",
    pacing: "SLOW",
    tension: "BUILDING",
    synopsis: "Ricardo obsessively replays Angela's voicemail. He notices a spider in his apartment and begins to hear the clicking himself.",
    dramaticGoal: "Show Ricardo's descent into the phenomenon.",
    conflict: "Ricardo vs. his grief and growing paranoia",
    turn: "Ricardo begins to hear the clicking—he's been marked.",
    characters: [
      {
        entityKey: "RICARDO",
        position: "CENTER",
        expression: "grief-stricken, paranoid",
        currentAction: "replaying voicemail, trapping spider",
        dialogLines: [
          { text: "You're not… listening. That's insane.", emotion: "denial", direction: "to the trapped spider" },
          { text: "No.", emotion: "fearful", direction: "shaking head" },
          { text: "Who is this?", emotion: "confused", direction: "looking at anonymous text" },
          { text: "It's not just her.", emotion: "realization", direction: "whisper" },
        ],
      },
    ],
  },
  {
    title: "At Angela's Building",
    sceneDirection: "EXT. APARTMENT BUILDING – DAY",
    openingAction: "Police tape is gone, but there's a residue of attention: neighbors in clusters, whispers like insects. Ricardo arrives, looks up at the windows.",
    atmosphereNotes: "Public grief, private guilt. The building feels watchful.",
    pacing: "SLOW",
    tension: "MEDIUM",
    synopsis: "Ricardo visits Angela's building and talks to a neighbor about what happened.",
    dramaticGoal: "Ground Ricardo's grief in physical space while gathering information.",
    conflict: "Ricardo vs. his need to know",
    characters: [
      {
        entityKey: "RICARDO",
        position: "CENTER",
        expression: "grieving, searching",
        currentAction: "looking at building, talking to neighbor",
        dialogLines: [
          { text: "Did… did she say anything? Before?", emotion: "desperate" },
          { text: "Did anyone hear her scream?", emotion: "pained" },
        ],
      },
    ],
  },
  {
    title: "Pedro and Kathrine Connect",
    sceneDirection: "INT. PEDRO'S BEDROOM – NIGHT",
    openingAction: "Pedro has 42 members now. Not huge, but active. He's wired. He's on a voice call with KATHRINE. We don't see her face yet, only her profile icon and typing indicator.",
    atmosphereNotes: "Digital intimacy, escalating dread. Two strangers united by fear.",
    pacing: "MEDIUM",
    tension: "BUILDING",
    synopsis: "Pedro and Kathrine have their first voice call. She warns him about the rules.",
    dramaticGoal: "Establish Kathrine's authority and the 'rules' of the phenomenon.",
    conflict: "Pedro's desire to share vs. Kathrine's warnings about attention",
    characters: [
      {
        entityKey: "PEDRO",
        position: "CENTER",
        expression: "eager, nervous",
        currentAction: "on voice call, taking notes",
        dialogLines: [
          { text: "Okay, so you said you heard it— the clicking—in your head?", emotion: "curious" },
          { text: "Syncing to what?", emotion: "confused" },
          { text: "That's not— that's not science.", emotion: "skeptical" },
          { text: "I uploaded the audio. People are hearing it. Some say it's fake. Some say it's… code.", emotion: "excited" },
          { text: "So what do we call it?", emotion: "frustrated" },
          { text: "Who are you, Kathrine?", emotion: "suspicious" },
          { text: "I'm not scared.", emotion: "bravado" },
          { text: "People are coming in fast. This is… happening.", emotion: "excited" },
          { text: "Okay. Rules. Like what?", emotion: "focused", direction: "grabbing notepad" },
          { text: "Why 'clapping'?", emotion: "confused" },
        ],
      },
      {
        entityKey: "KATHRINE",
        position: "OFF_SCREEN",
        expression: "calm, guarded",
        currentAction: "on voice call, giving warnings",
        dialogLines: [
          { text: "Not at first. At first it was just… 'do you hear that?' like a prank. Then it started syncing.", emotion: "measured" },
          { text: "To attention.", emotion: "ominous" },
          { text: "I didn't say it was. I said it's consistent.", emotion: "firm" },
          { text: "Don't call it code. If you call it code, people will try to decode it. Then you'll get more attention. Then—", emotion: "warning", direction: "doesn't finish" },
          { text: "A symptom.", emotion: "clinical" },
          { text: "Someone who learned that being curious has a price.", emotion: "guarded", direction: "voice softening" },
          { text: "You made a subreddit called 'They Listen to Us.' That's not bravery. That's a flare gun.", emotion: "sharp" },
          { text: "Then you need rules. Now.", emotion: "urgent" },
          { text: "No doxxing. No 'summoning' jokes. No 'tests.' No clapping videos. No 'let's see if it hears this.'", emotion: "firm" },
          { text: "Because it likes boundaries. And clapping is a boundary.", emotion: "cryptic" },
        ],
      },
    ],
  },
  {
    title: "Ricardo Finds the Subreddit",
    sceneDirection: "INT. RICARDO'S APARTMENT – LATE NIGHT",
    openingAction: "Ricardo sits on his couch, doom-scrolling. He types 'Angela Cruz spiders clicking' into search.",
    atmosphereNotes: "Digital rabbit hole. The worlds collide.",
    pacing: "MEDIUM",
    tension: "HIGH",
    synopsis: "Ricardo discovers r/TheyListenToUs and posts about Angela. He receives threatening anonymous messages.",
    dramaticGoal: "Connect Ricardo to the community and escalate his involvement.",
    conflict: "Ricardo vs. his need for answers vs. the warnings",
    turn: "Ricardo's post reveals he's Angela's nephew—and marks him further.",
    characters: [
      {
        entityKey: "RICARDO",
        position: "CENTER",
        expression: "obsessed, fearful",
        currentAction: "scrolling, reading, posting",
        dialogLines: [
          { text: "No.", emotion: "denial", direction: "ripping out earbuds" },
          { text: "What the hell…?", emotion: "confused", direction: "reading anonymous comment" },
        ],
      },
    ],
  },
  {
    title: "Kathrine's Room Revealed",
    sceneDirection: "INT. UNKNOWN ROOM – NIGHT (KATHRINE)",
    openingAction: "We finally see KATHRINE (late 20s/early 30s) in partial light. Not glamorous, not messy—controlled. She sits at a desk with blackout curtains and a small white noise machine.",
    atmosphereNotes: "Bunker mentality. Controlled fear. She's been preparing.",
    pacing: "SLOW",
    tension: "BUILDING",
    synopsis: "We finally see Kathrine's space and learn she's been tracking the phenomenon for months.",
    dramaticGoal: "Reveal Kathrine as a deeper player in the story.",
    conflict: "Kathrine's desire to protect vs. Pedro's recklessness",
    characters: [
      {
        entityKey: "KATHRINE",
        position: "CENTER",
        expression: "controlled, frustrated",
        currentAction: "watching subreddit, writing rules, speaking to spider",
        dialogLines: [
          { text: "You shouldn't have posted that.", emotion: "frustrated", direction: "muttering, seeing Ricardo's pattern post" },
          { text: "I'm not talking to you.", emotion: "controlled anger", direction: "whispering to spider on ceiling" },
        ],
      },
    ],
  },
  {
    title: "Ricardo's Recording",
    sceneDirection: "INT. RICARDO'S APARTMENT – NIGHT",
    openingAction: "Ricardo sits at his table, phone in hand, trembling. He records an audio message.",
    atmosphereNotes: "Confession. Desperation. The clicking intensifies.",
    pacing: "SLOW",
    tension: "CLIMAX",
    synopsis: "Ricardo records a confession about Angela. His phone displays an impossible incoming call: 'ANGELA'.",
    dramaticGoal: "End the episode on maximum dread—the dead are calling.",
    conflict: "Ricardo vs. the impossible",
    hook: "The call from 'ANGELA' after her death.",
    closingAction: "The phone keeps ringing. Ricardo whispers the title like a curse: 'They listen to us.'",
    characters: [
      {
        entityKey: "RICARDO",
        position: "CENTER",
        expression: "devastated, terrified",
        currentAction: "recording message, seeing impossible call",
        dialogLines: [
          { text: "My aunt died because I didn't answer. And now I think… it doesn't matter. Because it heard her. And now it heard me.", emotion: "confession" },
          { text: "Auntie…?", emotion: "hope-terror", direction: "seeing caller ID" },
          { text: "They listen to us.", emotion: "curse", direction: "whisper" },
        ],
      },
    ],
  },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function createCharacter(db, tenantId, projectId, charData) {
  const entity = {
    _id: new ObjectId(),
    tenantId,
    projectId,
    type: charData.type,
    name: charData.name,
    summary: charData.summary,
    tags: charData.tags || [],
    character: charData.character || {},
    attributes: {},
    relationships: [],
    media: {},
    version: { status: "DRAFT", number: 1 },
    audit: {
      createdBy: "bootstrap",
      updatedBy: "bootstrap",
      updatedAt: new Date(),
    },
  };
  
  await db.collection("entities").insertOne(entity);
  console.log(`  Created character: ${charData.name}`);
  return entity;
}

async function createChapter(db, tenantId, projectId, title, synopsis, order) {
  const chapter = {
    _id: new ObjectId(),
    tenantId,
    projectId,
    nodeType: "CHAPTER",
    title,
    synopsis,
    goals: { dramaticGoal: "", conflict: "", turn: "" },
    hooks: { hook: "", foreshadow: [], payoffTargets: [] },
    time: { order },
    participants: [],
    locations: [],
    worldStateDelta: [],
    version: { status: "DRAFT", number: 1 },
    audit: {
      createdBy: "bootstrap",
      updatedBy: "bootstrap",
      updatedAt: new Date(),
    },
  };
  
  await db.collection("storynodes").insertOne(chapter);
  console.log(`  Created chapter: ${title}`);
  return chapter;
}

async function createScene(db, tenantId, projectId, sceneData, characterMap, order) {
  // Build character instances
  const characterInstances = (sceneData.characters || []).map((charData, idx) => {
    const entity = characterMap[charData.entityKey];
    if (!entity) {
      console.warn(`    Warning: Character ${charData.entityKey} not found`);
      return null;
    }
    
    return {
      id: generateId(),
      entityId: entity._id.toString(),
      sceneNodeId: "", // Will be set after scene creation
      name: entity.name,
      thumbnailUrl: entity.media?.thumbnailUrl,
      baseAppearance: entity.character?.appearance,
      wardrobe: [],
      position: charData.position || "CENTER",
      expression: charData.expression,
      currentAction: charData.currentAction,
      dialogLines: (charData.dialogLines || []).map((line) => ({
        id: generateId(),
        text: line.text,
        emotion: line.emotion,
        direction: line.direction,
      })),
      stateChanges: [],
      includeInPrompt: true,
      promptPriority: idx + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }).filter(Boolean);
  
  const scene = {
    _id: new ObjectId(),
    tenantId,
    projectId,
    nodeType: "SCENE",
    title: sceneData.title,
    synopsis: sceneData.synopsis || "",
    goals: {
      dramaticGoal: sceneData.dramaticGoal || "",
      conflict: sceneData.conflict || "",
      turn: sceneData.turn || "",
    },
    hooks: {
      hook: sceneData.hook || "",
      foreshadow: [],
      payoffTargets: [],
    },
    time: { order },
    participants: [],
    locations: [],
    worldStateDelta: [],
    screenplay: {
      sceneNodeId: "", // Will be set
      sceneDirection: sceneData.sceneDirection || "",
      openingAction: sceneData.openingAction || "",
      closingAction: sceneData.closingAction || "",
      atmosphereNotes: sceneData.atmosphereNotes || "",
      pacing: sceneData.pacing || "MEDIUM",
      tension: sceneData.tension || "MEDIUM",
      characterInstances,
      dialogSequence: characterInstances.flatMap((c) => c.dialogLines.map((l) => l.id)),
    },
    version: { status: "DRAFT", number: 1 },
    audit: {
      createdBy: "bootstrap",
      updatedBy: "bootstrap",
      updatedAt: new Date(),
    },
  };
  
  // Set the sceneNodeId in screenplay
  scene.screenplay.sceneNodeId = scene._id.toString();
  scene.screenplay.characterInstances.forEach((c) => {
    c.sceneNodeId = scene._id.toString();
  });
  
  await db.collection("storynodes").insertOne(scene);
  console.log(`    Created scene: ${sceneData.title} (${characterInstances.length} characters, ${characterInstances.reduce((a, c) => a + c.dialogLines.length, 0)} lines)`);
  return scene;
}

async function createEdge(db, tenantId, projectId, fromNodeId, toNodeId, edgeType = "LINEAR") {
  const edge = {
    _id: new ObjectId(),
    tenantId,
    projectId,
    fromNodeId: fromNodeId.toString(),
    toNodeId: toNodeId.toString(),
    edgeType,
    conditions: [],
    notes: "",
  };
  
  await db.collection("storyedges").insertOne(edge);
  return edge;
}

// =====================================================
// MAIN BOOTSTRAP FUNCTION
// =====================================================
async function bootstrap() {
  console.log("=".repeat(60));
  console.log("THEY CAN HEAR - Screenplay Bootstrap");
  console.log("=".repeat(60));
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db(DB_NAME);
    
    // Get or create tenant and project
    let tenant = await db.collection("tenants").findOne({});
    if (!tenant) {
      tenant = {
        _id: new ObjectId(),
        name: "They Can Hear Productions",
        plan: "pro",
        createdAt: new Date(),
      };
      await db.collection("tenants").insertOne(tenant);
      console.log("Created tenant");
    }
    
    const tenantId = tenant._id.toString();
    
    // Check for existing project or create
    let project = await db.collection("projects").findOne({ 
      tenantId,
      title: { $regex: /they.*can.*hear/i }
    });
    
    if (!project) {
      project = {
        _id: new ObjectId(),
        tenantId,
        title: "They Can Hear",
        logline: "Angela leaves a voice message. That night, millions attack. Ricardo learns on TV. Pedro creates the Reddit. Kathrine joins. A psychological horror series about spiders that listen.",
        createdAt: new Date(),
      };
      await db.collection("projects").insertOne(project);
      console.log("Created project: They Can Hear");
    } else {
      console.log("Found existing project: " + project.title);
    }
    
    const projectId = project._id.toString();
    
    // Create characters
    console.log("\n--- Creating Characters ---");
    const characterMap = {};
    for (const [key, charData] of Object.entries(CHARACTERS)) {
      // Check if character exists
      const existing = await db.collection("entities").findOne({
        tenantId,
        projectId,
        name: charData.name,
        type: "CHARACTER",
      });
      
      if (existing) {
        console.log(`  Character exists: ${charData.name}`);
        characterMap[key] = existing;
      } else {
        characterMap[key] = await createCharacter(db, tenantId, projectId, charData);
      }
    }
    
    // Create Episode 1
    console.log("\n--- Creating Episode 1: THEY LISTEN TO US! ---");
    const ep1 = await createChapter(
      db, tenantId, projectId,
      "Episode 1 — THEY LISTEN TO US!",
      "Angela leaves a voice message. That night, millions attack. Ricardo learns on TV. Pedro creates the Reddit. Kathrine joins.",
      1
    );
    
    let sceneOrder = 10;
    const ep1Scenes = [];
    for (const sceneData of EPISODE_1_SCENES) {
      const scene = await createScene(db, tenantId, projectId, sceneData, characterMap, sceneOrder);
      ep1Scenes.push(scene);
      sceneOrder += 10;
    }
    
    // Create edges for Episode 1
    await createEdge(db, tenantId, projectId, ep1._id, ep1Scenes[0]._id);
    for (let i = 0; i < ep1Scenes.length - 1; i++) {
      await createEdge(db, tenantId, projectId, ep1Scenes[i]._id, ep1Scenes[i + 1]._id);
    }
    
    // Create Episode 2
    console.log("\n--- Creating Episode 2: THE SILENCE OF ANGELA ---");
    const ep2 = await createChapter(
      db, tenantId, projectId,
      "Episode 2 — THE SILENCE OF ANGELA",
      "Aftermath. Ricardo spirals. Pedro and Kathrine deepen the mystery. The 'sound' spreads.",
      100
    );
    
    sceneOrder = 110;
    const ep2Scenes = [];
    for (const sceneData of EPISODE_2_SCENES) {
      const scene = await createScene(db, tenantId, projectId, sceneData, characterMap, sceneOrder);
      ep2Scenes.push(scene);
      sceneOrder += 10;
    }
    
    // Create edges for Episode 2
    await createEdge(db, tenantId, projectId, ep1Scenes[ep1Scenes.length - 1]._id, ep2._id);
    await createEdge(db, tenantId, projectId, ep2._id, ep2Scenes[0]._id);
    for (let i = 0; i < ep2Scenes.length - 1; i++) {
      await createEdge(db, tenantId, projectId, ep2Scenes[i]._id, ep2Scenes[i + 1]._id);
    }
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("BOOTSTRAP COMPLETE");
    console.log("=".repeat(60));
    console.log(`Characters: ${Object.keys(characterMap).length}`);
    console.log(`Chapters: 2`);
    console.log(`Scenes: ${ep1Scenes.length + ep2Scenes.length}`);
    
    const totalLines = [...ep1Scenes, ...ep2Scenes].reduce((acc, scene) => {
      return acc + (scene.screenplay?.characterInstances?.reduce((a, c) => a + c.dialogLines.length, 0) || 0);
    }, 0);
    console.log(`Dialog Lines: ${totalLines}`);
    
  } catch (error) {
    console.error("Bootstrap failed:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\nDatabase connection closed");
  }
}

// Run if called directly
if (require.main === module) {
  bootstrap().catch(console.error);
}

module.exports = { bootstrap, CHARACTERS, EPISODE_1_SCENES, EPISODE_2_SCENES };
