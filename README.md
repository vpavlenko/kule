# Kule Text Colorizer Logic

This project displays a given text, with words colored based on their corresponding Toki Pona definitions. The coloring follows a specific set of rules:

## Core Coloring Rules

1.  **Input Text Processing**: The input English text is split into words. Punctuation attached to words is removed for the purpose of finding definitions, but the original word (with punctuation) is preserved for display.

2.  **Toki Pona Definition Search**:

    - For each English word of length `N` (after splitting from the main text, but before cleaning punctuation for lookup), we aim to find the "most precise" Toki Pona (TP) definition.
    - The maximum number of TP words allowed in this definition is `ceil(N / 2)`. For example:
      - A 1-letter English word: max 1 TP word.
      - A 2-letter English word: max 1 TP word.
      - A 3-letter English word: max 2 TP words.
      - A 4-letter English word: max 2 TP words.
      - A 5-letter English word: max 3 TP words.
    - The search for definitions primarily uses `compounds.txt`. This file contains common TP words and compound phrases with their English translations and frequency scores. An English word is looked up in these translations.
    - If multiple TP definitions from `compounds.txt` match an English word and satisfy the length criteria, the one with the highest frequency score is chosen as the "most precise."
    - The official `dictionary.yml` can also be a source for definitions, though the current implementation prioritizes `compounds.txt` for phrase matching.
    - **Important**: The English definitions (`en` field) in `data.ts` are _not_ used for finding the TP definition for coloring; `compounds.txt` and `dictionary.yml` are the sources.

3.  **Special Particles `pi` and `e`**:

    - When a TP definition is found (e.g., "pali pi kama sona"), the particles `pi` (of) and `e` (direct object marker) are **stripped out** from the definition before its length is calculated.
    - These particles also do **not count** towards the `ceil(N / 2)` length limit.
    - For example, "experiment" can be defined as "pali pi kama sona". After stripping `pi`, it becomes "pali kama sona", which has 3 TP words. This definition would be valid for an English word "experiment" (10 letters, `ceil(10/2) = 5`, so max 5 TP words).

4.  **Applying Colors to English Word Letters**:
    - Once the best TP definition (e.g., `[tp_word1, tp_word2, tp_word3]`) is determined:
      - The **first two letters** of the original English word are colored using `color1` and `color2` of `tp_word1` (from `data.ts`). These colors create a linear gradient.
      - The **next two letters** (3rd and 4th) of the English word are colored using `color1` and `color2` of `tp_word2`.
      - This pattern continues, pairing two English letters with the colors of the corresponding TP word in the definition sequence.
    - If the TP definition is shorter than the number of 2-letter segments in the English word (i.e., `definition_length < ceil(N / 2)`), any remaining 2-letter segments of the English word are colored white.
    - If an English word has an odd number of letters, the last single letter also forms a segment and is colored according to the corresponding TP word in the definition, or white if the definition is exhausted.
    - If no suitable TP definition is found for an English word, the entire word is displayed in white.
    - Spaces between words are preserved and colored black.

## Example: "experiment"

Let's say the English word is "**experiment**" (10 letters).

1.  `N = 10`. Max TP definition length = `ceil(10 / 2) = 5` words.
2.  We search for "experiment" in `compounds.txt`.
    - We find: `pali pi kama sona: [experiment 47, ...]`
3.  The TP phrase is "pali pi kama sona".
    - Stripping `pi`: "pali kama sona".
    - Length of this definition: 3 words (`pali`, `kama`, `sona`). This is `<= 5`, so it's a valid definition.
    - Let's assume this is the most precise definition found.
4.  Colors are defined in `data.ts` for `pali`, `kama`, `sona`:
    - `pali`: { color1: "yellow", color2: "yellow" }
    - `kama`: { color1: "yellow", color2: "red" }
    - `sona`: { color1: "gray", color2: "yellow" }
5.  Applying colors to "experiment":
    - **`ex`** (letters 1-2) uses `pali`'s colors: `yellow` to `yellow` gradient.
    - **`pe`** (letters 3-4) uses `kama`'s colors: `yellow` to `red` gradient.
    - **`ri`** (letters 5-6) uses `sona`'s colors: `gray` to `yellow` gradient.
    - **`me`** (letters 7-8): The TP definition (`pali`, `kama`, `sona`) is now exhausted. This segment is colored white.
    - **`nt`** (letters 9-10): Also colored white.

### Static Coloring in Markdown (Approximation)

GitHub Markdown doesn't directly support linear gradients on text or specific background clips for text. We can approximate by coloring the text itself if we had a single color per segment, or by using `<code>` blocks with background colors if we wanted to simulate segments, but this is very limited.

Given the limitation, we can show the intended words and their associated TP color words:

`experiment` ->
`ex` (pali: yellow/yellow) `pe` (kama: yellow/red) `ri` (sona: gray/yellow) `me` (white) `nt` (white)

If we were to use simple font colors (this won't show gradients):

<span style="color:yellow;">ex</span><span style="color:orange;">pe</span><span style="color:silver;">ri</span>ment
(Note: Used orange as a mix of yellow/red, silver for gray/yellow for this simplified Markdown example - actual is gradient.)

Or, with a black background (simulated via a table cell for Markdown, if the viewer supports HTML):

<table>
<tr>
<td style="background-color:black; color:white;">
<span style="color:#ffff00;">ex</span><span style="color:#ff8000;">pe</span><span style="color:#b7b700;">ri</span>ment
(Colors are hex approximations of the first color or a mix)
</td>
</tr>
</table>

(The actual app uses CSS `linear-gradient` for `background-image` and `background-clip: text` for the precise effect on a black page background.)

## Data Sources

- `src/data.ts`: Contains the main `TEXT` to be displayed, `COLORS` definitions (mapping color names to hex values), and the base `DICTIONARY` (mapping TP words to their `color1`, `color2`, and a fallback English `en` field).
- `public/dictionary.yml`: A YAML file providing detailed Toki Pona word definitions (nouns, verbs, adjectives, etc.). Used to understand word meanings if extending precision logic.
- `public/compounds.txt`: A text file listing common Toki Pona compound phrases, their English translations, and frequency scores. This is the primary source for finding multi-word TP definitions for English words.
