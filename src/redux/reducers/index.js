/* eslint-disable no-param-reassign */
import { combineReducers } from 'redux';
import cellSetsReducer from './cellSets';
import notificationsReducer from './notificationsReducer';
import embeddingsReducer from './embeddings';
import genesReducer from './genes';
import differentialExpressionReducer from './differentialExpression';
import layoutReducer from './layout/layout';
import componentConfigReducer from './componentConfig/index';
import cellInfoReducer from './cellInfo';
import experimentSettingsReducer from './experimentSettings';
import cellMetaReducer from './cellMeta';
import projectsReducer from './projects';

export default combineReducers({
  projects: projectsReducer,
  experimentSettings: experimentSettingsReducer,
  componentConfig: componentConfigReducer,
  cellSets: cellSetsReducer,
  notifications: notificationsReducer,
  embeddings: embeddingsReducer,
  genes: genesReducer,
  differentialExpression: differentialExpressionReducer,
  cellInfo: cellInfoReducer,
  layout: layoutReducer,
  cellMeta: cellMetaReducer,
});
