/**
 * Parte Markdown en trozos por encabezados ## / ### y tamaño máximo.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
export function chunkMarkdown(text, maxChars = 2800) {
  const lines = text.split(/\r?\n/);
  const chunks = [];
  let buf = [];

  function flush() {
    const s = buf.join('\n').trim();
    if (s) chunks.push(s);
    buf = [];
  }

  for (const line of lines) {
    if (/^#{1,3}\s/.test(line) && buf.length && buf.join('\n').length > 200) {
      flush();
    }
    buf.push(line);
    if (buf.join('\n').length >= maxChars) {
      flush();
    }
  }
  flush();

  if (chunks.length === 0 && text.trim()) return [text.trim().slice(0, maxChars)];
  return chunks;
}
