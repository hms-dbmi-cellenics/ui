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
  samples: sampleReducer,
});
