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
      - The **first letter** of the (usually two-letter) segment of the original English word is colored using `color1` of `tp_word1` (from `data.ts`).
      - The **second letter** of that English word segment is colored using `color2` of `tp_word1`.
      - This pattern continues: the next two letters of the English word (forming the second segment) are colored by `tp_word2`'s `color1` (for the third English letter) and `color2` (for the fourth English letter), and so on.
    - If the TP definition is shorter than the number of 2-letter segments in the English word (i.e., `definition_length < ceil(N / 2)`), any remaining letters of the English word are colored white.
    - If an English word has an odd number of letters, the last single letter forms a segment. It is colored with `color1` of the corresponding TP word, or white if the definition is exhausted.
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
    - **`e`** (letter 1) uses `pali`'s `color1`: `yellow`.
    - **`x`** (letter 2) uses `pali`'s `color2`: `yellow`.
    - **`p`** (letter 3) uses `kama`'s `color1`: `yellow`.
    - **`e`** (letter 4) uses `kama`'s `color2`: `red`.
    - **`r`** (letter 5) uses `sona`'s `color1`: `gray`.
    - **`i`** (letter 6) uses `sona`'s `color2`: `yellow`.
    - **`m`** (letter 7): The TP definition (`pali`, `kama`, `sona`) is now exhausted. This letter is colored white.
    - **`e`** (letter 8): Also colored white.
    - **`n`** (letter 9): Also colored white.
    - **`t`** (letter 10): Also colored white.

### Static Coloring in Markdown (Approximation)

GitHub Markdown doesn't directly support complex text coloring like applying different colors to individual letters within a word easily using standard Markdown syntax. We can show the intended words and their associated TP color words, and then an approximation of the visual output.

`experiment` ->
`e` (pali: yellow) `x` (pali: yellow)
`p` (kama: yellow) `e` (kama: red)
`r` (sona: gray) `i` (sona: yellow)
`m` (white) `e` (white) `n` (white) `t` (white)

If we were to use simple font colors (this is an approximation of the per-letter coloring):

<span style="color:yellow;">e</span><span style="color:yellow;">x</span><span style="color:yellow;">p</span><span style="color:red;">e</span><span style="color:gray;">r</span><span style="color:yellow;">i</span>ment
(Note: This simplified Markdown example just applies some of the distinct colors.)

Or, with a black background (simulated via a table cell for Markdown, if the viewer supports HTML):

<table>
<tr>
<td style="background-color:black; color:white;">
<span style="color:#ffff00;">e</span><span style="color:#ffff00;">x</span><span style="color:#ffff00;">p</span><span style="color:#ff0000;">e</span><span style="color:#808080;">r</span><span style="color:#ffff00;">i</span>ment
(Colors are hex approximations.)
</td>
</tr>
</table>

(The actual app applies a specific color to each character directly via CSS `color` style on a black page background.)

## Data Sources

- `
