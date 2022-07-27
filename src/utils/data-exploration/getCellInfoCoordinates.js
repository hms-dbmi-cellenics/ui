const PDDG_TOP = 16; // px
const PDDG_BOTTOM = 16; // px
const PDDG_RIGHT = 16; // px

const CUTOFF = 3 / 4;

const getCellInfoCoordinates = (coordinates, dimensions, boundingX, boundingY) => {
  const {
    width: popupWidth,
    height: popupHeight,
  } = dimensions;

  const {
    x: cursorX,
    y: cursorY,
  } = coordinates;

  const invertX = () => cursorX + popupWidth > boundingX * CUTOFF;

  // Padding bottom is removed from boundingY because the embedding
  // has a padding at the top part of the embedding
  const invertY = () => cursorY + popupHeight + PDDG_TOP + PDDG_BOTTOM > boundingY * CUTOFF;

  const left = invertX() ? cursorX - (popupWidth + PDDG_RIGHT) : cursorX + PDDG_RIGHT;
  const top = invertY() ? cursorY - (popupHeight + PDDG_BOTTOM) : cursorY + PDDG_BOTTOM;

  return { left, top };
};

export default getCellInfoCoordinates;
