import React, { useEffect, useState } from "react";
// Assuming data.ts is in the parent directory (e.g., project_root/data.ts and project_root/src/App.tsx)
// Adjust the path if your data.ts is located elsewhere, e.g., './data' if it's in the same src folder.
import { DICTIONARY, COLORS, TEXT, PRIMAL_COLOR_TERMS } from "./data";
// import yaml from "js-yaml";

interface LetterSegment {
  text: string;
  color1: string;
  color2: string;
  isTokiPonaColored: boolean;
  tpDefinition?: string[];
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
  const punctuationRegex = /^[.,/#!$%^&*;:{}=\-_`~()?]+$/;
  const wordCharRegex = /[a-zA-Z0-9\']/;

  return words.map((originalWord) => {
    if (originalWord.trim().length === 0) {
      return {
        originalText: originalWord,
        segments: [
          {
            text: originalWord.length > 0 ? " " : "",
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
            const wordEntry = DICTIONARY.find((entry) => entry.tp === tpWord); // For 'en' and primal colors

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

            // Generate primal tooltip string
            const primalSegments = generatePrimalTooltipText(
              tpWord,
              PRIMAL_COLOR_TERMS,
              DICTIONARY,
              COLORS // Pass the main COLORS map
            );

            return (
              <div key={index} style={{ marginBottom: "3px" }}>
                {" "}
                {/* Each defined TP word on a new line */}
                {tpWordSpans}
                {/* English definition part */}
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
                {/* Primal terms part */}
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

  return (
    <div
      className="annotated-text-container"
      style={{
        maxWidth: "600px",
        margin: "0 auto", // Center the div
        backgroundColor: "#000000", // Added black background
        fontVariantLigatures: "none", // Disable ligatures
      }}
    >
      {annotatedText.map((word, wordIndex) => (
        <span
          key={wordIndex}
          className="annotated-word"
          onMouseEnter={(e) => handleWordMouseEnter(e, word)}
          onMouseLeave={handleWordMouseLeave}
          style={{ display: "inline" }} // Changed to inline
        >
          {word.segments.map((segment, segmentIndex) => {
            const style: React.CSSProperties = { display: "inline" }; // Changed to inline
            if (segment.isTokiPonaColored) {
              style.color = segment.color1;
            } else {
              // segment.color1 is already correctly set by transformText for non-TP parts
              // (e.g., white for uncolored letters/punctuation, black for space characters)
              style.color = segment.color1;
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
            backgroundColor: "#000000", // Changed to black
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            zIndex: 1000,
            pointerEvents: "none",
            fontSize: "0.9em",
            border: "1px solid white", // Added white border
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

export default App;
