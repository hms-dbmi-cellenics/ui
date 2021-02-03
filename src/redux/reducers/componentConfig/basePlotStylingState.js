const legendBaseState = {
  enabled: true,
  position: 'top-right',
  colour: '#000000',
};

const dimensionsBaseState = {
  width: 500,
  height: 500,
};

const axesBaseState = {
  xAxisText: '',
  yAxisText: '',
  labelFontSize: 12,
  tickSize: 13,
  offset: 0,
  gridOpacity: 0,
  gridWidth: 10,
};

const titleBaseState = {
  text: '',
  fontSize: 15,
  anchor: 'start',
};

const fontStyleBaseState = {
  font: 'sans-serif',
  colour: '#000000',
};

const colourBaseState = {
  masterColour: '#000000',
  gradient: 'viridis',
  toggleInvert: '#FFFFFF',
  invert: 'standard',
  reverseColourBar: false,
};

const markerBaseState = {
  shape: 'circle',
  opacity: 5,
  size: 5,
};

const labelBaseState = {
  enabled: true,
  size: 28,
};

export {
  legendBaseState,
  dimensionsBaseState,
  axesBaseState,
  titleBaseState,
  fontStyleBaseState,
  colourBaseState,
  markerBaseState,
  labelBaseState,
};
