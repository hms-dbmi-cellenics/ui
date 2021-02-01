import dataProcessingInitialConfig from './dataProcessingConfig';
import plotsAndTablesInitialConfig from './plotsAndTablesConfig';

const initialState = {
  ...dataProcessingInitialConfig,
  ...plotsAndTablesInitialConfig,
};

export default initialState;
