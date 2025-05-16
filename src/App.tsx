import React, { useEffect, useState, useMemo } from "react";
import styled, { ThemeProvider } from "styled-components"; // Import styled-components and ThemeProvider
// Assuming data.ts is in the parent directory (e.g., project_root/data.ts and project_root/src/App.tsx)
// Adjust the path if your data.ts is located elsewhere, e.g., './data' if it's in the same src folder.
import {
  DICTIONARY,
  COLORS,
  TEXT,
  PRIMAL_COLOR_TERMS,
  UKRAINIAN_TEXT,
  UKRAINIAN_WORD_TP_MAP,
  SPANISH_TEXT, // Added for Spanish
  SPANISH_WORD_TP_MAP, // Added for Spanish
} from "./data";
// import yaml from "js-yaml";

// Theme definitions
const lightTheme = {
  baseBackground: "#ffffff",
  baseText: "#000000",
  spaceColor: "#ffffff",
  punctuationColor: "#000000",
  tooltipBackground: "#ffffff",
  tooltipText: "#000000",
  tooltipBorder: "#cccccc",
  semanticDefaultText: "#000000",
  columnBorder: "#dddddd",
};

const darkTheme = {
  baseBackground: "#000000",
  baseText: "#ffffff",
  spaceColor: "#000000",
  punctuationColor: "#ffffff",
  tooltipBackground: "#000000",
  tooltipText: "#ffffff",
  tooltipBorder: "#555555",
  semanticDefaultText: "#bbbbbb",
  columnBorder: "#444444",
};

export type AppTheme = typeof lightTheme; // Exporting Theme type for use in functions

interface LetterSegment {
  text: string; // Should now be a single character
  color: string; // The color for this character
  isTokiPonaColored: boolean;
  tpDefinition?: string[];
}

// Define Segment interface here
interface Segment {
  text: string; // Should now be a single character
  color: string;
}

interface AnnotatedWord {
  originalText: string;
  segments: LetterSegment[];
  tpDefinition?: string[];
}

// Add PrimalSegment interface
interface PrimalSegment {
  text: string;
  color?: string; // Color for this segment, defaults to theme.baseText if undefined
}

// Styled Components Definitions
const AppContainer = styled.div<{ fontFamily: string; fontWeight: string }>`
  background-color: ${(props) => props.theme.baseBackground};
  color: ${(props) => props.theme.baseText};
  font-family: ${(props) => props.fontFamily};
  font-weight: ${(props) => props.fontWeight};
  margin: 0;
  padding: 20px;
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease; // Smooth transition for theme change
`;

const TextColumnsContainer = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap; // Allow columns to wrap on smaller screens
  justify-content: center; // Center columns if they wrap
`;

const TextColumn = styled.div`
  flex: 1 1 auto; // Allow shrinking and growing, with a base of auto
  min-width: 300px; // Minimum width before wrapping or becoming too small
  max-width: 600px; // Max width as requested
  font-size: 18px;
  line-height: 1.6;
  padding: 15px;
  border: 1px solid ${(props) => props.theme.columnBorder};
  border-radius: 5px;
  /* background-color is inherited */
  /* font-family is inherited */
  color: ${(props) =>
    props.theme.baseText}; // Ensure text color contrasts with background
`;

const TextParagraph = styled.p`
  white-space: pre-wrap;
  color: ${(props) =>
    props.theme.baseText}; // Ensure paragraph text uses base text color
`;

const TooltipContainer = styled.div`
  position: fixed;
  background-color: ${(props) => props.theme.tooltipBackground};
  color: ${(props) => props.theme.tooltipText};
  border: 1px solid ${(props) => props.theme.tooltipBorder};
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  z-index: 1000;
  pointer-events: none; // Important so it doesn't interfere with mouse events on text
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  max-width: 300px;
`;

const TogglePanel = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 10px;
  background-color: rgba(128, 128, 128, 0.5); // Semi-transparent background
  border-radius: 5px;
  z-index: 2000; // Above tooltips
  display: flex;
  flex-direction: column;
  gap: 8px;

  button {
    padding: 8px 12px;
    border: 1px solid #ccc;
    background-color: #f0f0f0;
    color: #333;
    cursor: pointer;
    border-radius: 3px;
    &:hover {
      background-color: #e0e0e0;
    }
  }
`;

// Helper to build a lookup map from Toki Pona terms to their colors
const buildTpColorMap = (
  dictionary: typeof DICTIONARY,
  colorsMap: typeof COLORS // Renamed to avoid confusion with global COLORS import
): Map<string, { color1: string; color2: string }> => {
  const map = new Map<string, { color1: string; color2: string }>();
  dictionary.forEach((entry) => {
    const c1 = entry.color1 as keyof typeof COLORS | undefined;
    const c2 = entry.color2 as keyof typeof COLORS | undefined;

    if (c1 && c2 && colorsMap[c1] && colorsMap[c2]) {
      map.set(entry.tp, {
        color1: colorsMap[c1],
        color2: colorsMap[c2],
      });
    } else if (c1 && colorsMap[c1]) {
      map.set(entry.tp, {
        color1: colorsMap[c1],
        color2: colorsMap[c1], // Fallback to color1 if color2 is not defined
      });
    }
    // Tp words in DICTIONARY but without color1/color2 will not be added to tpColorMap
    // and will default to white when rendering if a definition uses them.
  });
  return map;
};

// This map will hold our static, hard-coded definitions for specific words.
// Words are keys (lowercase, punctuation stripped), values are arrays of TP words.
const staticWordToTpDefinitionMap = new Map<string, string[]>([
  ["every", ["ale"]],
  ["inch", ["lili"]],
  ["wall", ["supa"]], // or ["palisa", "sike"] - boundary made of sticks
  ["space", ["kon"]], // or ["insa"] - inside/internal space
  ["covered", ["len"]], // len - layer/cloth
  ["bookcase", ["poki", "lipu"]], // container for books
  ["each", ["wan"]], // one by one
  ["has", ["jo"]], // to have
  ["six", ["luka", "wan"]], // 5+1 (luka can mean 5)
  ["shelves", ["supa", "palisa"]], // surfaces made of sticks/boards
  ["going", ["tawa"]],
  ["almost", ["seme", "lili"]], // like 'a little bit how/what', meaning close
  ["ceiling", ["sewi", "supa"]], // upper surface
  ["some", ["mute", "lili"]], // 'a few many' -> some
  ["bookshelves", ["poki", "lipu", "supa"]], // container for books, on surfaces
  ["are", []], // copula, often not directly translated or implied
  ["stacked", ["poka", "mute"]], // many besides/on top of each other
  ["brim", ["sewi", "open"]], // top opening
  ["with", ["poka"]], // alongside
  ["hardback", ["kiwen", "lipu"]], // hard book
  ["books", ["lipu"]],
  ["science", ["sona"]],
  ["maths", ["nanpa"]],
  ["history", ["sona", "tenpo", "pini"]], // knowledge of past time
  ["everything", ["ijo", "ale"]], // all things
  ["else", ["ante"]], // different/other
  ["other", ["ante"]],
  ["have", ["jo"]],
  ["two", ["tu"]],
  ["layers", ["len", "mute"]], // many layers
  ["paperback", ["lipu", "lili"]], // small/light book
  ["fiction", ["toki", "nasa"]], // strange/imaginary talk/story
  ["back", ["poka", "monsi"]], // rear side
  ["layer", ["len"]],
  ["propped", ["awen", "sewi"]], // kept up
  ["up", ["sewi"]],
  ["old", ["tenpo", "mute"]], // many times (aged)
  ["tissue", ["lipu", "ko"]], // squishy paper
  ["boxes", ["poki"]],
  ["lengths", ["linja", "mute"]], // many long things
  ["wood", ["kasi"]], // plant material
  ["see", ["lukin"]],
  ["above", ["sewi"]],
  ["front", ["sinpin"]], // face/front
  ["still", ["awen"]], // continues
  ["isnt", ["ala"]], // "isn't" cleaned
  ["enough", ["pona", "mute"]], // 'enough good' -> sufficient
  ["overflowing", ["tawa", "selo"]], // moving to the outside
  ["onto", ["sewi"]], // on top of
  ["tables", ["supa"]], // surfaces
  ["sofas", ["supa", "lape"]], // sleep surfaces
  ["making", ["pali"]], // doing/making
  ["little", ["lili"]],
  ["heaps", ["kulupu", "mute"]], // many groups/piles
  ["under", ["anpa"]], // below
  ["windows", ["lupa", "lukin"]], // see-holes
  // Add more definitions as needed based on TEXT
]);

/*
interface ParsedDictionaryEntry {
  tp: string;
  definitions: string[];
}
*/

// Function to generate tooltip text using PRIMAL_COLOR_TERMS
const generatePrimalTooltipText = (
  tpWord: string,
  primalColorTerms: Record<string, string>,
  dictionary: typeof DICTIONARY,
  appColors: typeof COLORS, // Added appColors for direct access
  theme: AppTheme
): PrimalSegment[] => {
  const wordEntry = dictionary.find((entry) => entry.tp === tpWord);
  const finalSegments: PrimalSegment[] = [];

  if (!wordEntry || (!wordEntry.color1 && !wordEntry.color2)) {
    // If word not in DICTIONARY, or no colors defined for it,
    // return empty segments for the primal part.
    // The English definition part is handled by the caller.
    return [];
  }

  const parts: { term?: string; colorName?: string; actualColor?: string }[] =
    [];

  if (wordEntry.color1) {
    parts.push({
      term: primalColorTerms[wordEntry.color1],
      colorName: wordEntry.color1,
      actualColor: appColors[wordEntry.color1 as keyof typeof appColors],
    });
  }
  if (wordEntry.color2) {
    // If color2 is same as color1, and primal terms are built from color1+color2,
    // we still want to represent it if distinct, or if it's the only color.
    parts.push({
      term: primalColorTerms[wordEntry.color2],
      colorName: wordEntry.color2,
      actualColor: appColors[wordEntry.color2 as keyof typeof appColors],
    });
  }

  // Handle cases where a word might only have one color defined (e.g. color1 but no color2)
  // Or if color1 and color2 are the same. The current logic pushes both to `parts`.
  // For "mute" (color1: 'mute', color2: 'mute'), `parts` will have two identical entries.

  let firstPartRendered = false;
  if (parts.length > 0) {
    const part1 = parts[0];
    if (part1.term && part1.actualColor) {
      finalSegments.push({ text: part1.term, color: part1.actualColor });
      firstPartRendered = true;
    } else if (part1.term) {
      finalSegments.push({
        text: `${part1.term}(?)`,
        color: theme.semanticDefaultText,
      });
      firstPartRendered = true;
    } else if (part1.colorName) {
      finalSegments.push({
        text: `${part1.colorName}(?)`,
        color: theme.semanticDefaultText,
      });
      firstPartRendered = true;
    }

    if (parts.length > 1) {
      const part2 = parts[1];
      // Add " + " if the first part was rendered and a second part (term or colorName) exists
      if (firstPartRendered && (part2.term || part2.colorName)) {
        finalSegments.push({
          text: " + ",
          color: theme.semanticDefaultText,
        });
      }

      if (part2.term && part2.actualColor) {
        finalSegments.push({ text: part2.term, color: part2.actualColor });
      } else if (part2.term) {
        finalSegments.push({
          text: `${part2.term}(?)`,
          color: theme.semanticDefaultText,
        });
      } else if (part2.colorName) {
        finalSegments.push({
          text: `${part2.colorName}(?)`,
          color: theme.semanticDefaultText,
        });
      }
    } else if (parts.length === 1 && !wordEntry.color2 && wordEntry.color1) {
      // If only color1 is defined, we don't need a " + " or a second part.
      // The current logic correctly handles this by not entering the `if (parts.length > 1)` block.
    }
  }
  return finalSegments;
};

const transformText = (
  text: string,
  tpColorMap: Map<string, { color1: string; color2: string }>,
  staticDefMap: Map<string, string[]>,
  theme: AppTheme
): AnnotatedWord[] => {
  const words = text.split(/(\s+)/);
  // const punctuationRegex = /^[.,/#!$%^&*;:{}=\-_`~()?]+$/; // Not directly used in final logic
  const wordCharRegex = /[a-zA-Z0-9\']/;

  return words.map((originalWord) => {
    if (originalWord.trim().length === 0) {
      // Handle pure whitespace words (spaces, newlines, tabs)
      const spaceSegments: LetterSegment[] = [];
      for (let i = 0; i < originalWord.length; i++) {
        spaceSegments.push({
          text: originalWord[i],
          color: theme.spaceColor, // Spaces use theme's space color
          isTokiPonaColored: false,
        });
      }
      return {
        originalText: originalWord,
        segments: spaceSegments,
      };
    }

    const cleanWordForLookup = originalWord
      .trim()
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "");

    const currentTpDefinition = staticDefMap.get(cleanWordForLookup);
    const segments: LetterSegment[] = [];

    if (
      currentTpDefinition &&
      currentTpDefinition.length > 0 &&
      cleanWordForLookup.length > 0
    ) {
      let currentTpWordIndex = 0;
      let charBuffer = "";

      const processBuffer = (buffer: string, defIdx: number) => {
        let updatedTpIdx = defIdx;
        for (let j = 0; j < buffer.length; j += 2) {
          const engChar1 = buffer[j];
          const engChar2 = j + 1 < buffer.length ? buffer[j + 1] : null;

          if (updatedTpIdx < currentTpDefinition.length) {
            const tpWord = currentTpDefinition[updatedTpIdx];
            const colorData = tpColorMap.get(tpWord);
            if (colorData) {
              segments.push({
                text: engChar1,
                color: colorData.color1,
                isTokiPonaColored: true,
              });
              if (engChar2) {
                segments.push({
                  text: engChar2,
                  color: colorData.color2,
                  isTokiPonaColored: true,
                });
              }
            } else {
              // TP word from definition not in tpColorMap (e.g. 'ala')
              segments.push({
                text: engChar1,
                color: theme.semanticDefaultText,
                isTokiPonaColored: true,
              });
              if (engChar2) {
                segments.push({
                  text: engChar2,
                  color: theme.semanticDefaultText,
                  isTokiPonaColored: true,
                });
              }
            }
            updatedTpIdx++;
          } else {
            // Ran out of TP definition words for the English word characters
            segments.push({
              text: engChar1,
              color: theme.baseText,
              isTokiPonaColored: false,
            });
            if (engChar2) {
              segments.push({
                text: engChar2,
                color: theme.baseText,
                isTokiPonaColored: false,
              });
            }
          }
        }
        return updatedTpIdx;
      };

      for (let i = 0; i < originalWord.length; i++) {
        const char = originalWord[i];
        if (wordCharRegex.test(char)) {
          charBuffer += char;
        } else {
          if (charBuffer.length > 0) {
            currentTpWordIndex = processBuffer(charBuffer, currentTpWordIndex);
            charBuffer = "";
          }
          segments.push({
            text: char, // Punctuation
            color: theme.punctuationColor,
            isTokiPonaColored: false,
          });
        }
      }
      if (charBuffer.length > 0) {
        currentTpWordIndex = processBuffer(charBuffer, currentTpWordIndex);
      }
    } else {
      // Word not in staticDefMap, definition is empty, or it's an empty cleanWord (e.g. only punctuation)
      // Color whole originalWord char by char with baseText (or spaceColor for spaces within)
      for (let i = 0; i < originalWord.length; i++) {
        const char = originalWord[i];
        segments.push({
          text: char,
          color: wordCharRegex.test(char)
            ? theme.baseText
            : char.trim().length === 0
            ? theme.spaceColor
            : theme.punctuationColor, // Treat non-word chars as punctuation
          isTokiPonaColored: false,
        });
      }
    }
    return {
      originalText: originalWord,
      segments,
      tpDefinition: currentTpDefinition,
    };
  });
};

// Helper function to clean Ukrainian words for map lookup
function cleanUkrainianWordForKey(originalWord: string): string {
  // First, remove common trailing punctuation to get the "base" word
  let word = originalWord.replace(/[.,:;!?]$/, "");
  // Then, convert to lowercase and remove specific characters like 'ʼ' (apostrophe) and '-'
  word = word.toLowerCase().replace(/ʼ/g, "").replace(/-/g, "");
  return word;
}

function getUkrainianWordColorSegments( // This function is generic for any language map
  wordPartToColor: string,
  tpDefinitionForWord: string[] | undefined,
  currentDictionary: typeof DICTIONARY,
  currentColors: typeof COLORS, // Keep COLORS here as it's about specific TP color mapping
  theme: AppTheme
): Segment[] {
  const segments: Segment[] = [];
  const defaultSegmentColor = theme.baseText; // Default for uncolored parts of words
  const spaceSegmentColor = theme.spaceColor;

  if (wordPartToColor.trim().length === 0) {
    // Handle if an empty or space string is passed
    for (let i = 0; i < wordPartToColor.length; i++) {
      segments.push({ text: wordPartToColor[i], color: spaceSegmentColor });
    }
    return segments;
  }

  const tpDefinition = tpDefinitionForWord;

  if (!tpDefinition || tpDefinition.length === 0) {
    // No definition found, color word with default segment color (char by char)
    for (let i = 0; i < wordPartToColor.length; i++) {
      segments.push({ text: wordPartToColor[i], color: defaultSegmentColor });
    }
    return segments;
  }

  const N = wordPartToColor.length;
  // The rule is ceil(N/2) TP words for N letters, meaning each TP word colors up to 2 letters.
  // maxTpWordsToUse is the number of TP words we'll iterate through from the definition.
  const maxTpWordsToUse = Math.ceil(N / 2);

  let letterIndex = 0;
  for (let i = 0; i < maxTpWordsToUse && letterIndex < N; i++) {
    const currentTpWord = tpDefinition[i]; // tpDefinition could be shorter than maxTpWordsToUse
    let colorForChar1 = defaultSegmentColor;
    let colorForChar2 = defaultSegmentColor;

    if (currentTpWord) {
      const dictEntry = currentDictionary.find((d) => d.tp === currentTpWord);
      if (dictEntry && dictEntry.color1 && dictEntry.color2) {
        colorForChar1 =
          currentColors[dictEntry.color1 as keyof typeof currentColors] ||
          theme.semanticDefaultText; // Use semantic default if color name valid but hex missing
        colorForChar2 =
          currentColors[dictEntry.color2 as keyof typeof currentColors] ||
          theme.semanticDefaultText;
      } else if (dictEntry && dictEntry.color1) {
        // Fallback if only color1 defined
        colorForChar1 =
          currentColors[dictEntry.color1 as keyof typeof currentColors] ||
          theme.semanticDefaultText;
        colorForChar2 = colorForChar1; // Use color1 for both if color2 missing
      } else {
        // Fallback if TP word not in DICTIONARY or no colors defined
        // Use semantic default for TP words that are supposed to be colored but lack definition in COLORS
        const fallbackDictEntry = currentDictionary.find((d) => d.tp === "ala"); // Example: 'ala' might not have colors in DICTIONARY itself but could be in tpColorMap
        if (
          fallbackDictEntry &&
          fallbackDictEntry.color1 &&
          fallbackDictEntry.color2 &&
          currentColors[
            fallbackDictEntry.color1 as keyof typeof currentColors
          ] &&
          currentColors[fallbackDictEntry.color2 as keyof typeof currentColors]
        ) {
          colorForChar1 =
            currentColors[
              fallbackDictEntry.color1 as keyof typeof currentColors
            ];
          colorForChar2 =
            currentColors[
              fallbackDictEntry.color2 as keyof typeof currentColors
            ];
        } else {
          colorForChar1 = theme.semanticDefaultText;
          colorForChar2 = theme.semanticDefaultText;
        }
      }
    }

    // Color one or two letters of the wordPartToColor
    const char1 = wordPartToColor[letterIndex];
    if (char1) {
      segments.push({ text: char1, color: colorForChar1 });
    }
    letterIndex++;

    if (letterIndex < N) {
      const char2 = wordPartToColor[letterIndex];
      if (char2) {
        segments.push({ text: char2, color: colorForChar2 });
      }
      letterIndex++;
    }
  }

  // Any remaining letters are colored with default segment color
  while (letterIndex < N) {
    segments.push({
      text: wordPartToColor[letterIndex],
      color: defaultSegmentColor,
    });
    letterIndex++;
  }
  return segments;
}

// transformNonEnglishText: Generic function for Ukrainian, Spanish, etc.
const transformNonEnglishText = (
  text: string,
  wordMap: Record<string, string[]>, // Generic: UKRAINIAN_WORD_TP_MAP or SPANISH_WORD_TP_MAP
  dictionary: typeof DICTIONARY,
  colors: typeof COLORS, // Keep COLORS for TP color mapping
  cleaningFunction: (word: string) => string, // Pass the specific cleaning function
  theme: AppTheme
): AnnotatedWord[] => {
  const words = text.split(/(\s+)/); // Split by space, keeping spaces

  return words.map((originalWordWithPunctuation) => {
    if (
      originalWordWithPunctuation.match(/^\s+$/) ||
      originalWordWithPunctuation === ""
    ) {
      // Handle pure whitespace words by creating segments for each char
      const spaceSegments: LetterSegment[] = [];
      for (let i = 0; i < originalWordWithPunctuation.length; i++) {
        spaceSegments.push({
          text: originalWordWithPunctuation[i],
          color: theme.spaceColor,
          isTokiPonaColored: false,
        });
      }
      return {
        originalText: originalWordWithPunctuation,
        segments: spaceSegments,
      };
    }

    // Standardize punctuation splitting for all non-English languages
    const punctuationMatch = originalWordWithPunctuation.match(/([.,:;!?]+)$/);
    let punctuation = "";
    let wordPart = originalWordWithPunctuation;

    if (punctuationMatch) {
      punctuation = punctuationMatch[0];
      wordPart = originalWordWithPunctuation.substring(
        0,
        originalWordWithPunctuation.length - punctuation.length
      );
    }

    const cleanedKey = cleaningFunction(wordPart); // Use passed cleaning function
    const tpDefinition = wordMap[cleanedKey]; // This is string[] | undefined

    const visualSegments = getUkrainianWordColorSegments(
      // Renaming this function might be good, but it's generic
      wordPart,
      tpDefinition,
      dictionary,
      colors,
      theme
    );

    const letterSegments: LetterSegment[] = visualSegments.map((vs) => ({
      text: vs.text,
      color: vs.color,
      isTokiPonaColored: !!tpDefinition && tpDefinition.length > 0, // Mark true if definition existed
    }));

    if (punctuation) {
      // Add punctuation with its own color
      for (const puncChar of punctuation) {
        letterSegments.push({
          text: puncChar,
          color: theme.punctuationColor,
          isTokiPonaColored: false,
        });
      }
    }

    return {
      originalText: originalWordWithPunctuation,
      segments: letterSegments,
      tpDefinition: tpDefinition, // Store the found TP definition for the tooltip
    };
  });
};

// Helper function to clean Spanish words for map lookup
function cleanSpanishWordForKey(originalWord: string): string {
  let word = originalWord.replace(/[.,:;!?¿¡]$/g, ""); // Added Spanish punctuation
  word = word.toLowerCase().replace(/[-]/g, ""); // Keep accents for now, remove hyphens
  // Further Spanish-specific cleaning can be added (e.g., normalize accents if keys don't have them)
  return word;
}

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Default to dark mode (#000 background)
  const [currentFontWeight, setCurrentFontWeight] = useState<"normal" | "bold">(
    "normal"
  );
  const [currentFontFamily, setCurrentFontFamily] = useState<
    "sans-serif" | "serif" | "monospace"
  >("sans-serif");

  const [englishAnnotatedText, setEnglishAnnotatedText] = useState<
    AnnotatedWord[]
  >([]);
  const [ukrainianAnnotatedText, setUkrainianAnnotatedText] = useState<
    AnnotatedWord[]
  >([]);
  const [spanishAnnotatedText, setSpanishAnnotatedText] = useState<
    AnnotatedWord[]
  >([]); // Added for Spanish
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [tooltipContent, setTooltipContent] = useState<JSX.Element | null>(
    null
  );
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const tpColorMap = React.useMemo(
    () => buildTpColorMap(DICTIONARY, COLORS),
    []
  );

  const selectedTheme = useMemo(
    () => (isDarkMode ? darkTheme : lightTheme),
    [isDarkMode]
  );

  useEffect(() => {
    setEnglishAnnotatedText(
      transformText(
        TEXT,
        tpColorMap,
        staticWordToTpDefinitionMap,
        selectedTheme
      )
    );
    setUkrainianAnnotatedText(
      transformNonEnglishText(
        UKRAINIAN_TEXT,
        UKRAINIAN_WORD_TP_MAP,
        DICTIONARY,
        COLORS,
        cleanUkrainianWordForKey,
        selectedTheme
      )
    );
    setSpanishAnnotatedText(
      transformNonEnglishText(
        SPANISH_TEXT,
        SPANISH_WORD_TP_MAP,
        DICTIONARY,
        COLORS,
        cleanSpanishWordForKey,
        selectedTheme
      )
    );
  }, [tpColorMap, selectedTheme]); // Depend on selectedTheme (which depends on isDarkMode)

  const handleWordMouseEnter = (
    event: React.MouseEvent<HTMLSpanElement>,
    word: AnnotatedWord
  ) => {
    if (word.tpDefinition && word.tpDefinition.length > 0) {
      const content = (
        <div style={{ textAlign: "left" }}>
          {word.tpDefinition.map((tpWord, index) => {
            const colorData = tpColorMap.get(tpWord);
            const wordEntry = DICTIONARY.find((entry) => entry.tp === tpWord);

            const tpWordSpans: JSX.Element[] = [];
            if (tpWord.length > 0) {
              tpWordSpans.push(
                <span
                  key={`${index}-char0`}
                  style={{
                    color: colorData
                      ? colorData.color1
                      : selectedTheme.semanticDefaultText,
                  }}
                >
                  {tpWord[0]}
                </span>
              );
              if (tpWord.length > 1) {
                tpWordSpans.push(
                  <span
                    key={`${index}-char1`}
                    style={{
                      color: colorData
                        ? colorData.color2
                        : selectedTheme.semanticDefaultText,
                    }}
                  >
                    {tpWord[1]}
                  </span>
                );
              }
              if (tpWord.length > 2) {
                tpWordSpans.push(
                  <span
                    key={`${index}-charRest`}
                    style={{ color: selectedTheme.semanticDefaultText }}
                  >
                    {tpWord.substring(2)}
                  </span>
                );
              }
            } else {
              tpWordSpans.push(<span key={`${index}-empty`}>{tpWord}</span>);
            }

            const primalSegments = generatePrimalTooltipText(
              tpWord,
              PRIMAL_COLOR_TERMS,
              DICTIONARY,
              COLORS,
              selectedTheme
            );

            return (
              <div key={index} style={{ marginBottom: "3px" }}>
                {tpWordSpans}
                {wordEntry?.en && colorData && (
                  <>
                    <span style={{ color: selectedTheme.baseText }}> (</span>
                    {wordEntry.en.length > 0 && (
                      <span style={{ color: colorData.color1 }}>
                        {wordEntry.en[0]}
                      </span>
                    )}
                    {wordEntry.en.length > 1 && (
                      <span style={{ color: colorData.color2 }}>
                        {wordEntry.en[1]}
                      </span>
                    )}
                    {wordEntry.en.length > 2 && (
                      <span style={{ color: selectedTheme.baseText }}>
                        {wordEntry.en.substring(2)}
                      </span>
                    )}
                    <span style={{ color: selectedTheme.baseText }}>)</span>
                  </>
                )}
                {primalSegments.length > 0 && (
                  <>
                    <span style={{ color: selectedTheme.baseText }}>: </span>
                    {primalSegments.map((segment, segIdx) => (
                      <span
                        key={`${index}-primal-${segIdx}`}
                        style={{
                          color:
                            segment.color || selectedTheme.semanticDefaultText,
                        }}
                      >
                        {segment.text}
                      </span>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      );
      setTooltipContent(content);
      setTooltipVisible(true);
    }
    setTooltipPosition({ x: event.clientX + 10, y: event.clientY + 10 });
  };

  const handleWordMouseLeave = () => {
    setTooltipVisible(false);
    setTooltipContent(null);
  };

  // Generic function to render annotated words (either English or Ukrainian)
  const renderAnnotatedText = (annotatedWords: AnnotatedWord[]) => {
    return annotatedWords.map((word, wordIndex) => {
      // Check for pure whitespace strings (spaces, tabs, but not newlines if they are handled separately)
      if (
        word.originalText.match(/^\s+$/) &&
        !word.originalText.includes("\\n") &&
        !word.originalText.includes("\n")
      ) {
        // Render spaces as they are, they will inherit parent color or be THEME.spaceColor if segmented
        return <span key={`word-${wordIndex}-space`}>{word.originalText}</span>;
      }

      // Handle explicit literal "\n" if present in original text from data.ts
      if (word.originalText.includes("\\n")) {
        return word.originalText.split(/(\\n)/g).map((part, partIdx) =>
          part === "\\n" ? (
            <br key={`word-${wordIndex}-br-lit-${partIdx}`} />
          ) : (
            <span key={`word-${wordIndex}-part-lit-${partIdx}`}>{part}</span> // Should be rare if segments handle newlines
          )
        );
      }

      // Handle actual newline characters processed into segments
      // This is the primary way newlines should be handled if text comes from template literals
      if (word.segments.length === 1 && word.segments[0].text === "\n") {
        return <br key={`word-${wordIndex}-br-seg`} />;
      }
      if (
        word.segments.some(
          (seg) => seg.text.includes("\n") || seg.text === "\n"
        )
      ) {
        // If newlines are within segments (e.g. multiple spaces and a newline was one "word")
        return (
          <span key={`word-${wordIndex}-multiseg`}>
            {word.segments.map((s, i) =>
              s.text === "\n" ? (
                <br key={`word-${wordIndex}-seg-${i}-br`} />
              ) : (
                <span
                  key={`word-${wordIndex}-seg-${i}-text`}
                  style={{ color: s.color, display: "inline" }}
                >
                  {s.text.replace(/\n/g, "")}{" "}
                  {/* Render text part, remove newline if already handled by <br> logic or if it's just space */}
                </span>
              )
            )}
          </span>
        );
      }

      // Default rendering for words with segments
      return (
        <span
          key={`word-${wordIndex}`}
          onMouseEnter={(e) => handleWordMouseEnter(e, word)}
          onMouseLeave={handleWordMouseLeave}
        >
          {word.segments.map((segment, segIndex) => (
            <span
              key={`seg-${wordIndex}-${segIndex}`}
              style={{
                color: segment.color, // Apply the single color directly
                display: "inline",
              }}
            >
              {segment.text}
            </span>
          ))}
        </span>
      );
    });
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleFontWeight = () =>
    setCurrentFontWeight(currentFontWeight === "normal" ? "bold" : "normal");
  const cycleFontFamily = () => {
    const families: Array<"sans-serif" | "serif" | "monospace"> = [
      "sans-serif",
      "serif",
      "monospace",
    ];
    const currentIndex = families.indexOf(currentFontFamily);
    setCurrentFontFamily(families[(currentIndex + 1) % families.length]);
  };

  return (
    <ThemeProvider theme={selectedTheme}>
      <AppContainer
        fontFamily={currentFontFamily}
        fontWeight={currentFontWeight}
      >
        <TogglePanel>
          <button onClick={toggleDarkMode}>
            {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={toggleFontWeight}>
            Weight: {currentFontWeight}
          </button>
          <button onClick={cycleFontFamily}>Font: {currentFontFamily}</button>
        </TogglePanel>
        <TextColumnsContainer>
          <TextColumn>
            {/* <ColumnTitle>English Text</ColumnTitle> */}
            <TextParagraph>
              {renderAnnotatedText(englishAnnotatedText)}
            </TextParagraph>
          </TextColumn>
          <TextColumn>
            {/* <ColumnTitle>Ukrainian Text (Toki Pona Colors)</ColumnTitle> */}
            <TextParagraph>
              {renderAnnotatedText(ukrainianAnnotatedText)}
            </TextParagraph>
          </TextColumn>
          <TextColumn>
            {" "}
            {/* Added Spanish Column */}
            {/* <ColumnTitle>Spanish Text (Toki Pona Colors)</ColumnTitle> */}
            <TextParagraph>
              {renderAnnotatedText(spanishAnnotatedText)}
            </TextParagraph>
          </TextColumn>
        </TextColumnsContainer>
        {tooltipVisible && tooltipContent && (
          <TooltipContainer
            style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
          >
            {tooltipContent}
          </TooltipContainer>
        )}
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;
