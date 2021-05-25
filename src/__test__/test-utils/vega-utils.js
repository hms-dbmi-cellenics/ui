import * as rtl from '@testing-library/react';

const expectStringInVegaCanvas = async (str, ocurrences, waitForOptions) => {
  const getCanvas = () => rtl.screen.getByRole('graphics-document').children[0];
  // eslint-disable-next-line no-underscore-dangle
  const getCanvasStrings = (canvas) => canvas.getContext('2d').__getEvents()
    .filter((event) => event.type === 'fillText')
    .map((event) => event.props.text);
  const canvas = getCanvas();
  const onTimeout = (error) => {
    console.log(`Could not find ${ocurrences} ocurrences of "${str}" in the canvas. I found these: ${getCanvasStrings(canvas)}`);
    return error;
  };
  await rtl.waitFor(() => {
    const strings = getCanvasStrings(canvas);
    expect(strings.filter((inCanvas) => inCanvas.includes(str)).length).toBe(ocurrences);
  }, { ...waitForOptions, onTimeout });
};

export {
  // eslint-disable-next-line import/prefer-default-export
  expectStringInVegaCanvas,
};
