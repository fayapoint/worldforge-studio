// =====================================================
// COMPREHENSIVE CINEMATIC PROMPT OPTIONS
// Based on professional image generation prompt structures
// =====================================================

export type CinematicOption = {
  value: string;
  label: string;
  icon: string;
  description: string;
  promptText: string; // Full prompt text shown in tooltip and used in generation
};

// =====================================================
// SHOT COMPOSITION OPTIONS
// =====================================================
export const SHOT_ANGLE_OPTIONS: CinematicOption[] = [
  { value: "eye-level", label: "Eye Level", icon: "eye", description: "Natural perspective", promptText: "eye-level shot, natural perspective, direct engagement with subject" },
  { value: "low-angle", label: "Low Angle", icon: "arrowRight", description: "Power, dominance", promptText: "low-angle shot looking up, emphasizing power and dominance, heroic perspective" },
  { value: "high-angle", label: "High Angle", icon: "chevronDown", description: "Vulnerability", promptText: "high-angle shot looking down, creating sense of vulnerability or overview" },
  { value: "dutch-angle", label: "Dutch Angle", icon: "warning", description: "Tension, unease", promptText: "dutch angle tilted frame, creating visual tension and psychological unease" },
  { value: "birds-eye", label: "Bird's Eye", icon: "layers", description: "Overhead view", promptText: "bird's eye view, directly overhead, omniscient perspective" },
  { value: "worms-eye", label: "Worm's Eye", icon: "target", description: "Dramatic low", promptText: "worm's eye view, extremely low angle, dramatic and imposing" },
];

export const SHOT_FRAMING_OPTIONS: CinematicOption[] = [
  { value: "extreme-close", label: "Extreme Close-up", icon: "zoomIn", description: "Macro detail", promptText: "extreme close-up, macro detail shot, intimate focus on specific feature" },
  { value: "close-up", label: "Close-up", icon: "eye", description: "Face/emotion", promptText: "close-up shot, face filling frame, capturing emotion and subtle expressions" },
  { value: "medium-close", label: "Medium Close", icon: "character", description: "Head & shoulders", promptText: "medium close-up, head and shoulders visible, conversational framing" },
  { value: "medium", label: "Medium Shot", icon: "character", description: "Waist up", promptText: "medium shot, waist up, balanced between subject and environment" },
  { value: "medium-full", label: "Medium Full", icon: "character", description: "Knees up", promptText: "medium full shot, knees up, showing body language and gesture" },
  { value: "full-shot", label: "Full Shot", icon: "character", description: "Full body", promptText: "full shot, entire body visible, subject in complete context" },
  { value: "wide", label: "Wide Shot", icon: "maximize", description: "Environment focus", promptText: "wide shot, establishing environment, subject within larger context" },
  { value: "extreme-wide", label: "Extreme Wide", icon: "world", description: "Epic scale", promptText: "extreme wide shot, epic scale, vast environment dominating frame" },
];

export const FOCUS_DEPTH_OPTIONS: CinematicOption[] = [
  { value: "shallow", label: "Shallow DoF", icon: "circle", description: "f/1.4-2.8 bokeh", promptText: "shallow depth of field, f/1.4-2.8, beautiful bokeh, subject isolation, creamy background blur" },
  { value: "moderate", label: "Moderate DoF", icon: "circle", description: "f/4-5.6 balanced", promptText: "moderate depth of field, f/4-5.6, balanced focus, subject sharp with soft background" },
  { value: "deep", label: "Deep DoF", icon: "layers", description: "f/8-16 sharp", promptText: "deep depth of field, f/8-16, everything in sharp focus, environmental detail preserved" },
  { value: "split", label: "Split Diopter", icon: "split", description: "Two focal planes", promptText: "split diopter effect, two focal planes simultaneously sharp, foreground and background both in focus" },
];

// =====================================================
// LIGHTING OPTIONS
// =====================================================
export const LIGHTING_TYPE_OPTIONS: CinematicOption[] = [
  { value: "natural", label: "Natural Light", icon: "star", description: "Sun/ambient", promptText: "natural lighting, sun as key light, authentic ambient illumination" },
  { value: "golden-hour", label: "Golden Hour", icon: "flame", description: "Warm sunset", promptText: "golden hour lighting, warm sunset tones, long soft shadows, magical hour" },
  { value: "blue-hour", label: "Blue Hour", icon: "world", description: "Cool twilight", promptText: "blue hour lighting, cool twilight tones, soft diffused ambient light" },
  { value: "overcast", label: "Overcast", icon: "circle", description: "Soft diffused", promptText: "overcast lighting, soft diffused light, no harsh shadows, even illumination" },
  { value: "harsh-sun", label: "Harsh Midday", icon: "target", description: "Strong contrast", promptText: "harsh midday sun, strong contrast, deep shadows, high dynamic range" },
  { value: "studio", label: "Studio Lighting", icon: "sparkles", description: "Controlled setup", promptText: "professional studio lighting, controlled setup, perfect exposure" },
  { value: "flash", label: "Direct Flash", icon: "flame", description: "On-camera flash", promptText: "direct on-camera flash, harsh frontal light, blown highlights, editorial aesthetic" },
  { value: "mixed", label: "Mixed Sources", icon: "layers", description: "Multiple lights", promptText: "mixed lighting sources, practical lights combined with ambient, complex illumination" },
];

export const LIGHTING_DIRECTION_OPTIONS: CinematicOption[] = [
  { value: "front", label: "Front Light", icon: "circle", description: "Flat, even", promptText: "frontal lighting, even illumination, minimal shadows, flat aesthetic" },
  { value: "side", label: "Side Light", icon: "arrowRight", description: "Dramatic shadows", promptText: "side lighting, dramatic shadows, half the face illuminated, chiaroscuro effect" },
  { value: "back", label: "Back Light", icon: "star", description: "Rim/silhouette", promptText: "backlighting, rim light on edges, silhouette potential, halo effect" },
  { value: "rembrandt", label: "Rembrandt", icon: "eye", description: "Triangle shadow", promptText: "Rembrandt lighting, triangle of light on cheek, classic portrait illumination" },
  { value: "butterfly", label: "Butterfly", icon: "character", description: "Beauty lighting", promptText: "butterfly lighting, overhead key light, shadow under nose, glamorous beauty lighting" },
  { value: "split", label: "Split Light", icon: "split", description: "Half face lit", promptText: "split lighting, exactly half face lit, dramatic and mysterious" },
  { value: "under", label: "Under Lighting", icon: "warning", description: "Horror/drama", promptText: "underlighting, light from below, unsettling horror aesthetic, dramatic effect" },
];

export const LIGHTING_QUALITY_OPTIONS: CinematicOption[] = [
  { value: "soft", label: "Soft Light", icon: "circle", description: "Diffused, gentle", promptText: "soft diffused lighting, gentle gradients, flattering skin tones, no harsh edges" },
  { value: "hard", label: "Hard Light", icon: "target", description: "Sharp shadows", promptText: "hard lighting, sharp defined shadows, high contrast, dramatic edges" },
  { value: "volumetric", label: "Volumetric", icon: "sparkles", description: "God rays, haze", promptText: "volumetric lighting, visible light rays, god rays through atmosphere, haze and dust particles" },
  { value: "neon", label: "Neon/Colored", icon: "flame", description: "Colored gels", promptText: "neon colored lighting, vibrant color gels, cyberpunk aesthetic, saturated hues" },
  { value: "practical", label: "Practical Lights", icon: "star", description: "In-scene sources", promptText: "practical lighting from visible sources in scene, lamps, candles, screens, authentic motivation" },
];

// =====================================================
// CAMERA TECHNICAL OPTIONS
// =====================================================
export const CAMERA_TYPE_OPTIONS: CinematicOption[] = [
  { value: "cinema", label: "Cinema Camera", icon: "scene", description: "ARRI, RED", promptText: "shot on ARRI Alexa, cinematic color science, 4K resolution, professional film look" },
  { value: "dslr", label: "DSLR/Mirrorless", icon: "eye", description: "Canon, Sony", promptText: "shot on professional DSLR, Canon 5D or Sony A7, sharp detail, photographic quality" },
  { value: "medium-format", label: "Medium Format", icon: "maximize", description: "Hasselblad", promptText: "shot on medium format Hasselblad, exceptional detail, beautiful color depth, editorial quality" },
  { value: "film-35mm", label: "35mm Film", icon: "history", description: "Analog grain", promptText: "shot on 35mm film, organic grain, analog color rendition, nostalgic aesthetic" },
  { value: "film-70mm", label: "70mm IMAX", icon: "world", description: "Epic scale", promptText: "shot on 70mm IMAX film, exceptional resolution, epic cinematic scale" },
  { value: "smartphone", label: "Smartphone", icon: "circle", description: "iPhone, mobile", promptText: "shot on iPhone 15 Pro, smartphone aesthetic, computational photography, casual authentic feel" },
  { value: "polaroid", label: "Instant Film", icon: "star", description: "Polaroid look", promptText: "Polaroid instant film aesthetic, vintage colors, soft focus edges, nostalgic" },
];

export const LENS_OPTIONS: CinematicOption[] = [
  { value: "wide-14", label: "14mm Ultra Wide", icon: "maximize", description: "Dramatic distortion", promptText: "14mm ultra-wide lens, dramatic perspective distortion, environmental storytelling" },
  { value: "wide-24", label: "24mm Wide", icon: "world", description: "Environmental", promptText: "24mm wide angle lens, environmental context, slight barrel distortion" },
  { value: "normal-35", label: "35mm Standard", icon: "eye", description: "Natural view", promptText: "35mm lens, natural field of view, documentary perspective, versatile framing" },
  { value: "normal-50", label: "50mm Nifty", icon: "character", description: "Human eye", promptText: "50mm lens, human eye perspective, minimal distortion, classic portrait focal length" },
  { value: "portrait-85", label: "85mm Portrait", icon: "character", description: "Flattering", promptText: "85mm portrait lens, flattering compression, beautiful background separation, creamy bokeh" },
  { value: "tele-135", label: "135mm Telephoto", icon: "zoomIn", description: "Compressed", promptText: "135mm telephoto, compressed perspective, subject isolation, intimate distance" },
  { value: "tele-200", label: "200mm+ Long", icon: "target", description: "Extreme compress", promptText: "200mm+ telephoto lens, extreme background compression, dramatic subject isolation" },
  { value: "macro-100", label: "100mm Macro", icon: "zoomIn", description: "Extreme detail", promptText: "100mm macro lens, extreme close-up detail, 1:1 reproduction, texture emphasis" },
  { value: "anamorphic", label: "Anamorphic", icon: "scene", description: "Cinematic flares", promptText: "anamorphic lens, horizontal lens flares, oval bokeh, 2.39:1 cinematic aspect ratio" },
];

export const FILM_GRAIN_OPTIONS: CinematicOption[] = [
  { value: "none", label: "No Grain", icon: "circle", description: "Clean digital", promptText: "clean digital image, no grain, smooth tones, modern aesthetic" },
  { value: "fine", label: "Fine Grain", icon: "sparkles", description: "Subtle texture", promptText: "fine film grain, subtle texture, slight organic noise, filmic quality" },
  { value: "medium", label: "Medium Grain", icon: "circle", description: "Visible texture", promptText: "medium film grain, visible organic texture, analog character, ISO 400-800 look" },
  { value: "heavy", label: "Heavy Grain", icon: "flame", description: "Gritty aesthetic", promptText: "heavy film grain, gritty texture, high ISO 1600+ aesthetic, raw and authentic" },
  { value: "digital-noise", label: "Digital Noise", icon: "warning", description: "High ISO noise", promptText: "visible digital noise in shadows, high ISO artifacts, imperfect but authentic" },
];

// =====================================================
// COLOR PALETTE OPTIONS
// =====================================================
export const COLOR_PALETTE_OPTIONS: CinematicOption[] = [
  { value: "warm", label: "Warm Tones", icon: "flame", description: "Orange, amber", promptText: "warm color palette, orange and amber tones, golden warmth, sunset hues" },
  { value: "cool", label: "Cool Tones", icon: "world", description: "Blue, teal", promptText: "cool color palette, blue and teal tones, cold aesthetic, moonlight hues" },
  { value: "neutral", label: "Neutral", icon: "circle", description: "Balanced", promptText: "neutral color palette, balanced tones, accurate white balance, natural colors" },
  { value: "desaturated", label: "Desaturated", icon: "circle", description: "Muted colors", promptText: "desaturated muted colors, low saturation, subdued palette, understated elegance" },
  { value: "vibrant", label: "Vibrant", icon: "sparkles", description: "Bold saturated", promptText: "vibrant saturated colors, bold and punchy, high color contrast, eye-catching" },
  { value: "monochrome", label: "Monochromatic", icon: "circle", description: "Single hue", promptText: "monochromatic color scheme, single color family, tonal variations, cohesive palette" },
  { value: "complementary", label: "Complementary", icon: "split", description: "Opposing colors", promptText: "complementary color scheme, opposing colors for visual tension, orange and teal" },
  { value: "cinematic-teal", label: "Teal & Orange", icon: "scene", description: "Hollywood look", promptText: "cinematic teal and orange color grading, Hollywood blockbuster aesthetic, skin tone enhancement" },
  { value: "noir", label: "Film Noir", icon: "skull", description: "B&W contrast", promptText: "film noir black and white, high contrast, deep shadows, dramatic lighting" },
  { value: "vintage", label: "Vintage Film", icon: "history", description: "Faded retro", promptText: "vintage film color palette, faded highlights, lifted blacks, nostalgic retro tones" },
];

// =====================================================
// ENVIRONMENT/SETTING OPTIONS
// =====================================================
export const TIME_OF_DAY_OPTIONS: CinematicOption[] = [
  { value: "dawn", label: "Dawn", icon: "star", description: "Early morning", promptText: "dawn, early morning light, soft pink and purple sky, quiet atmosphere, new day beginning" },
  { value: "morning", label: "Morning", icon: "star", description: "Fresh daylight", promptText: "morning light, fresh daylight, crisp shadows, energetic atmosphere" },
  { value: "midday", label: "Midday", icon: "target", description: "Harsh overhead", promptText: "midday sun, harsh overhead lighting, strong shadows, high contrast" },
  { value: "afternoon", label: "Afternoon", icon: "flame", description: "Warm angled", promptText: "afternoon light, warm angled sun, pleasant golden undertones, relaxed atmosphere" },
  { value: "golden-hour", label: "Golden Hour", icon: "flame", description: "Magic hour", promptText: "golden hour, magic hour lighting, warm orange glow, long soft shadows, cinematic" },
  { value: "dusk", label: "Dusk", icon: "world", description: "Twilight", promptText: "dusk twilight, fading light, blue and purple sky, transitional atmosphere" },
  { value: "blue-hour", label: "Blue Hour", icon: "world", description: "Post-sunset", promptText: "blue hour, post-sunset ambient light, cool blue tones, city lights emerging" },
  { value: "night", label: "Night", icon: "skull", description: "Darkness", promptText: "nighttime, darkness with artificial light sources, mysterious atmosphere, urban glow" },
];

export const WEATHER_OPTIONS: CinematicOption[] = [
  { value: "clear", label: "Clear Sky", icon: "star", description: "Sunny", promptText: "clear sky, sunny weather, bright conditions, defined shadows" },
  { value: "cloudy", label: "Overcast", icon: "circle", description: "Diffused light", promptText: "overcast sky, soft diffused daylight, no harsh shadows, even illumination" },
  { value: "rain", label: "Rain", icon: "world", description: "Wet surfaces", promptText: "rainy weather, wet reflective surfaces, droplets on surfaces, moody atmosphere" },
  { value: "fog", label: "Fog/Mist", icon: "sparkles", description: "Atmospheric", promptText: "foggy misty conditions, atmospheric haze, reduced visibility, mysterious mood" },
  { value: "snow", label: "Snow", icon: "star", description: "Winter", promptText: "snowy conditions, white winter landscape, cold atmosphere, soft reflections" },
  { value: "storm", label: "Storm", icon: "warning", description: "Dramatic sky", promptText: "stormy weather, dramatic dark clouds, dynamic lighting, tension in atmosphere" },
];

export const LOCATION_TYPE_OPTIONS: CinematicOption[] = [
  { value: "urban-street", label: "Urban Street", icon: "location", description: "City environment", promptText: "urban street setting, city environment, concrete and glass, busy backdrop" },
  { value: "urban-alley", label: "Back Alley", icon: "skull", description: "Gritty urban", promptText: "back alley setting, gritty urban environment, graffiti walls, damp atmosphere" },
  { value: "interior-modern", label: "Modern Interior", icon: "scene", description: "Clean design", promptText: "modern interior setting, clean minimalist design, architectural elements" },
  { value: "interior-industrial", label: "Industrial", icon: "world", description: "Raw materials", promptText: "industrial interior, exposed concrete, metal structures, warehouse aesthetic" },
  { value: "interior-domestic", label: "Domestic", icon: "heart", description: "Home setting", promptText: "domestic interior, lived-in home environment, personal space, intimate setting" },
  { value: "nature-forest", label: "Forest", icon: "world", description: "Trees, foliage", promptText: "forest setting, trees and foliage, dappled light through leaves, natural environment" },
  { value: "nature-beach", label: "Beach/Coast", icon: "world", description: "Ocean, sand", promptText: "beach coastal setting, ocean waves, sandy shore, horizon line" },
  { value: "nature-desert", label: "Desert", icon: "flame", description: "Arid landscape", promptText: "desert landscape, arid environment, vast open space, harsh sun" },
  { value: "studio-seamless", label: "Studio Seamless", icon: "circle", description: "Clean backdrop", promptText: "studio setting with seamless backdrop, controlled environment, professional" },
  { value: "studio-textured", label: "Studio Textured", icon: "layers", description: "Backdrop texture", promptText: "studio with textured backdrop, artistic background, professional lighting" },
];

// =====================================================
// VISUAL STYLE OPTIONS
// =====================================================
export const VISUAL_STYLE_OPTIONS: CinematicOption[] = [
  { value: "photorealistic", label: "Photorealistic", icon: "eye", description: "True to life", promptText: "photorealistic, hyper-realistic detail, true to life, indistinguishable from photograph" },
  { value: "cinematic", label: "Cinematic", icon: "scene", description: "Movie-like", promptText: "cinematic style, movie still aesthetic, professional film production quality" },
  { value: "editorial", label: "Editorial", icon: "book", description: "Magazine quality", promptText: "editorial fashion photography, magazine quality, deliberate authorship, published feel" },
  { value: "documentary", label: "Documentary", icon: "eye", description: "Authentic capture", promptText: "documentary style, authentic candid capture, real moment, journalistic approach" },
  { value: "street", label: "Street Photo", icon: "location", description: "Raw urban", promptText: "street photography aesthetic, raw and authentic, urban environment, candid moments" },
  { value: "portrait", label: "Portrait", icon: "character", description: "Subject focus", promptText: "portrait photography, subject-focused, flattering light, connection with viewer" },
  { value: "fashion", label: "Fashion", icon: "star", description: "High fashion", promptText: "high fashion photography, styled and curated, luxury aesthetic, trend-forward" },
  { value: "fine-art", label: "Fine Art", icon: "sparkles", description: "Artistic vision", promptText: "fine art photography, artistic interpretation, conceptual vision, gallery worthy" },
  { value: "snapshot", label: "Snapshot", icon: "circle", description: "Casual authentic", promptText: "casual snapshot aesthetic, imperfect framing, authentic moment, amateur charm" },
  { value: "glamour", label: "Glamour", icon: "star", description: "Beauty focused", promptText: "glamour photography, beauty-focused, perfect skin, idealized presentation" },
];

// =====================================================
// SUBJECT/CHARACTER OPTIONS
// =====================================================
export const SUBJECT_EXPRESSION_OPTIONS: CinematicOption[] = [
  { value: "neutral", label: "Neutral", icon: "circle", description: "No expression", promptText: "neutral facial expression, calm and composed, no performance" },
  { value: "contemplative", label: "Contemplative", icon: "brain", description: "Thoughtful", promptText: "contemplative expression, thoughtful gaze, introspective moment, deep in thought" },
  { value: "intense", label: "Intense", icon: "target", description: "Powerful focus", promptText: "intense expression, powerful focused gaze, commanding presence, determination" },
  { value: "joyful", label: "Joyful", icon: "smile", description: "Happy, bright", promptText: "joyful expression, genuine smile, bright happy mood, positive energy" },
  { value: "mysterious", label: "Mysterious", icon: "eye", description: "Enigmatic", promptText: "mysterious expression, enigmatic gaze, secretive allure, unreadable" },
  { value: "vulnerable", label: "Vulnerable", icon: "heart", description: "Emotional open", promptText: "vulnerable expression, emotionally open, raw authenticity, exposed feelings" },
  { value: "confident", label: "Confident", icon: "star", description: "Self-assured", promptText: "confident expression, self-assured posture, commanding presence" },
  { value: "pensive", label: "Pensive", icon: "brain", description: "Deep thought", promptText: "pensive expression, lost in thought, distant gaze, internal focus" },
];

export const SUBJECT_POSE_OPTIONS: CinematicOption[] = [
  { value: "standing-natural", label: "Standing Natural", icon: "character", description: "Relaxed upright", promptText: "standing in natural relaxed pose, weight shifted, comfortable posture" },
  { value: "standing-power", label: "Power Stance", icon: "shield", description: "Confident", promptText: "power stance, confident posture, shoulders back, commanding presence" },
  { value: "sitting-casual", label: "Sitting Casual", icon: "circle", description: "Relaxed seated", promptText: "casual sitting pose, relaxed and natural, comfortable positioning" },
  { value: "leaning", label: "Leaning", icon: "arrowRight", description: "Against surface", promptText: "leaning against surface, casual attitude, relaxed body language" },
  { value: "walking", label: "Walking/Motion", icon: "arrowRight", description: "Movement", promptText: "captured mid-stride, walking motion, dynamic movement, natural gait" },
  { value: "action", label: "Action Pose", icon: "flame", description: "Dynamic", promptText: "dynamic action pose, movement and energy, decisive moment captured" },
  { value: "candid", label: "Candid Moment", icon: "eye", description: "Unposed", promptText: "candid unposed moment, natural behavior, authentic capture" },
  { value: "profile", label: "Profile View", icon: "character", description: "Side angle", promptText: "profile view, side angle of face, silhouette potential, classical pose" },
];

// =====================================================
// ATMOSPHERE/MOOD OPTIONS (Enhanced)
// =====================================================
export const ATMOSPHERE_OPTIONS: CinematicOption[] = [
  { value: "tension", label: "Tension", icon: "warning", description: "Suspenseful", promptText: "tense atmosphere, suspenseful mood, something about to happen, held breath" },
  { value: "serene", label: "Serene", icon: "heart", description: "Peaceful calm", promptText: "serene peaceful atmosphere, calm and tranquil, meditative quality" },
  { value: "mysterious", label: "Mysterious", icon: "eye", description: "Unknown lurking", promptText: "mysterious atmosphere, secrets hidden, unknown elements, curiosity-inducing" },
  { value: "romantic", label: "Romantic", icon: "heart", description: "Love, intimacy", promptText: "romantic atmosphere, intimate mood, soft and dreamy, emotional connection" },
  { value: "melancholic", label: "Melancholic", icon: "circle", description: "Sad, reflective", promptText: "melancholic atmosphere, sad reflective mood, bittersweet emotion" },
  { value: "ominous", label: "Ominous", icon: "skull", description: "Dark foreboding", promptText: "ominous atmosphere, dark foreboding mood, danger lurking, unsettling" },
  { value: "ethereal", label: "Ethereal", icon: "sparkles", description: "Otherworldly", promptText: "ethereal atmosphere, otherworldly quality, dreamlike and magical" },
  { value: "gritty", label: "Gritty", icon: "flame", description: "Raw, real", promptText: "gritty atmosphere, raw and real, unpolished authenticity, street level" },
  { value: "surreal", label: "Surreal", icon: "wand", description: "Dream-like", promptText: "surreal atmosphere, dream-like quality, reality bending, fantastical elements" },
  { value: "nostalgic", label: "Nostalgic", icon: "history", description: "Memory, past", promptText: "nostalgic atmosphere, memory of the past, wistful longing, timeless quality" },
  { value: "unsettling", label: "Unsettling", icon: "skull", description: "Disturbing calm", promptText: "quietly unsettling atmosphere, something wrong beneath surface, domestic horror" },
  { value: "epic", label: "Epic", icon: "world", description: "Grand scale", promptText: "epic atmosphere, grand scale and scope, momentous, larger than life" },
];

// =====================================================
// IMPERFECTION/REALISM OPTIONS
// =====================================================
export const IMPERFECTION_OPTIONS: CinematicOption[] = [
  { value: "none", label: "Perfect Clean", icon: "sparkles", description: "Polished", promptText: "perfectly clean image, polished professional finish, no imperfections" },
  { value: "lens-dust", label: "Lens Dust", icon: "circle", description: "Dust particles", promptText: "visible lens dust, subtle particles catching light, authentic camera feel" },
  { value: "lens-flare", label: "Lens Flare", icon: "star", description: "Light artifacts", promptText: "natural lens flare, light artifacts from bright sources, cinematic effect" },
  { value: "chromatic", label: "Chromatic Aberration", icon: "eye", description: "Color fringing", promptText: "subtle chromatic aberration, color fringing on high contrast edges, vintage lens character" },
  { value: "vignette", label: "Vignetting", icon: "circle", description: "Dark corners", promptText: "natural vignetting, darker corners, focus drawn to center, vintage lens look" },
  { value: "motion-blur", label: "Motion Blur", icon: "arrowRight", description: "Movement trace", promptText: "subtle motion blur, sense of movement, dynamic capture, imperfect sharp" },
  { value: "soft-focus", label: "Soft Focus", icon: "heart", description: "Dreamy soft", promptText: "soft focus effect, slightly dreamy, diffused detail, romantic quality" },
  { value: "dirty-lens", label: "Dirty Lens", icon: "warning", description: "Smudges, haze", promptText: "dirty lens effect, smudges causing slight haze, authentic and raw" },
];

// =====================================================
// QUICK PRESET COMBINATIONS
// =====================================================
export type QuickPreset = {
  id: string;
  name: string;
  icon: string;
  description: string;
  tooltip: string;
  selections: {
    shotAngle?: string;
    shotFraming?: string;
    focusDepth?: string;
    lightingType?: string;
    lightingDirection?: string;
    lightingQuality?: string;
    cameraType?: string;
    lens?: string;
    filmGrain?: string;
    colorPalette?: string;
    timeOfDay?: string;
    weather?: string;
    locationType?: string;
    visualStyle?: string;
    atmosphere?: string;
    imperfection?: string;
  };
};

export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "cinematic-drama",
    name: "Cinematic Drama",
    icon: "scene",
    description: "Hollywood movie still",
    tooltip: "Cinematic style, 85mm lens, shallow DoF, teal & orange color grading, golden hour, dramatic side lighting, film grain",
    selections: {
      shotAngle: "eye-level",
      shotFraming: "medium-close",
      focusDepth: "shallow",
      lightingType: "golden-hour",
      lightingDirection: "side",
      lightingQuality: "soft",
      cameraType: "cinema",
      lens: "portrait-85",
      filmGrain: "fine",
      colorPalette: "cinematic-teal",
      atmosphere: "tension",
    },
  },
  {
    id: "editorial-fashion",
    name: "Editorial Fashion",
    icon: "star",
    description: "Magazine cover quality",
    tooltip: "Editorial fashion style, direct flash, neutral tones, medium format camera, sharp detail, confident pose",
    selections: {
      shotAngle: "eye-level",
      shotFraming: "full-shot",
      focusDepth: "moderate",
      lightingType: "flash",
      lightingDirection: "front",
      lightingQuality: "hard",
      cameraType: "medium-format",
      lens: "normal-50",
      filmGrain: "none",
      colorPalette: "desaturated",
      visualStyle: "editorial",
    },
  },
  {
    id: "street-documentary",
    name: "Street Documentary",
    icon: "location",
    description: "Raw authentic capture",
    tooltip: "Documentary street style, 35mm lens, urban setting, overcast light, gritty atmosphere, heavy grain, candid moment",
    selections: {
      shotAngle: "eye-level",
      shotFraming: "medium",
      focusDepth: "moderate",
      lightingType: "overcast",
      lightingDirection: "front",
      lightingQuality: "soft",
      cameraType: "film-35mm",
      lens: "normal-35",
      filmGrain: "heavy",
      colorPalette: "desaturated",
      locationType: "urban-street",
      visualStyle: "street",
      atmosphere: "gritty",
      imperfection: "dirty-lens",
    },
  },
  {
    id: "portrait-beauty",
    name: "Portrait Beauty",
    icon: "character",
    description: "Flattering portrait light",
    tooltip: "Classic portrait, 85mm lens, butterfly lighting, shallow DoF, soft quality, warm tones, beautiful bokeh",
    selections: {
      shotAngle: "eye-level",
      shotFraming: "close-up",
      focusDepth: "shallow",
      lightingType: "studio",
      lightingDirection: "butterfly",
      lightingQuality: "soft",
      cameraType: "dslr",
      lens: "portrait-85",
      filmGrain: "none",
      colorPalette: "warm",
      visualStyle: "portrait",
    },
  },
  {
    id: "noir-mystery",
    name: "Film Noir",
    icon: "skull",
    description: "Dark mysterious mood",
    tooltip: "Film noir style, high contrast B&W, hard side lighting, mysterious atmosphere, deep shadows, ominous mood",
    selections: {
      shotAngle: "low-angle",
      shotFraming: "medium",
      focusDepth: "deep",
      lightingType: "mixed",
      lightingDirection: "side",
      lightingQuality: "hard",
      cameraType: "film-35mm",
      lens: "normal-35",
      filmGrain: "medium",
      colorPalette: "noir",
      timeOfDay: "night",
      atmosphere: "mysterious",
    },
  },
  {
    id: "macro-detail",
    name: "Macro Detail",
    icon: "zoomIn",
    description: "Extreme close-up texture",
    tooltip: "Macro photography, 100mm macro lens, extreme close-up, shallow DoF, sharp subject focus, texture emphasis",
    selections: {
      shotFraming: "extreme-close",
      focusDepth: "shallow",
      lightingType: "natural",
      lightingQuality: "soft",
      cameraType: "dslr",
      lens: "macro-100",
      filmGrain: "none",
      colorPalette: "neutral",
      visualStyle: "photorealistic",
    },
  },
  {
    id: "ethereal-dream",
    name: "Ethereal Dream",
    icon: "sparkles",
    description: "Soft dreamy aesthetic",
    tooltip: "Ethereal style, soft focus, golden hour backlight, lens flare, desaturated pastels, romantic atmosphere",
    selections: {
      shotAngle: "eye-level",
      shotFraming: "medium",
      focusDepth: "shallow",
      lightingType: "golden-hour",
      lightingDirection: "back",
      lightingQuality: "soft",
      cameraType: "dslr",
      lens: "portrait-85",
      filmGrain: "fine",
      colorPalette: "desaturated",
      atmosphere: "ethereal",
      imperfection: "lens-flare",
    },
  },
  {
    id: "urban-grit",
    name: "Urban Grit",
    icon: "warning",
    description: "Raw city aesthetic",
    tooltip: "Gritty urban style, wide angle, back alley setting, harsh mixed lighting, heavy grain, unsettling atmosphere",
    selections: {
      shotAngle: "dutch-angle",
      shotFraming: "wide",
      focusDepth: "deep",
      lightingType: "mixed",
      lightingDirection: "side",
      lightingQuality: "hard",
      cameraType: "smartphone",
      lens: "wide-24",
      filmGrain: "heavy",
      colorPalette: "desaturated",
      locationType: "urban-alley",
      atmosphere: "unsettling",
      imperfection: "digital-noise",
    },
  },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================
export function buildCinematicPrompt(selections: {
  shotAngle?: string;
  shotFraming?: string;
  focusDepth?: string;
  lightingType?: string;
  lightingDirection?: string;
  lightingQuality?: string;
  cameraType?: string;
  lens?: string;
  filmGrain?: string;
  colorPalette?: string;
  timeOfDay?: string;
  weather?: string;
  locationType?: string;
  visualStyle?: string;
  subjectExpression?: string;
  subjectPose?: string;
  atmosphere?: string;
  imperfection?: string;
}): string {
  const parts: string[] = [];

  const findPrompt = (options: CinematicOption[], value?: string) => {
    if (!value) return null;
    return options.find(o => o.value === value)?.promptText;
  };

  // Build prompt in logical order
  const visualStyle = findPrompt(VISUAL_STYLE_OPTIONS, selections.visualStyle);
  if (visualStyle) parts.push(visualStyle);

  const shotFraming = findPrompt(SHOT_FRAMING_OPTIONS, selections.shotFraming);
  if (shotFraming) parts.push(shotFraming);

  const shotAngle = findPrompt(SHOT_ANGLE_OPTIONS, selections.shotAngle);
  if (shotAngle) parts.push(shotAngle);

  const focusDepth = findPrompt(FOCUS_DEPTH_OPTIONS, selections.focusDepth);
  if (focusDepth) parts.push(focusDepth);

  const cameraType = findPrompt(CAMERA_TYPE_OPTIONS, selections.cameraType);
  if (cameraType) parts.push(cameraType);

  const lens = findPrompt(LENS_OPTIONS, selections.lens);
  if (lens) parts.push(lens);

  const lightingType = findPrompt(LIGHTING_TYPE_OPTIONS, selections.lightingType);
  if (lightingType) parts.push(lightingType);

  const lightingDirection = findPrompt(LIGHTING_DIRECTION_OPTIONS, selections.lightingDirection);
  if (lightingDirection) parts.push(lightingDirection);

  const lightingQuality = findPrompt(LIGHTING_QUALITY_OPTIONS, selections.lightingQuality);
  if (lightingQuality) parts.push(lightingQuality);

  const colorPalette = findPrompt(COLOR_PALETTE_OPTIONS, selections.colorPalette);
  if (colorPalette) parts.push(colorPalette);

  const filmGrain = findPrompt(FILM_GRAIN_OPTIONS, selections.filmGrain);
  if (filmGrain) parts.push(filmGrain);

  const timeOfDay = findPrompt(TIME_OF_DAY_OPTIONS, selections.timeOfDay);
  if (timeOfDay) parts.push(timeOfDay);

  const weather = findPrompt(WEATHER_OPTIONS, selections.weather);
  if (weather) parts.push(weather);

  const locationType = findPrompt(LOCATION_TYPE_OPTIONS, selections.locationType);
  if (locationType) parts.push(locationType);

  const subjectExpression = findPrompt(SUBJECT_EXPRESSION_OPTIONS, selections.subjectExpression);
  if (subjectExpression) parts.push(subjectExpression);

  const subjectPose = findPrompt(SUBJECT_POSE_OPTIONS, selections.subjectPose);
  if (subjectPose) parts.push(subjectPose);

  const atmosphere = findPrompt(ATMOSPHERE_OPTIONS, selections.atmosphere);
  if (atmosphere) parts.push(atmosphere);

  const imperfection = findPrompt(IMPERFECTION_OPTIONS, selections.imperfection);
  if (imperfection) parts.push(imperfection);

  return parts.join(", ");
}

export function getPresetSelections(presetId: string): QuickPreset["selections"] | null {
  const preset = QUICK_PRESETS.find(p => p.id === presetId);
  return preset?.selections || null;
}
