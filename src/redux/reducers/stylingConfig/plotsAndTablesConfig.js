import baseState from './baseState';

const continuousEmbedding = {
  ...baseState,
};

const categoricalEmbedding = {
  ...baseState,
};

const heatMap = {
  ...baseState,
};

const volcanoPlot = {
  ...baseState,
};

const frequencyPlot = {
  ...baseState,
};

const initialState = {
  continuousEmbedding,
  categoricalEmbedding,
  heatMap,
  volcanoPlot,
  frequencyPlot,
};

export default initialState;
export {
  continuousEmbedding,
  categoricalEmbedding,
  heatMap,
  volcanoPlot,
  frequencyPlot,
};
