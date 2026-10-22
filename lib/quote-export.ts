/** Wrap every word, including long unbroken text, without dropping any characters. */
export function wrapQuoteText(text: string, width: number, measure: (value: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= width) { line = candidate; continue; }
      if (line) { lines.push(line); line = ""; }
      for (const character of Array.from(word)) {
        if (line && measure(line + character) > width) { lines.push(line); line = ""; }
        line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function exportQuoteJpeg(stage: HTMLElement, source: string) {
  await document.fonts.ready;
  const photo = new Image();
  photo.src = source;
  await photo.decode();
  const quote = stage.querySelector("blockquote")!;
  const content = stage.querySelector<HTMLElement>(".quote-image-content")!;
  const author = stage.querySelector(".quote-image-attribution strong")!;
  const detail = stage.querySelector(".quote-image-attribution span")!;
  const contentStyle = getComputedStyle(content);
  const quoteStyle = getComputedStyle(quote);
  const authorStyle = getComputedStyle(author);
  const detailStyle = getComputedStyle(detail);
  const width = stage.clientWidth, height = stage.clientHeight;
  const resolution = Math.min(2, 2560 / width, 4096 / height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * resolution); canvas.height = Math.round(height * resolution);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Din browser kunne ikke lave billedet.");
  ctx.scale(resolution, resolution);
  const scale = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
  const mobile = width <= 720;
  ctx.drawImage(photo, (width - photo.naturalWidth * scale) * (mobile ? .55 : .5), (height - photo.naturalHeight * scale) * (mobile ? .5 : .4), photo.naturalWidth * scale, photo.naturalHeight * scale);
  if (!mobile) {
    const horizontal = ctx.createLinearGradient(0, 0, width, 0);
    horizontal.addColorStop(0, "#08152c45"); horizontal.addColorStop(.7, "#08152c00");
    ctx.fillStyle = horizontal; ctx.fillRect(0, 0, width, height);
  }
  const shade = ctx.createLinearGradient(0, height, 0, 0);
  shade.addColorStop(0, mobile ? "#08152cf0" : "#08152ce8");
  shade.addColorStop(mobile ? .52 : .43, mobile ? "#0c1e456e" : "#0c1e4566");
  shade.addColorStop(1, mobile ? "#0c1e4512" : "#0c1e4510");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);

  const left = parseFloat(contentStyle.left);
  const textWidth = content.clientWidth - parseFloat(contentStyle.paddingRight || "0");
  const bottom = parseFloat(contentStyle.bottom);
  const maxHeight = height - bottom - 28;
  const font = (style: CSSStyleDeclaration, size: number) => `${style.fontWeight} ${size}px ${style.fontFamily}`;
  const wrap = (text: string, style: CSSStyleDeclaration, size: number) => {
    ctx.font = font(style, size);
    // Canvas letter spacing follows the preview where the browser supports it.
    if ("letterSpacing" in ctx) ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
    return wrapQuoteText(text, textWidth, value => ctx.measureText(value).width);
  };
  const authorSize = parseFloat(authorStyle.fontSize), detailSize = parseFloat(detailStyle.fontSize);
  const authorLines = wrap(author.textContent || "", authorStyle, authorSize);
  const detailLines = wrap(detail.textContent || "", detailStyle, detailSize);
  const gap = mobile ? 18 : 26;
  const attributionHeight = authorLines.length * authorSize * 1.35 + 5 + detailLines.length * detailSize * 1.4;
  let size = parseFloat(quoteStyle.fontSize);
  const lineRatio = parseFloat(quoteStyle.lineHeight) / size;
  let lines = wrap(quote.textContent || "", quoteStyle, size);
  while (lines.length * size * lineRatio + gap + attributionHeight > maxHeight && size > 4) {
    size *= .95;
    lines = wrap(quote.textContent || "", quoteStyle, size);
  }
  let y = height - bottom - (lines.length * size * lineRatio + gap + attributionHeight);
  ctx.textBaseline = "top";
  const paint = (items: string[], style: CSSStyleDeclaration, fontSize: number, lineHeight: number, color: string) => {
    ctx.font = font(style, fontSize); ctx.fillStyle = color;
    if ("letterSpacing" in ctx) ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
    for (const line of items) { ctx.fillText(line, left, y); y += lineHeight; }
  };
  paint(lines, quoteStyle, size, size * lineRatio, "white");
  y += gap;
  paint(authorLines, authorStyle, authorSize, authorSize * 1.35, "white");
  y += 5;
  paint(detailLines, detailStyle, detailSize, detailSize * 1.4, "#ffffffc9");
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("Billedet kunne ikke gemmes.")), "image/jpeg", .94));
  return blob;
}
