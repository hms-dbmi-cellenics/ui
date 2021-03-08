/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import cellInfoReducer from './cellInfo';
import cellMetaReducer from './cellMeta';
import cellSetsReducer from './cellSets';
import componentConfigReducer from './componentConfig/index';
import differentialExpressionReducer from './differentialExpression';
import embeddingsReducer from './embeddings';
import experimentSettingsReducer from './experimentSettings';
import genesReducer from './genes';
import layoutReducer from './layout/layout';
import notificationsReducer from './notificationsReducer';
import projectsReducer from './projects';
import sampleReducer from './samples';

export default combineReducers({
  cellInfo: cellInfoReducer,
  cellMeta: cellMetaReducer,
  cellSets: cellSetsReducer,
  componentConfig: componentConfigReducer,
  differentialExpression: differentialExpressionReducer,
  embeddings: embeddingsReducer,
  experimentSettings: experimentSettingsReducer,
  genes: genesReducer,
  layout: layoutReducer,
  notifications: notificationsReducer,
  projects: projectsReducer,
  samples: sampleReducer,
});
