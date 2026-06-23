/**
 * Pure helpers for the axes / title / legend "chrome" drawn around the WebGL
 * Spatial Molecules plot. The chrome is described once as a flat model of
 * primitives (rects / lines / texts, in container pixels) and rendered three
 * ways from the SAME model so they always match:
 *   • live  — React SVG elements overlaying the deck.gl canvas
 *   • PNG   — drawn onto a 2D canvas alongside the GL snapshot (drawChromeToCanvas)
 *   • SVG   — serialised to an <svg> with the GL snapshot embedded (chromeToSvg)
 *
 * deck.gl has no built-in axes/legend/export, so this reproduces (as far as is
 * reasonable for a GPU scatter) what the old Vega molecule plot gave for free.
 */

// "Nice" rounded number for axis ticks (Heckbert's algorithm).
const niceNum = (range, round) => {
  const safeRange = range > 0 ? range : 1;
  const exp = Math.floor(Math.log10(safeRange));
  const frac = safeRange / 10 ** exp;
  let nf;
  if (round) {
    if (frac < 1.5) nf = 1;
    else if (frac < 3) nf = 2;
    else if (frac < 7) nf = 5;
    else nf = 10;
  } else if (frac <= 1) nf = 1;
  else if (frac <= 2) nf = 2;
  else if (frac <= 5) nf = 5;
  else nf = 10;
  return nf * 10 ** exp;
};

/**
 * Evenly-spaced "nice" tick values within [min, max].
 * @returns {number[]}
 */
export const niceTicks = (min, max, maxTicks = 6) => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !(max > min)) return [];
  const step = niceNum(niceNum(max - min, false) / Math.max(1, maxTicks - 1), true);
  if (!(step > 0)) return [];
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + step * 1e-6; v += step) {
    // collapse FP noise (e.g. 0.30000000000000004) to a clean value
    ticks.push(Number(v.toPrecision(12)));
  }
  return ticks;
};

// Compact tick label: integers for large magnitudes, ≤1 decimal otherwise.
export const formatTick = (v) => {
  if (!Number.isFinite(v)) return '';
  if (Math.abs(v) >= 100 || Number.isInteger(v)) return String(Math.round(v));
  return String(Number(v.toFixed(1)));
};

// Perceived-luminance test so text/axes flip to white on a dark (inverted) plot.
export const isDarkColor = (hex) => {
  if (typeof hex !== 'string') return false;
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return false;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
};

const escapeXml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const svgAnchor = (a) => (a === 'middle' || a === 'end' ? a : 'start');

/**
 * Serialise a chrome model + the plot content to a standalone SVG string.
 *
 * The molecule points are written as VECTOR <circle>s (clipped to the plot rect)
 * so the SVG stays crisp at any zoom — not a raster snapshot. An optional GL
 * snapshot can still be embedded as a raster backdrop (imageHref/imageRect).
 *
 * @param {{rects?:object[], lines?:object[], texts?:object[]}} model chrome model
 * @param {object} opts width/height, background, imageHref, imageRect, clipRect
 *   [x,y,w,h], points [{cx,cy,r,fill}], pointsOpacity
 * @returns {string}
 */
export const chromeToSvg = (model, {
  width, height, background, imageHref, imageRect, clipRect, points, pointsOpacity = 1,
}) => {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" `
    + `viewBox="0 0 ${width} ${height}">`,
    `<rect x="0" y="0" width="${width}" height="${height}" fill="${background}"/>`,
  ];
  if (imageHref && imageRect) {
    const [ix, iy, iw, ih] = imageRect;
    parts.push(
      `<image x="${ix}" y="${iy}" width="${iw}" height="${ih}" `
      + `preserveAspectRatio="none" href="${imageHref}"/>`,
    );
  }
  if (points?.length && clipRect) {
    const [cx, cy, cw, ch] = clipRect;
    parts.push(
      `<clipPath id="plotClip"><rect x="${cx}" y="${cy}" width="${cw}" height="${ch}"/></clipPath>`,
      `<g clip-path="url(#plotClip)" opacity="${pointsOpacity}">`,
    );
    points.forEach((p) => parts.push(
      `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${p.fill}"/>`,
    ));
    parts.push('</g>');
  }
  (model.rects ?? []).forEach((r) => {
    parts.push(
      `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}" `
      + `fill-opacity="${r.opacity ?? 1}"${r.rx ? ` rx="${r.rx}"` : ''}`
      + `${r.stroke ? ` stroke="${r.stroke}"` : ''}/>`,
    );
  });
  (model.lines ?? []).forEach((l) => {
    parts.push(
      `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="${l.stroke}" `
      + `stroke-width="${l.width ?? 1}" stroke-opacity="${l.opacity ?? 1}"/>`,
    );
  });
  (model.texts ?? []).forEach((t) => {
    const transform = t.rotate ? ` transform="rotate(${t.rotate} ${t.x} ${t.y})"` : '';
    parts.push(
      `<text x="${t.x}" y="${t.y}" font-family="${t.font ?? 'sans-serif'}" `
      + `font-size="${t.size}" fill="${t.color}" text-anchor="${svgAnchor(t.anchor)}" `
      + `dominant-baseline="${t.baseline ?? 'alphabetic'}"${transform}>${escapeXml(t.text)}</text>`,
    );
  });
  parts.push('</svg>');
  return parts.join('');
};

const canvasBaseline = (b) => {
  if (b === 'middle' || b === 'central') return 'middle';
  if (b === 'hanging' || b === 'text-before-edge') return 'top';
  return 'alphabetic';
};

/**
 * Draw a chrome model onto a 2D canvas context (for the PNG export). The GL
 * snapshot + background are drawn by the caller first; this paints the chrome on
 * top. `scale` multiplies all coordinates for a hi-DPI export.
 */
export const drawChromeToCanvas = (ctx, model, scale = 1) => {
  (model.rects ?? []).forEach((r) => {
    ctx.globalAlpha = r.opacity ?? 1;
    ctx.fillStyle = r.fill;
    ctx.fillRect(r.x * scale, r.y * scale, r.w * scale, r.h * scale);
    if (r.stroke) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = r.stroke;
      ctx.lineWidth = scale;
      ctx.strokeRect(r.x * scale, r.y * scale, r.w * scale, r.h * scale);
    }
  });
  (model.lines ?? []).forEach((l) => {
    ctx.globalAlpha = l.opacity ?? 1;
    ctx.strokeStyle = l.stroke;
    ctx.lineWidth = (l.width ?? 1) * scale;
    ctx.beginPath();
    ctx.moveTo(l.x1 * scale, l.y1 * scale);
    ctx.lineTo(l.x2 * scale, l.y2 * scale);
    ctx.stroke();
  });
  (model.texts ?? []).forEach((t) => {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = t.color;
    ctx.font = `${t.size * scale}px ${t.font ?? 'sans-serif'}`;
    ctx.textAlign = svgAnchor(t.anchor);
    ctx.textBaseline = canvasBaseline(t.baseline);
    if (t.rotate) {
      ctx.translate(t.x * scale, t.y * scale);
      ctx.rotate((t.rotate * Math.PI) / 180);
      ctx.fillText(t.text, 0, 0);
    } else {
      ctx.fillText(t.text, t.x * scale, t.y * scale);
    }
    ctx.restore();
  });
  ctx.globalAlpha = 1;
};
