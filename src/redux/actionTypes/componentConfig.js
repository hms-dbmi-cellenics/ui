/**
 * Sets plot configs and data.
 */
const COMPONENT_CONFIG = 'componentConfig';
const LOAD_CONFIG = `${COMPONENT_CONFIG}/load`;
const UPDATE_CONFIG = `${COMPONENT_CONFIG}/update`;
const SAVE_CONFIG = `${COMPONENT_CONFIG}/save`;

const PLOT_DATA_LOADED = `${COMPONENT_CONFIG}/plotDataLoaded`;
const PLOT_DATA_LOADING = `${COMPONENT_CONFIG}/plotDataLoading`;
const PLOT_DATA_ERROR = `${COMPONENT_CONFIG}/plotDataError`;

export {
  LOAD_CONFIG, UPDATE_CONFIG, SAVE_CONFIG,
  PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR,
};
