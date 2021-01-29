const legendBaseState = {
  show: true,
  position: {
    value: 'topRight',
    options: ['topRight', 'topLeft', 'bottomLeft', 'bottomRight'],
  },
};

const dimensionsBaseState = {
  width: {
    value: 400,
    range: [400, 789],
  },
  height: {
    value: 200,
    range: [200, 560],
  },
};

const axesBaseState = {
  xTitle: '',
  yTitle: '',
  labelSize: {
    value: 12,
    range: [5, 21],
  },
  tickSize: {
    value: 13,
    range: [5, 21],
  },
  offsetMargin: {
    value: 0,
    range: [0, 20],
  },
  gridLineWeight: {
    value: 0,
    range: [0, 10],
  },
};

const titleBaseState = {
  text: '',
  fontSize: {
    value: 15,
    range: [15, 40],
  },
  location: {
    value: 'left',
    options: ['left', 'middle'],
  },
};

const fontStyleBaseState = {
  value: 'Sans-serif',
  options: ['Sans-serif', 'Sans', 'Monospace'],
};

const colourBaseState = {
  styles: {
    value: 'viridis',
    options: ['viridis', 'inferno', 'spectral', 'red-blue'],
  },
  invert: {
    value: 'standard',
    options: ['standard', 'invert'],
  },
};

const markerBaseState = {
  pointStyle: {
    size: {
      value: 1,
      range: [1, 100],
    },
    fillOpacity: {
      value: 1,
      range: [1, 10],
    },
  },
  pointShape: {
    value: 'circle',
    options: ['circlce', 'diamond'],
  },
};

const labelBaseState = {
  show: true,
  size: {
    value: 28,
    range: [0, 50],
  },
};

const baseState = {
  legend: legendBaseState,
  dimensions: dimensionsBaseState,
  axes: axesBaseState,
  title: titleBaseState,
  fontStyle: fontStyleBaseState,
  colour: colourBaseState,
  marker: markerBaseState,
  label: labelBaseState,
};

export default baseState;
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
