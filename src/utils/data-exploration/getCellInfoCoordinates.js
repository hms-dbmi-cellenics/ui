const EM = 16; // px
const CELLINFO_Y_PADDING = 2 * EM;

const getCellInfoCoordinates = (coordinates, el, boundingX, boundingY) => {
  const popupWidth = el?.offsetWidth || 0;
  const popupHeight = el?.offsetHeight || 0;

  const invertX = () => coordinates.x + popupWidth > boundingX;
  const invertY = () => coordinates.y + popupHeight + CELLINFO_Y_PADDING > boundingY;

  const left = invertX() ? coordinates.x - (popupWidth + EM) : coordinates.x + EM;
  const top = invertY() ? coordinates.y - (popupHeight + EM) : coordinates.y + EM;

  return { left, top };
};

export default getCellInfoCoordinates;
