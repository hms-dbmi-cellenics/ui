const legendBaseState = {
  legend: {
    enabled: true,
    position: 'top-left',
    colour: '#000000',
  },
};

const dimensionsBaseState = {
  dimensions: {
    width: 400,
    height: 200,
  },
};

const axesBaseState = {
  axes: {
    xAxisText: '',
    yAxisText: '',
    labelSize: 12,
    tickSize: 13,
    offset: 0,
    gridLineWeight: 0,
  },
};

const titleBaseState = {
  title: {
    text: '',
    fontSize: 15,
    anchor: 'start',
  },
};

const fontStyleBaseState = {
  fontStyle: {
    value: 'Sans-serif',
    colour: '#000000',
  },
};

const colourBaseState = {
  colour: {
    masterColour: '#000000',
    gradient: 'viridis',
    toggleInvert: '#FFFFFF',
    invert: 'standard',
    reverseColourBar: false,
  },
};

const markerBaseState = {
  marker: {
    shape: 'circle',
    opacity: 5,
    size: 5,
  },
};

const labelBaseState = {
  label: {
    enabled: true,
    size: 28,
  },
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
