const legendBaseState = {
  enabled: true,
  showAlert: false,
  position: 'right',
  colour: '#000000',
};

const dimensionsBaseState = {
  width: 500,
  height: 500,
};

const axesBaseState = {
  xAxisText: '',
  yAxisText: '',
  titleFontSize: 13,
  labelFontSize: 12,
  offset: 0,
  gridOpacity: 0,
  gridWidth: 10,
  domainWidth: 1,
  xAxisRotateLabels: false,
  enabled: true,
};

const axesRangesBaseState = {
  xAxisAuto: true,
  yAxisAuto: true,
  xMin: 0,
  xMax: 10,
  yMin: 0,
  yMax: 10,
};

const titleBaseState = {
  text: '',
  fontSize: 15,
  anchor: 'start',
  dx: 10,
};

const fontStyleBaseState = {
  font: 'sans-serif',
  colour: '#000000',
};

const colourBaseState = {
  masterColour: '#000000',
  gradient: 'default',
  toggleInvert: '#FFFFFF',
  invert: 'standard',
  reverseColourBar: false,
};

const markerBaseState = {
  shape: 'circle',
  showOpacity: true,
  opacity: 5,
  size: 5,
};

const labelBaseState = {
  enabled: true,
  size: 18,
};

export {
  legendBaseState,
  dimensionsBaseState,
  axesBaseState,
  axesRangesBaseState,
  titleBaseState,
  fontStyleBaseState,
  colourBaseState,
  markerBaseState,
  labelBaseState,
};
