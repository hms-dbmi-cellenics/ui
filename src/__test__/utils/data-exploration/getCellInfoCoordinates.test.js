import getCellInfoCoordinates from 'utils/data-exploration/getCellInfoCoordinates';

const PADDING = 16;
const panel = { boundingX: 500, boundingY: 500 };
const popup = { width: 120, height: 80 };

const coords = (x, y) => getCellInfoCoordinates(
  { x, y }, popup, panel.boundingX, panel.boundingY,
);

const withinPanel = ({ left, top }) => (
  left >= 0
  && top >= 0
  && left + popup.width <= panel.boundingX
  && top + popup.height <= panel.boundingY
);

describe('getCellInfoCoordinates', () => {
  it('places the tooltip below-right of the cursor when there is room', () => {
    const { left, top } = coords(100, 200);
    expect(left).toBe(100 + PADDING);
    expect(top).toBe(200 + PADDING);
  });

  it('flips to the left of the cursor when it would overflow the right edge', () => {
    const { left } = coords(450, 200); // 450 + 16 + 120 > 500
    expect(left).toBe(450 - PADDING - popup.width);
  });

  it('flips above the cursor when it would overflow the bottom edge', () => {
    const { top } = coords(100, 480); // 480 + 16 + 80 > 500
    expect(top).toBe(480 - PADDING - popup.height);
  });

  it('never falls outside the panel near the top-left edge', () => {
    // cursor in the corner: flipping left/up alone would go negative
    const result = coords(2, 2);
    expect(withinPanel(result)).toBe(true);
    expect(result.left).toBeGreaterThanOrEqual(0);
    expect(result.top).toBeGreaterThanOrEqual(0);
  });

  it('never falls outside the panel near the bottom-right edge', () => {
    const result = coords(498, 498);
    expect(withinPanel(result)).toBe(true);
  });

  it('stays inside the panel when a tall tooltip flips above the cursor', () => {
    // tall tooltip, cursor low in the panel — the flip used to push `top`
    // negative; it must land fully inside instead
    const tall = { width: 120, height: 220 };
    const { left, top } = getCellInfoCoordinates({ x: 40, y: 300 }, tall, 300, 400);
    expect(top).toBeGreaterThanOrEqual(PADDING);
    expect(top + tall.height).toBeLessThanOrEqual(400 - PADDING);
    expect(left).toBeGreaterThanOrEqual(PADDING);
  });

  it('pins to the top-left corner when the tooltip is larger than the panel', () => {
    const huge = { width: 600, height: 600 };
    const { left, top } = getCellInfoCoordinates({ x: 100, y: 100 }, huge, 400, 400);
    expect(left).toBe(PADDING);
    expect(top).toBe(PADDING);
  });
});
