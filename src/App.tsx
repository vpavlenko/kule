import React, { useEffect, useState } from "react";
// Assuming data.ts is in the parent directory (e.g., project_root/data.ts and project_root/src/App.tsx)
// Adjust the path if your data.ts is located elsewhere, e.g., './data' if it's in the same src folder.
import { DICTIONARY, COLORS, TEXT } from "./data";
// import yaml from "js-yaml";

interface LetterSegment {
  text: string;
  color1: string;
  color2: string;
  isTokiPonaColored: boolean;
}

interface AnnotatedWord {
  originalText: string;
  segments: LetterSegment[];
  tpDefinition?: string[];
}

const COLOR_MNEMONICS: Record<string, { text: string; color: string }> = {
  orange: { text: "body", color: COLORS.orange },
  blue: { text: "human", color: COLORS.blue },
  lime: { text: "nature", color: COLORS.lime },
  yellow: { text: "action", color: COLORS.yellow },
  red: { text: "good", color: COLORS.red },
  gray: { text: "feeling", color: COLORS.gray },
  pink: { text: "quality", color: COLORS.pink },
  brown: { text: "land", color: COLORS.brown },
  green: { text: "tool", color: COLORS.green },
  white: { text: "bad", color: COLORS.white },
  magenta: { text: "many", color: COLORS.magenta },
  cyan: { text: "location", color: COLORS.cyan },
  // Add black if needed, though not in the user provided list for mnemonics
  // black: { text: "space/void", color: COLORS.black },
};

// Function to find the original color names for a tpWord from DICTIONARY
// This is needed because tpColorMap stores hex values, but mnemonics are tied to color names.
const getTpWordOriginalColorNames = (
  tpWord: string
): { c1Name?: string; c2Name?: string } => {
  const dictEntry = DICTIONARY.find((d) => d.tp === tpWord);
  if (dictEntry) {
    return { c1Name: dictEntry.color1, c2Name: dictEntry.color2 };
  }
  return {};
};

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

const transformText = (
  text: string,
  tpColorMap: Map<string, { color1: string; color2: string }>,
  staticDefMap: Map<string, string[]>,
  colorPalette: typeof COLORS
): AnnotatedWord[] => {
  const words = text.split(/(\s+)/);
  const punctuationRegex = /^[.,/#!$%^&*;:{}=\-_`~()?]+$/;
  const wordCharRegex = /[a-zA-Z0-9\']/;

  return words.map((originalWord) => {
    if (originalWord.trim().length === 0) {
      return {
        originalText: originalWord,
        segments: [
          {
            text: originalWord,
            color1: colorPalette.black || "#000000",
            color2: colorPalette.black || "#000000",
            isTokiPonaColored: false,
          },
        ],
        // No tpDefinition for spaces
      };
    }

    const cleanWordForLookup = originalWord
      .trim()
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "");

    const currentTpDefinition = staticDefMap.get(cleanWordForLookup);
    const segments: LetterSegment[] = [];

    if (currentTpDefinition && currentTpDefinition.length > 0) {
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
                color1: colorData.color1,
                color2: colorData.color2, // Store original pair for context
                isTokiPonaColored: true,
              });
              if (engChar2) {
                segments.push({
                  text: engChar2,
                  color1: colorData.color2, // Second char gets second color
                  color2: colorData.color1, // Store original pair for context
                  isTokiPonaColored: true,
                });
              }
            } else {
              // TP word in definition but no color in map
              segments.push({
                text: engChar1,
                color1: colorPalette.white || "#ffffff",
                color2: colorPalette.white || "#ffffff",
                isTokiPonaColored: false,
              });
              if (engChar2) {
                segments.push({
                  text: engChar2,
                  color1: colorPalette.white || "#ffffff",
                  color2: colorPalette.white || "#ffffff",
                  isTokiPonaColored: false,
                });
              }
            }
            updatedTpIdx++;
          } else {
            // No more TP words in definition
            segments.push({
              text: engChar1,
              color1: colorPalette.white || "#ffffff",
              color2: colorPalette.white || "#ffffff",
              isTokiPonaColored: false,
            });
            if (engChar2) {
              segments.push({
                text: engChar2,
                color1: colorPalette.white || "#ffffff",
                color2: colorPalette.white || "#ffffff",
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
            text: char,
            color1:
              char.trim().length === 0
                ? colorPalette.black || "#000000"
                : colorPalette.white || "#ffffff",
            color2:
              char.trim().length === 0
                ? colorPalette.black || "#000000"
                : colorPalette.white || "#ffffff",
            isTokiPonaColored: false,
          });
        }
      }
      if (charBuffer.length > 0) {
        currentTpWordIndex = processBuffer(charBuffer, currentTpWordIndex);
      }
    } else {
      let currentSegmentText = "";
      for (let i = 0; i < originalWord.length; i++) {
        const char = originalWord[i];
        if (wordCharRegex.test(char)) {
          currentSegmentText += char;
        } else {
          if (currentSegmentText.length > 0) {
            segments.push({
              text: currentSegmentText,
              color1: colorPalette.white || "#ffffff",
              color2: colorPalette.white || "#ffffff",
              isTokiPonaColored: false,
            });
            currentSegmentText = "";
          }
          segments.push({
            text: char,
            color1:
              char.trim().length === 0
                ? colorPalette.black || "#000000"
                : colorPalette.white || "#ffffff",
            color2:
              char.trim().length === 0
                ? colorPalette.black || "#000000"
                : colorPalette.white || "#ffffff",
            isTokiPonaColored: false,
          });
        }
      }
      if (currentSegmentText.length > 0) {
        segments.push({
          text: currentSegmentText,
          color1: colorPalette.white || "#ffffff",
          color2: colorPalette.white || "#ffffff",
          isTokiPonaColored: false,
        });
      }
    }

    if (segments.length === 0 && originalWord.length > 0) {
      segments.push({
        text: originalWord,
        color1:
          punctuationRegex.test(originalWord) && originalWord.trim().length > 0
            ? colorPalette.white || "#ffffff"
            : colorPalette.black || "#000000",
        color2:
          punctuationRegex.test(originalWord) && originalWord.trim().length > 0
            ? colorPalette.white || "#ffffff"
            : colorPalette.black || "#000000",
        isTokiPonaColored: false,
      });
    }
    return {
      originalText: originalWord,
      segments,
      tpDefinition: currentTpDefinition,
    };
  });
};

const App: React.FC = () => {
  const [annotatedText, setAnnotatedText] = useState<AnnotatedWord[]>([]);
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
    try {
      const newAnnotatedText = transformText(
        TEXT,
        tpColorMap,
        staticWordToTpDefinitionMap,
        COLORS
      );
      setAnnotatedText(newAnnotatedText);
    } catch (e: any) {
      console.error("Error processing text with static map:", e);
    }
  }, [tpColorMap]);

  const handleWordMouseEnter = (
    event: React.MouseEvent<HTMLSpanElement>,
    word: AnnotatedWord
  ) => {
    if (word.tpDefinition && word.tpDefinition.length > 0) {
      const content = (
        <div style={{ textAlign: "left" }}>
          {word.tpDefinition.map((tpWord, index) => {
            const colorData = tpColorMap.get(tpWord); // Hex colors for the tpWord
            const originalColorNames = getTpWordOriginalColorNames(tpWord);

            // Build TP word spans with specific letter coloring
            const tpWordSpans: JSX.Element[] = [];
            if (tpWord.length > 0) {
              // First letter
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
              // Second letter
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
              // Rest of the letters
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
              // Should not happen if tpWord is from a valid definition, but handle empty string gracefully
              tpWordSpans.push(<span key={`${index}-empty`}>{tpWord}</span>);
            }

            // Build mnemonics spans
            const mnemonicsSpans: JSX.Element[] = [];
            if (
              originalColorNames.c1Name &&
              COLOR_MNEMONICS[originalColorNames.c1Name]
            ) {
              const mnemonic1 = COLOR_MNEMONICS[originalColorNames.c1Name];
              mnemonicsSpans.push(
                <span key={`${index}-m1`} style={{ color: mnemonic1.color }}>
                  {mnemonic1.text}
                </span>
              );
            }
            if (
              originalColorNames.c2Name &&
              COLOR_MNEMONICS[originalColorNames.c2Name] &&
              originalColorNames.c1Name !== originalColorNames.c2Name
            ) {
              if (mnemonicsSpans.length > 0)
                mnemonicsSpans.push(<span key={`${index}-plus`}> + </span>);
              const mnemonic2 = COLOR_MNEMONICS[originalColorNames.c2Name];
              mnemonicsSpans.push(
                <span key={`${index}-m2`} style={{ color: mnemonic2.color }}>
                  {mnemonic2.text}
                </span>
              );
            }
            // If only one color or c1Name equals c2Name, and mnemonicsSpans is empty from c1, but c2 is valid (covers single color words if c1 was undefined but c2 defined)
            else if (
              originalColorNames.c2Name &&
              COLOR_MNEMONICS[originalColorNames.c2Name] &&
              mnemonicsSpans.length === 0
            ) {
              const mnemonic2 = COLOR_MNEMONICS[originalColorNames.c2Name];
              mnemonicsSpans.push(
                <span
                  key={`${index}-m2-single`}
                  style={{ color: mnemonic2.color }}
                >
                  {mnemonic2.text}
                </span>
              );
            }

            return (
              <div key={index} style={{ marginBottom: "3px" }}>
                {" "}
                {/* Each defined TP word on a new line */}
                {tpWordSpans}
                {mnemonicsSpans.length > 0 && (
                  <>
                    <span style={{ color: COLORS.white || "#ffffff" }}>: </span>
                    {mnemonicsSpans}
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

  return (
    <div className="annotated-text-container">
      {annotatedText.map((word, wordIndex) => (
        <span
          key={wordIndex}
          className="annotated-word"
          onMouseEnter={(e) => handleWordMouseEnter(e, word)}
          onMouseLeave={handleWordMouseLeave}
        >
          {word.segments.map((segment, segmentIndex) => {
            const style: React.CSSProperties = {};
            if (segment.isTokiPonaColored) {
              style.color = segment.color1;
            } else {
              if (segment.text.trim().length === 0) {
                style.color = COLORS.black || "#000000";
              } else {
                style.color = segment.color1;
              }
            }
            return (
              <span key={`${wordIndex}-${segmentIndex}`} style={style}>
                {segment.text}
              </span>
            );
          })}
        </span>
      ))}
      {tooltipVisible && tooltipContent && (
        <div
          style={{
            position: "fixed",
            top: tooltipPosition.y,
            left: tooltipPosition.x,
            backgroundColor: "#333",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            zIndex: 1000,
            pointerEvents: "none",
            fontSize: "0.9em",
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

export default App;
