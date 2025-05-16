import React, { useEffect, useState } from "react";
import styled from "styled-components"; // Import styled-components
// Assuming data.ts is in the parent directory (e.g., project_root/data.ts and project_root/src/App.tsx)
// Adjust the path if your data.ts is located elsewhere, e.g., './data' if it's in the same src folder.
import {
  DICTIONARY,
  COLORS,
  TEXT,
  PRIMAL_COLOR_TERMS,
  UKRAINIAN_TEXT,
  UKRAINIAN_WORD_TP_MAP,
} from "./data";
// import yaml from "js-yaml";

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
  color?: string; // Color for this segment, defaults to white if undefined
}

// Styled Components Definitions
const AppContainer = styled.div`
  background-color: black;
  color: white;
  margin: 0;
  padding: 20px;
  font-family: sans-serif;
  min-height: 100vh;
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
  border: 1px solid #333;
  border-radius: 5px;
  background-color: #1a1a1a;
  font-family: monospace; // Applied here for both columns
`;

const ColumnTitle = styled.h2`
  margin-top: 0;
  color: #ccc;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
`;

const TextParagraph = styled.p`
  white-space: pre-wrap;
`;

const TooltipContainer = styled.div`
  position: fixed;
  background-color: #2a2a2a;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  z-index: 1000;
  pointer-events: none; // Important so it doesn't interfere with mouse events on text
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  max-width: 300px; // Prevent tooltip from becoming too wide
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

interface ParsedDictionaryEntry {
  tp: string;
  definitions: string[];
}

/* 
// Ensure the entire block of these functions is commented out
// to resolve "Cannot find name 'yaml'" and unused var warnings.

const parseDictionaryYml = (ymlContent: string): Map<string, ParsedDictionaryEntry> => {
  const parsedMap = new Map<string, ParsedDictionaryEntry>();
  // try {
  //   const data = yaml.load(ymlContent) as Record<string, any>; // THIS LINE IS THE CULPRIT
  //   for (const tpWord in data) {
  //     if (Object.prototype.hasOwnProperty.call(data, tpWord)) {
  //       const entry = data[tpWord];
  //       const definitions: string[] = [];
  //       // ... (rest of the parsing logic if any was present) ...
  //       parsedMap.set(tpWord, { tp: tpWord, definitions });
  //     }
  //   }
  // } catch (e) { 
  //   console.error("Error parsing dictionary.yml:", e);
  // }
  return parsedMap; 
};

interface CompoundEntry {
  tpPhrase: string;
  translations: { text: string; frequency: number }[];
}

// Make sure this function is commented out
const parseCompoundsTxt = (txtContent: string): CompoundEntry[] => {
  const entries: CompoundEntry[] = [];
  // ... (rest of the parsing logic) ...
  return entries;
};

// Make sure this function is commented out
const findBestTpDefinition = (
  englishWord: string,
  maxDefLength: number,
  // These parameters would come from parsed files, not needed for static
  // parsedCompounds: CompoundEntry[], 
  // tpDataFromDictionaryTs: TpWordData[] 
): string[] | null => {
  // ... (rest of the definition finding logic) ...
  return null; 
};
*/

// Function to generate tooltip text using PRIMAL_COLOR_TERMS
const generatePrimalTooltipText = (
  tpWord: string,
  primalColorTerms: Record<string, string>,
  dictionary: typeof DICTIONARY,
  appColors: typeof COLORS // Added appColors for direct access
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
        color: appColors.white || "#ffffff",
      });
      firstPartRendered = true;
    } else if (part1.colorName) {
      finalSegments.push({
        text: `${part1.colorName}(?)`,
        color: appColors.white || "#ffffff",
      });
      firstPartRendered = true;
    }

    if (parts.length > 1) {
      const part2 = parts[1];
      // Add " + " if the first part was rendered and a second part (term or colorName) exists
      if (firstPartRendered && (part2.term || part2.colorName)) {
        finalSegments.push({
          text: " + ",
          color: appColors.white || "#ffffff",
        });
      }

      if (part2.term && part2.actualColor) {
        finalSegments.push({ text: part2.term, color: part2.actualColor });
      } else if (part2.term) {
        finalSegments.push({
          text: `${part2.term}(?)`,
          color: appColors.white || "#ffffff",
        });
      } else if (part2.colorName) {
        finalSegments.push({
          text: `${part2.colorName}(?)`,
          color: appColors.white || "#ffffff",
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
  colorPalette: typeof COLORS
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
          color: colorPalette.black || "#000000", // Spaces are black
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
              segments.push({
                text: engChar1,
                color: colorPalette.white || "#ffffff",
                isTokiPonaColored: true,
              });
              if (engChar2) {
                segments.push({
                  text: engChar2,
                  color: colorPalette.white || "#ffffff",
                  isTokiPonaColored: true,
                });
              }
            }
            updatedTpIdx++;
          } else {
            segments.push({
              text: engChar1,
              color: colorPalette.white || "#ffffff",
              isTokiPonaColored: false,
            });
            if (engChar2) {
              segments.push({
                text: engChar2,
                color: colorPalette.white || "#ffffff",
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
            color: colorPalette.white || "#ffffff",
            isTokiPonaColored: false,
          });
        }
      }
      if (charBuffer.length > 0) {
        currentTpWordIndex = processBuffer(charBuffer, currentTpWordIndex);
      }
    } else {
      // Word not in staticDefMap, definition is empty, or it's an empty cleanWord (e.g. only punctuation)
      // Color whole originalWord char by char white (or black for spaces within)
      for (let i = 0; i < originalWord.length; i++) {
        const char = originalWord[i];
        segments.push({
          text: char,
          color: wordCharRegex.test(char)
            ? colorPalette.white || "#ffffff"
            : char.trim().length === 0
            ? colorPalette.black || "#000000"
            : colorPalette.white || "#ffffff",
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

function getUkrainianWordColorSegments(
  wordPartToColor: string,
  tpDefinitionForWord: string[] | undefined,
  currentDictionary: typeof DICTIONARY,
  currentColors: typeof COLORS
): Segment[] {
  const segments: Segment[] = [];
  const whiteColor = currentColors.white || "#ffffff";
  const blackColor = currentColors.black || "#000000"; // Though not explicitly used for wordPartToColor here

  if (wordPartToColor.trim().length === 0) {
    // Handle if an empty or space string is passed
    for (let i = 0; i < wordPartToColor.length; i++) {
      segments.push({ text: wordPartToColor[i], color: blackColor });
    }
    return segments;
  }

  const tpDefinition = tpDefinitionForWord;

  if (!tpDefinition || tpDefinition.length === 0) {
    // No definition found, color word white (char by char)
    for (let i = 0; i < wordPartToColor.length; i++) {
      segments.push({ text: wordPartToColor[i], color: whiteColor });
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
    let colorForChar1 = whiteColor;
    let colorForChar2 = whiteColor;

    if (currentTpWord) {
      const dictEntry = currentDictionary.find((d) => d.tp === currentTpWord);
      if (dictEntry && dictEntry.color1 && dictEntry.color2) {
        colorForChar1 =
          currentColors[dictEntry.color1 as keyof typeof currentColors] ||
          whiteColor;
        colorForChar2 =
          currentColors[dictEntry.color2 as keyof typeof currentColors] ||
          whiteColor;
      } else if (dictEntry && dictEntry.color1) {
        // Fallback if only color1 defined
        colorForChar1 =
          currentColors[dictEntry.color1 as keyof typeof currentColors] ||
          whiteColor;
        colorForChar2 = colorForChar1; // Use color1 for both if color2 missing
      } else {
        // Fallback if TP word not in DICTIONARY or no colors defined (e.g. use 'ala' colors or just white)
        // For simplicity, stick to white if primary lookup fails or lacks colors.
        // Or, use a default like 'ala' if specified:
        const fallbackDictEntry = currentDictionary.find((d) => d.tp === "ala");
        if (
          fallbackDictEntry &&
          fallbackDictEntry.color1 &&
          fallbackDictEntry.color2
        ) {
          colorForChar1 =
            currentColors[
              fallbackDictEntry.color1 as keyof typeof currentColors
            ] || whiteColor;
          colorForChar2 =
            currentColors[
              fallbackDictEntry.color2 as keyof typeof currentColors
            ] || whiteColor;
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

  // Any remaining letters are colored white
  while (letterIndex < N) {
    segments.push({
      text: wordPartToColor[letterIndex],
      color: whiteColor,
    });
    letterIndex++;
  }
  return segments;
}

// transformUkrainianText: Creates AnnotatedWord[] for Ukrainian text
const transformUkrainianText = (
  text: string,
  ukrWordMap: Record<string, string[]>,
  dictionary: typeof DICTIONARY,
  colors: typeof COLORS
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
          color: colors.black || "#000000",
          isTokiPonaColored: false,
        });
      }
      return {
        originalText: originalWordWithPunctuation,
        segments: spaceSegments,
      };
    }

    const punctuationMatch = originalWordWithPunctuation.match(/([.,:;!?]+)$/);
    const punctuation = punctuationMatch ? punctuationMatch[0] : "";
    const wordPart = punctuationMatch
      ? originalWordWithPunctuation.substring(
          0,
          originalWordWithPunctuation.length - punctuation.length
        )
      : originalWordWithPunctuation;

    const cleanedKey = cleanUkrainianWordForKey(wordPart);
    const tpDefinition = ukrWordMap[cleanedKey]; // This is string[] | undefined

    const visualSegments = getUkrainianWordColorSegments(
      wordPart,
      tpDefinition,
      dictionary,
      colors
    );

    const letterSegments: LetterSegment[] = visualSegments.map((vs) => ({
      text: vs.text,
      color: vs.color,
      isTokiPonaColored: !!tpDefinition && tpDefinition.length > 0, // Mark true if definition existed
    }));

    if (punctuation) {
      letterSegments.push({
        text: punctuation,
        color: colors.white || "#ffffff", // Punctuation is white
        isTokiPonaColored: false,
      });
    }

    return {
      originalText: originalWordWithPunctuation,
      segments: letterSegments,
      tpDefinition: tpDefinition, // Store the found TP definition for the tooltip
    };
  });
};

const App: React.FC = () => {
  const [englishAnnotatedText, setEnglishAnnotatedText] = useState<
    AnnotatedWord[]
  >([]);
  const [ukrainianAnnotatedText, setUkrainianAnnotatedText] = useState<
    AnnotatedWord[]
  >([]);
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

  useEffect(() => {
    setEnglishAnnotatedText(
      transformText(TEXT, tpColorMap, staticWordToTpDefinitionMap, COLORS)
    );
    setUkrainianAnnotatedText(
      transformUkrainianText(
        UKRAINIAN_TEXT,
        UKRAINIAN_WORD_TP_MAP,
        DICTIONARY,
        COLORS
      )
    );
  }, [tpColorMap]);

  const handleWordMouseEnter = (
    event: React.MouseEvent<HTMLSpanElement>,
    word: AnnotatedWord // This now works for both English and Ukrainian
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
                      : COLORS.white || "#ffffff",
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
                        : COLORS.white || "#ffffff",
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
                    style={{ color: COLORS.white || "#ffffff" }}
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
              COLORS
            );

            return (
              <div key={index} style={{ marginBottom: "3px" }}>
                {tpWordSpans}
                {wordEntry?.en && colorData && (
                  <>
                    <span style={{ color: COLORS.white || "#ffffff" }}> (</span>
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
                      <span style={{ color: COLORS.white || "#ffffff" }}>
                        {wordEntry.en.substring(2)}
                      </span>
                    )}
                    <span style={{ color: COLORS.white || "#ffffff" }}>)</span>
                  </>
                )}
                {primalSegments.length > 0 && (
                  <>
                    <span style={{ color: COLORS.white || "#ffffff" }}>: </span>
                    {primalSegments.map((segment, segIdx) => (
                      <span
                        key={`${index}-primal-${segIdx}`}
                        style={{
                          color: segment.color || COLORS.white || "#ffffff",
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
      if (
        word.originalText.match(/^\s+$/) &&
        !word.originalText.includes("\\n")
      ) {
        // Handle spaces
        return <span key={`word-${wordIndex}`}>{word.originalText}</span>;
      }
      if (word.originalText.includes("\\n")) {
        // Handle newlines explicitly if they are literal \n
        return word.originalText
          .split(/(\\n)/g)
          .map((part, partIdx) =>
            part === "\\n" ? (
              <br key={`word-${wordIndex}-br-${partIdx}`} />
            ) : (
              <span key={`word-${wordIndex}-part-${partIdx}`}>{part}</span>
            )
          );
      }
      if (word.originalText.match(/^\s+$/)) {
        // Handle actual newline characters
        return word.segments.map((s, i) =>
          s.text === "\\n" ? (
            <br key={`word-${wordIndex}-seg-${i}`} />
          ) : (
            <span key={`word-${wordIndex}-seg-${i}`}>{s.text}</span>
          )
        );
      }

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

  return (
    <AppContainer>
      <TextColumnsContainer>
        <TextColumn>
          <ColumnTitle>English Text</ColumnTitle>
          <TextParagraph>
            {renderAnnotatedText(englishAnnotatedText)}
          </TextParagraph>
        </TextColumn>
        <TextColumn>
          <ColumnTitle>Ukrainian Text (Toki Pona Colors)</ColumnTitle>
          <TextParagraph>
            {renderAnnotatedText(ukrainianAnnotatedText)}
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
  );
};

export default App;
