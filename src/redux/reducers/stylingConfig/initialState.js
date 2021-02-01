import baseState from './baseState';

// Plots in Data processing
const cellSizeAndDistribution = {
  ...baseState,
};

const mitochondrialContent = {
  ...baseState,
};

const readAlignment = {
  ...baseState,
};

const classifier = {
  ...baseState,
};

const numberOfGenesVsNumberOfUMIs = {
  ...baseState,
};

const doubletScores = {
  ...baseState,
};

const configureEmbedding = {
  ...baseState,
};

// Plots in Plots and Tables
const embeddingCategoricalMain = {
  ...baseState,
};

const embeddingContinuousMain = {
  ...baseState,
};

const heatMap = {
  ...baseState,
};

const frequencyPlot = {
  ...baseState,
};

const volcanoPlot = {
  ...baseState,
};

const initialState = {
  cellSizeAndDistribution,
  mitochondrialContent,
  readAlignment,
  classifier,
  numberOfGenesVsNumberOfUMIs,
  doubletScores,
  configureEmbedding,
  embeddingContinuousMain,
  embeddingCategoricalMain,
  heatMap,
  volcanoPlot,
  frequencyPlot,
};

export default initialState;
export {
  cellSizeAndDistribution,
  mitochondrialContent,
  readAlignment,
  classifier,
  numberOfGenesVsNumberOfUMIs,
  doubletScores,
  configureEmbedding,
  embeddingContinuousMain,
  embeddingCategoricalMain,
  heatMap,
  volcanoPlot,
  frequencyPlot,
};
