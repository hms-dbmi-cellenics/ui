import _ from 'lodash';
import { LOAD_CONFIG } from '../../actionTypes/componentConfig';
import getApiEndpoint from '../../../utils/apiEndpoint';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';
import { initialPlotConfigStates } from '../../reducers/componentConfig/initialState';

const loadPlotConfig = (experimentId, plotUuid, plotType) => async (dispatch) => {
  try {
    const response = await fetch(
      `${getApiEndpoint()}/v1/experiments/${experimentId}/plots-tables/${plotUuid}`,
    );
    if (response.ok) {
      const data = await response.json();
      dispatch({
        type: LOAD_CONFIG,
        payload: data,
      });
    } else if (response.status === 404) {
      dispatch({
        type: LOAD_CONFIG,
        payload: {
          experimentId,
          plotUuid,
          type: plotType,
          config: _.cloneDeep(initialPlotConfigStates[plotType]),
        },
      });
    } else {
      throw new Error('Server sent back different error or json conversion failed.');
    }
  } catch (e) {
    dispatch(pushNotificationMessage('error', messages.saveCellSets, 10));
  }
};

export default loadPlotConfig;
