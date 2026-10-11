/**
 * Robust preprocessor for AI-generated Markdown.
 * Fixes typical LLM stream formatting issues:
 * 1. Normalizes unicode bullets (•, ⁃, etc.) to markdown '- '
 * 2. Repairs merged/inline tables where multiple table rows or table cells got concatenated on a single line
 * 3. Ensures tables have appropriate blank lines before and after for proper remark-gfm parsing
 */

export function preprocessAiMarkdown(content: string): string {
  if (!content) return "";

  // 1. Normalize bullet points
  let text = content.replace(/^([ \t]*)[•⁃*][ \t]+/gm, "$1- ");

  // 2. Separate text prefix on same line before a table:
  // e.g., "Heading: | Col 1 | Col 2 |" -> "Heading:\n\n| Col 1 | Col 2 |"
  text = text.replace(/([^\n|]+:?)[ \t]+(\|(?:\s*[^|\n]+\s*\|){2,})/g, "$1\n\n$2");

  // 3. Split concatenated table rows on the same line:
  // (a) Boundary between separator dashes and next data row: e.g. "...---|---| Bulanan |" -> "...---|---|\n| Bulanan |"
  text = text.replace(/(\|[-:]{3,}\|)[ \t]*\|?([ \t]*[A-Za-z0-9])/g, "$1\n| $2");

  // (b) Boundary between row end and row start: e.g. "... | 16% || Mingguan | ..." -> "... | 16% |\n| Mingguan | ..."
  text = text.replace(/\|[ \t]*\|(?=[ \t]*[^ \t\n|])/g, "|\n|");
  text = text.replace(/\|[ \t]+\|(?=[ \t]*\|)/g, "|\n|");

  // (c) If header cells got split across lines: e.g. "| Periode\n| Anggaran |" without pipe at end of first line
  text = text.replace(/(\|\s*[^|\n]+)\n(\|\s*[^|\n]+\s*\|)/g, "$1 $2");

  // 4. Ensure there is a blank line before the start of a markdown table if preceded by normal prose
  // (remark-gfm requires a preceding newline or paragraph boundary to recognize table syntax)
  const lines = text.split("\n");
  const resultLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = /^\s*\|.*\|\s*$/.test(line);

    if (isTableLine && !inTable) {
      // Starting a table
      if (resultLines.length > 0 && resultLines[resultLines.length - 1].trim() !== "") {
        resultLines.push(""); // Insert blank line before table
      }
      inTable = true;
    } else if (!isTableLine && inTable) {
      // Ending a table
      if (line.trim() !== "") {
        resultLines.push(""); // Insert blank line after table
      }
      inTable = false;
    }

    resultLines.push(line);
  }

  return resultLines.join("\n");
}
