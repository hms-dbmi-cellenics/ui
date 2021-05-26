import _ from 'lodash';
import fetchAPI from '../../../utils/fetchAPI';
import { LOAD_CONFIG } from '../../actionTypes/componentConfig';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import messages from '../../../components/notification/messages';
import { initialPlotConfigStates } from '../../reducers/componentConfig/initialState';

const loadPlotConfig = (experimentId, plotUuid, plotType) => async (dispatch) => {
  try {
    const response = await fetchAPI(
      `/v1/experiments/${experimentId}/plots-tables/${plotUuid}`,
    );
    if (response.ok) {
      const data = await response.json();
      const config = _.merge({}, initialPlotConfigStates[plotType], data.config);
      dispatch({
        type: LOAD_CONFIG,
        payload: {
          ...data,
          plotType,
          config,
        },
      });
    } else if (response.status === 404) {
      dispatch({
        type: LOAD_CONFIG,
        payload: {
          experimentId,
          plotUuid,
          plotType,
          plotData: [],
          config: _.cloneDeep(initialPlotConfigStates[plotType]),
        },
      });
    } else {
      throw new Error('Server sent back different error or json conversion failed.');
    }
  } catch (e) {
    pushNotificationMessage('error', messages.connectionError, 10);
  }
};

export default loadPlotConfig;
