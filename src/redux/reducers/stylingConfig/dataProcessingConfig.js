import baseState from './baseState';

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

const initialState = {
  cellSizeAndDistribution,
  mitochondrialContent,
  readAlignment,
  classifier,
  numberOfGenesVsNumberOfUMIs,
  doubletScores,
  configureEmbedding,
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
};
