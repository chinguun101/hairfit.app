// Core hairstyle interface
export interface Hairstyle {
  id: number;
  name: string;
  description: string;
}

// Metadata types for AI-driven recommendations
export type FaceShape = "oval" | "round" | "square" | "heart" | "long" | "diamond";
export type HairTextureType = "straight" | "wavy" | "curly" | "coily";
export type HairLength = "short" | "medium" | "long";
export type BangsType = "none" | "curtain" | "blunt" | "wispy" | "micro";
export type Vibe = "soft" | "clean" | "edgy" | "classic" | "trendy";
export type DensityLevel = "low" | "medium" | "high";

export interface HairstyleMeta {
  id: number;
  length: HairLength;
  textureFocus: HairTextureType | "any";
  volumePlacement: "top" | "mid" | "ends" | "balanced";
  bangs: BangsType;
  edgeLevel: "soft" | "structured" | "choppy";
  colorFamily: "black" | "brown" | "blonde" | "red" | "fantasy" | "multi";
  vibe: Vibe;
  bestForFaceShapes: FaceShape[];
  bestForTextures: HairTextureType[];
  bestForDensity: DensityLevel[];
  riskLevel: "safe" | "spicy";
}

export interface UserHairProfile {
  faceShape: FaceShape;
  texture: HairTextureType;
  density: DensityLevel;
}

// Complete hairstyle library (24 styles)
export const HAIRSTYLES: Hairstyle[] = [
  {
    id: 1,
    name: "Burgundy Blowout with Curtain Bangs",
    description: "Medium-long layers, soft voluminous blowout, curtain bangs, deep burgundy color"
  },
  {
    id: 2,
    name: "Blonde Voluminous Curly Shag",
    description: "Mid-length, big bouncy curls, shag-style layering, root-shadow blonde"
  },
  {
    id: 3,
    name: "Smokey Gray Sleek Layered Blowout",
    description: "Medium length, polished blowout, smooth soft layers, cool smokey gray shade"
  },
  {
    id: 4,
    name: "Black Wet-Look Modern Mullet",
    description: "Short choppy mullet, textured top, slightly longer back, wet-styled finish"
  },
  {
    id: 5,
    name: "Pastel Pink Soft Straight Lob",
    description: "Long bob, minimal layers, middle part, soft pastel pink tone"
  },
  {
    id: 6,
    name: "Natural Black Medium Wolf Cut with Wispy Bangs",
    description: "Hybrid of shag and mullet, medium length, wispy curtain fringe, textured layers"
  },
  {
    id: 7,
    name: "Burgundy Ultra-Straight Long Cut with Blunt Bangs",
    description: "Long sleek length, heavy blunt fringe, uniform burgundy color"
  },
  {
    id: 8,
    name: "Jet Black Short Blunt Bob with Straight Bangs",
    description: "Chin-length bob, sharp one-length cut, blunt bangs, jet black color"
  },
  {
    id: 9,
    name: "Dark Brown Chest-Length Tight Curly Cut",
    description: "Defined tight spirals, chest-length shape, soft face-framing layers, dark chocolate brown"
  },
  {
    id: 10,
    name: "Platinum Blunt Middle-Part Bob",
    description: "Chin/neck length, blunt structured bob, middle part, icy platinum blonde"
  },
  {
    id: 11,
    name: "Black Wavy Shag with Piecey Micro Bangs",
    description: "Mid-length shag, natural waves, piecey micro bangs, inky black color"
  },
  {
    id: 12,
    name: "Burgundy Medium Layered Shag with Curtain Bangs",
    description: "Medium length, shag-style movement, soft curtain bangs, rich burgundy tone"
  },
  {
    id: 13,
    name: "Jet Black Long Straight Cut with Wispy Full Bangs",
    description: "Long straight length, soft full fringe, sleek finish, jet black color"
  },
  {
    id: 14,
    name: "Long Platinum Layers with Soft Face-Framing",
    description: "Long layered cut, soft face-framing pieces, middle part, pearl platinum blonde"
  },
  {
    id: 15,
    name: "Chocolate Brown Layered Lob with Curtain Bangs",
    description: "Shoulder-length lob, light layering for movement, airy curtain bangs, chocolate brown shade"
  },
  {
    id: 16,
    name: "Chestnut C-Shaped Midi Cut with Face-Framing",
    description: "Mid-length C-shaped silhouette, rounded ends, cheekbone-level face-framing, warm chestnut brown"
  },
  {
    id: 17,
    name: "Caramel Balayage Long Waves with Face-Framing",
    description: "Long length, loose waves, bright caramel balayage highlights, soft contouring layers"
  },
  {
    id: 18,
    name: "Dark Brown Curly Round Cut",
    description: "Medium round silhouette for curls, layered to enhance volume, deep dark brown color"
  },
  {
    id: 19,
    name: "Jet Black Long Layered Wolf Cut",
    description: "Long wolf cut, heavy texture through lengths, soft fringe, jet black color"
  },
  {
    id: 20,
    name: "Copper Medium Blunt Cut with Soft Micro Fringe",
    description: "Neck to collarbone blunt cut, ultra-soft micro fringe, bright copper tone"
  },
  {
    id: 21,
    name: "Honey Blonde Face-Framing Long Shag",
    description: "Long shag, heavy face-framing layers, tousled texture, honey blonde highlights"
  },
  {
    id: 22,
    name: "Ash Brown Sleek Long Bob",
    description: "Collarbone-length sleek lob, minimal layers, center part, cool ash brown shade"
  },
  {
    id: 23,
    name: "Black High-Volume Curly Taper",
    description: "High-volume curls on top, tapered sides and back, inky black color"
  },
  {
    id: 24,
    name: "Pastel Split-Dye Wavy Lob",
    description: "Long wavy bob, center part, split-dye pastel colors, soft textured ends"
  }
];

// Metadata for AI-driven hairstyle recommendations
export const HAIRSTYLE_META: Record<number, HairstyleMeta> = {
  1: {
    id: 1,
    length: "long",
    textureFocus: "wavy",
    volumePlacement: "mid",
    bangs: "curtain",
    edgeLevel: "soft",
    colorFamily: "red",
    vibe: "soft",
    bestForFaceShapes: ["oval", "round", "square", "heart"],
    bestForTextures: ["straight", "wavy"],
    bestForDensity: ["medium", "high"],
    riskLevel: "safe"
  },
  2: {
    id: 2,
    length: "medium",
    textureFocus: "curly",
    volumePlacement: "mid",
    bangs: "none",
    edgeLevel: "choppy",
    colorFamily: "blonde",
    vibe: "trendy",
    bestForFaceShapes: ["oval", "heart", "diamond"],
    bestForTextures: ["curly", "wavy"],
    bestForDensity: ["medium", "high"],
    riskLevel: "spicy"
  },
  3: {
    id: 3,
    length: "medium",
    textureFocus: "straight",
    volumePlacement: "ends",
    bangs: "none",
    edgeLevel: "structured",
    colorFamily: "multi",
    vibe: "clean",
    bestForFaceShapes: ["oval", "square", "heart", "long"],
    bestForTextures: ["straight", "wavy"],
    bestForDensity: ["low", "medium", "high"],
    riskLevel: "safe"
  },
  4: {
    id: 4,
    length: "short",
    textureFocus: "wavy",
    volumePlacement: "top",
    bangs: "none",
    edgeLevel: "choppy",
    colorFamily: "black",
    vibe: "edgy",
    bestForFaceShapes: ["oval", "square", "long"],
    bestForTextures: ["straight", "wavy"],
    bestForDensity: ["medium", "high"],
    riskLevel: "spicy"
  },
  5: {
    id: 5,
    length: "medium",
    textureFocus: "straight",
    volumePlacement: "ends",
    bangs: "none",
    edgeLevel: "structured",
    colorFamily: "fantasy",
    vibe: "clean",
    bestForFaceShapes: ["oval", "heart", "square"],
    bestForTextures: ["straight", "wavy"],
    bestForDensity: ["low", "medium"],
    riskLevel: "safe"
  },
  6: {
    id: 6,
    length: "medium",
    textureFocus: "wavy",
    volumePlacement: "mid",
    bangs: "wispy",
    edgeLevel: "choppy",
    colorFamily: "black",
    vibe: "trendy",
    bestForFaceShapes: ["oval", "heart", "diamond"],
    bestForTextures: ["wavy", "straight"],
    bestForDensity: ["medium", "high"],
    riskLevel: "spicy"
  },
  7: {
    id: 7,
    length: "long",
    textureFocus: "straight",
    volumePlacement: "ends",
    bangs: "blunt",
    edgeLevel: "structured",
    colorFamily: "red",
    vibe: "classic",
    bestForFaceShapes: ["oval", "square", "long"],
    bestForTextures: ["straight"],
    bestForDensity: ["low", "medium"],
    riskLevel: "spicy"
  },
  8: {
    id: 8,
    length: "short",
    textureFocus: "straight",
    volumePlacement: "mid",
    bangs: "blunt",
    edgeLevel: "structured",
    colorFamily: "black",
    vibe: "clean",
    bestForFaceShapes: ["oval", "square", "heart"],
    bestForTextures: ["straight"],
    bestForDensity: ["low", "medium"],
    riskLevel: "spicy"
  },
  9: {
    id: 9,
    length: "long",
    textureFocus: "curly",
    volumePlacement: "mid",
    bangs: "none",
    edgeLevel: "soft",
    colorFamily: "brown",
    vibe: "soft",
    bestForFaceShapes: ["oval", "heart", "diamond"],
    bestForTextures: ["curly"],
    bestForDensity: ["medium", "high"],
    riskLevel: "safe"
  },
  10: {
    id: 10,
    length: "short",
    textureFocus: "straight",
    volumePlacement: "mid",
    bangs: "none",
    edgeLevel: "structured",
    colorFamily: "blonde",
    vibe: "clean",
    bestForFaceShapes: ["oval", "square", "heart"],
    bestForTextures: ["straight", "wavy"],
    bestForDensity: ["low", "medium"],
    riskLevel: "safe"
  },
  11: {
    id: 11,
    length: "medium",
    textureFocus: "wavy",
    volumePlacement: "mid",
    bangs: "micro",
    edgeLevel: "choppy",
    colorFamily: "black",
    vibe: "edgy",
    bestForFaceShapes: ["oval", "heart", "diamond"],
    bestForTextures: ["wavy", "straight"],
    bestForDensity: ["medium", "high"],
    riskLevel: "spicy"
  },
  12: {
    id: 12,
    length: "medium",
    textureFocus: "wavy",
    volumePlacement: "mid",
    bangs: "curtain",
    edgeLevel: "choppy",
    colorFamily: "red",
    vibe: "trendy",
    bestForFaceShapes: ["oval", "round", "heart"],
    bestForTextures: ["wavy", "straight"],
    bestForDensity: ["medium", "high"],
    riskLevel: "safe"
  },
  13: {
    id: 13,
    length: "long",
    textureFocus: "straight",
    volumePlacement: "ends",
    bangs: "wispy",
    edgeLevel: "soft",
    colorFamily: "black",
    vibe: "soft",
    bestForFaceShapes: ["oval", "square", "heart", "long"],
    bestForTextures: ["straight"],
    bestForDensity: ["low", "medium"],
    riskLevel: "safe"
  },
  14: {
    id: 14,
    length: "long",
    textureFocus: "wavy",
    volumePlacement: "ends",
    bangs: "none",
    edgeLevel: "soft",
    colorFamily: "blonde",
    vibe: "classic",
    bestForFaceShapes: ["oval", "heart", "square"],
    bestForTextures: ["wavy", "straight"],
    bestForDensity: ["medium", "high"],
    riskLevel: "safe"
  },
  15: {
    id: 15,
    length: "medium",
    textureFocus: "wavy",
    volumePlacement: "mid",
    bangs: "curtain",
    edgeLevel: "soft",
    colorFamily: "brown",
    vibe: "soft",
    bestForFaceShapes: ["oval", "round", "heart"],
    bestForTextures: ["wavy", "straight"],
    bestForDensity: ["low", "medium", "high"],
    riskLevel: "safe"
  },
  16: {
    id: 16,
    length: "medium",
    textureFocus: "straight",
    volumePlacement: "ends",
    bangs: "none",
    edgeLevel: "soft",
    colorFamily: "brown",
    vibe: "classic",
    bestForFaceShapes: ["oval", "square", "heart", "long"],
    bestForTextures: ["straight", "wavy"],
    bestForDensity: ["low", "medium", "high"],
    riskLevel: "safe"
  },
  17: {
    id: 17,
    length: "long",
    textureFocus: "wavy",
    volumePlacement: "mid",
    bangs: "none",
    edgeLevel: "soft",
    colorFamily: "multi",
    vibe: "soft",
    bestForFaceShapes: ["oval", "heart", "square"],
    bestForTextures: ["wavy", "straight"],
    bestForDensity: ["medium", "high"],
    riskLevel: "safe"
  },
  18: {
    id: 18,
    length: "medium",
    textureFocus: "curly",
    volumePlacement: "mid",
    bangs: "none",
    edgeLevel: "soft",
    colorFamily: "brown",
    vibe: "soft",
    bestForFaceShapes: ["oval", "round", "heart", "diamond"],
    bestForTextures: ["curly"],
    bestForDensity: ["medium", "high"],
    riskLevel: "safe"
  },
  19: {
    id: 19,
    length: "long",
    textureFocus: "wavy",
    volumePlacement: "mid",
    bangs: "wispy",
    edgeLevel: "choppy",
    colorFamily: "black",
    vibe: "edgy",
    bestForFaceShapes: ["oval", "heart", "long"],
    bestForTextures: ["wavy", "straight"],
    bestForDensity: ["medium", "high"],
    riskLevel: "spicy"
  },
  20: {
    id: 20,
    length: "medium",
    textureFocus: "straight",
    volumePlacement: "mid",
    bangs: "micro",
    edgeLevel: "structured",
    colorFamily: "red",
    vibe: "trendy",
    bestForFaceShapes: ["oval", "square", "heart"],
    bestForTextures: ["straight", "wavy"],
    bestForDensity: ["low", "medium"],
    riskLevel: "spicy"
  },
  21: {
    id: 21,
    length: "long",
    textureFocus: "wavy",
    volumePlacement: "mid",
    bangs: "none",
    edgeLevel: "choppy",
    colorFamily: "blonde",
    vibe: "trendy",
    bestForFaceShapes: ["oval", "heart", "diamond"],
    bestForTextures: ["wavy"],
    bestForDensity: ["medium", "high"],
    riskLevel: "spicy"
  },
  22: {
    id: 22,
    length: "medium",
    textureFocus: "straight",
    volumePlacement: "ends",
    bangs: "none",
    edgeLevel: "structured",
    colorFamily: "brown",
    vibe: "clean",
    bestForFaceShapes: ["oval", "square", "heart", "long"],
    bestForTextures: ["straight", "wavy"],
    bestForDensity: ["low", "medium", "high"],
    riskLevel: "safe"
  },
  23: {
    id: 23,
    length: "short",
    textureFocus: "curly",
    volumePlacement: "top",
    bangs: "none",
    edgeLevel: "choppy",
    colorFamily: "black",
    vibe: "edgy",
    bestForFaceShapes: ["oval", "square", "heart", "diamond"],
    bestForTextures: ["curly", "coily"],
    bestForDensity: ["medium", "high"],
    riskLevel: "spicy"
  },
  24: {
    id: 24,
    length: "medium",
    textureFocus: "wavy",
    volumePlacement: "mid",
    bangs: "none",
    edgeLevel: "choppy",
    colorFamily: "fantasy",
    vibe: "trendy",
    bestForFaceShapes: ["oval", "heart"],
    bestForTextures: ["wavy", "straight"],
    bestForDensity: ["low", "medium"],
    riskLevel: "spicy"
  }
};

// Scoring function to match hairstyles to user profile
function scoreHairstyle(meta: HairstyleMeta, user: UserHairProfile): number {
  let score = 0;
  
  // Face shape match (highest weight)
  if (meta.bestForFaceShapes.includes(user.faceShape)) score += 3;
  
  // Texture match (important for realism)
  if (meta.bestForTextures.includes(user.texture)) score += 2;
  
  // Density realism
  if (meta.bestForDensity.includes(user.density)) score += 1;
  
  // Safe styles get a small default bonus so results aren't all extreme
  if (meta.riskLevel === "safe") score += 0.5;
  
  return score;
}

// Pick top N hairstyles based on user profile
export function pickTopHairstyles(user: UserHairProfile, limit = 10): Hairstyle[] {
  return HAIRSTYLES
    .map(style => {
      const meta = HAIRSTYLE_META[style.id];
      return {
        style,
        score: meta ? scoreHairstyle(meta, user) : 0
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(entry => entry.style);
}

