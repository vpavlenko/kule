import React from "react";
// Assuming data.ts is in the parent directory (e.g., project_root/data.ts and project_root/src/App.tsx)
// Adjust the path if your data.ts is located elsewhere, e.g., './data' if it's in the same src folder.
import { DICTIONARY, COLORS, TEXT } from "./data";

interface TpWordData {
  tp: string;
  en: string;
  color1?: string;
  color2?: string;
}

interface AnnotatedWord {
  originalText: string;
  tpWord: string | null; // This will store the Toki Pona word used for coloring, or null
  color1: string;
  color2: string;
}

// Helper to build a lookup map from Toki Pona terms to their colors
const buildTpColorMap = (
  dictionary: TpWordData[],
  colors: Record<string, string>
): Map<string, { color1: string; color2: string }> => {
  const colorMap: Map<string, { color1: string; color2: string }> = new Map();
  dictionary.forEach((item) => {
    if (item.tp) {
      // Ensure tp word exists
      const c1 = item.color1
        ? colors[item.color1] || colors.white
        : colors.white;
      const c2 = item.color2 ? colors[item.color2] || c1 : c1; // Default color2 to color1 if missing, then to white
      if (!colorMap.has(item.tp)) {
        colorMap.set(item.tp, { color1: c1, color2: c2 });
      }
    }
  });
  return colorMap;
};

// Main transformation logic
const transformText = (
  text: string,
  tpColorMap: Map<string, { color1: string; color2: string }>,
  semanticWordMap: Map<string, string | null>,
  colors: Record<string, string> // For default colors (e.g., for spaces, unmapped words)
): AnnotatedWord[] => {
  const words = text.split(/(\\s+)/); // Split by space, keeping spaces for reconstruction

  return words.map((word) => {
    if (word.trim().length === 0) {
      // This is a space or multiple spaces, preserve it
      return {
        originalText: word,
        tpWord: null,
        color1: colors.black || "#000000", // Default for spaces (no gradient)
        color2: colors.black || "#000000",
      };
    }

    const punctuationRegex = /[.,\\/#!$%\\^&\\*;:{}=\\-_`~()\\?]/g;
    const cleanWord = word.trim().toLowerCase().replace(punctuationRegex, "");
    const semanticTpWord = semanticWordMap.get(cleanWord);

    if (semanticTpWord) {
      // If a semantic Toki Pona word is defined (not null)
      const colorData = tpColorMap.get(semanticTpWord);
      if (colorData) {
        return {
          originalText: word,
          tpWord: semanticTpWord,
          color1: colorData.color1,
          color2: colorData.color2,
        };
      }
    }

    // Default for words not in semanticWordMap, or if semanticTpWord is null,
    // or if the semanticTpWord isn't in tpColorMap (shouldn't happen if DICTIONARY is complete)
    return {
      originalText: word,
      tpWord: null, // No specific Toki Pona mapping for color
      color1: colors.white || "#ffffff", // Default color (e.g., regular text color)
      color2: colors.white || "#ffffff",
    };
  });
};

const App: React.FC = () => {
  // Map from English words (lowercase) in TEXT to the Toki Pona word to be used for color lookup
  // null means the word should not be specially colored (e.g., particles, copulas)
  const semanticWordMap = new Map<string, string | null>([
    ["every", "ale"],
    ["inch", "lili"],
    ["of", null],
    ["my", "mi"],
    ["body", "sijelo"],
    ["is", null],
    ["a", null],
    ["mile", "suli"],
    // "My" is handled by toLowerCase() on cleanWord, so "my" mapping is sufficient
    ["head", "lawa"],
    // "is", null
    // "a", null
    ["prison", "tomo"],
    // "My", "mi"
    ["heart", "pilin"],
    // "is", null
    // "a", null
    ["jungle", "ma"],
    ["i", "mi"],
    ["am", null],
    ["not", "ala"],
    // "a", null
    ["person", "jan"],
    // "I", "mi"
    // "am", null
    // "a", null
    ["monster", "monsuta"],
    // "I", "mi"
    // "am", null
    ["not", "ala"],
    // "a", null
    ["hero", "jan"], // "hero" will be colored based on "jan"
    // "I", "mi"
    // "am", null
    // "a", null
    ["weapon", "utala"],
    // "I", "mi"
    // "am", null
    ["not", "ala"],
    // "a", null
    ["human", "jan"],
    // "I", "mi"
    // "am", null
    // "a", null
    ["problem", "ike"],
  ]);

  const tpColorMap = buildTpColorMap(DICTIONARY, COLORS);
  const annotatedText = transformText(
    TEXT,
    tpColorMap,
    semanticWordMap,
    COLORS
  );

  return (
    <div className="annotated-text-container">
      {annotatedText.map((word, index) => {
        const style: React.CSSProperties = {};
        if (word.tpWord) {
          // Only apply gradient if tpWord is present (i.e., it's a color-mapped word)
          style.backgroundImage = `linear-gradient(to right, ${word.color1}, ${word.color2})`;
          style.color = "transparent";
          style.backgroundClip = "text";
          style.WebkitBackgroundClip = "text";
        }
        // For spaces or unmapped words (where tpWord is null), default browser/CSS text color will apply

        return (
          <span key={index} className="annotated-word" style={style}>
            {word.originalText}
          </span>
        );
      })}
    </div>
  );
};

export default App;
