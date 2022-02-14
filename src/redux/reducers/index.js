/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import cellInfoReducer from './cellInfo';
import cellMetaReducer from './cellMeta';
import cellSetsReducer from './cellSets';
import componentConfigReducer from './componentConfig/index';
import differentialExpressionReducer from './differentialExpression';
import embeddingsReducer from './embeddings';
import experimentsReducer from './experiments';
import experimentSettingsReducer from './experimentSettings';
import genesReducer from './genes';
import layoutReducer from './layout';
import projectsReducer from './projects';
import sampleReducer from './samples';
import networkResourcesReducer from './networkResources';
import backendStatusReducer from './backendStatus';
import { EXPERIMENTS_SWITCH } from '../actionTypes/experiments';

const appReducers = combineReducers({
  cellInfo: cellInfoReducer,
  cellMeta: cellMetaReducer,
  cellSets: cellSetsReducer,
  componentConfig: componentConfigReducer,
  differentialExpression: differentialExpressionReducer,
  embeddings: embeddingsReducer,
  experiments: experimentsReducer,
  experimentSettings: experimentSettingsReducer,
  backendStatus: backendStatusReducer,
  genes: genesReducer,
  layout: layoutReducer,
  projects: projectsReducer,
  samples: sampleReducer,
  networkResources: networkResourcesReducer,
});

const rootReducer = (state, action) => {
  let newState = state;
  if (action.type === EXPERIMENTS_SWITCH) {
    // we need to keep the old state for these parts of the store
    newState = {
      networkResources: state.networkResources,
      samples: state.samples,
      projects: state.projects,
      backendStatus: state.backendStatus,
      experiments: state.experiments,
    };
  }
  return appReducers(newState, action);
};

export default rootReducer;
