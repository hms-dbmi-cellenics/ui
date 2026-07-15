const PADDING = 16; // px gap kept between the cursor/panel edge and the tooltip

// Position the hover tooltip next to the cursor without letting it spill out of
// the plot panel. Preference is to the right of / below the cursor; each axis
// flips to the other side only when that placement would overflow the real
// panel edge. A final clamp keeps the whole card inside the panel even when the
// tooltip is larger than the space on either side of the cursor (small
// split-view panels, tall multi-cell-set tooltips) — the flip alone can't cover
// that, which is what let the card fall outside the panel before.
const getCellInfoCoordinates = (coordinates, dimensions, boundingX, boundingY) => {
  const {
    width: popupWidth,
    height: popupHeight,
  } = dimensions;

  const {
    x: cursorX,
    y: cursorY,
  } = coordinates;

  const overflowsRight = cursorX + PADDING + popupWidth > boundingX;
  const overflowsBottom = cursorY + PADDING + popupHeight > boundingY;

  let left = overflowsRight ? cursorX - PADDING - popupWidth : cursorX + PADDING;
  let top = overflowsBottom ? cursorY - PADDING - popupHeight : cursorY + PADDING;

  // Keep the tooltip within [PADDING, edge - size - PADDING]. When the tooltip
  // is wider/taller than the panel this pins it to the top-left corner (the most
  // useful part stays visible) rather than flying off-screen.
  left = Math.max(PADDING, Math.min(left, boundingX - popupWidth - PADDING));
  top = Math.max(PADDING, Math.min(top, boundingY - popupHeight - PADDING));

  return { left, top };
};

export default getCellInfoCoordinates;
