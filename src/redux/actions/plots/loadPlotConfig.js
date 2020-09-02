import _ from 'lodash';
import { LOAD_PLOT_CONFIG } from '../../actionTypes/plots';
import getApiEndpoint from '../../../utils/apiEndpoint';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';
import { initialPlotConfigStates } from '../../reducers/plots/initialState';

const loadPlotConfig = (experimentId, plotUuid, type) => async (dispatch) => {
  try {
    const response = await fetch(
      `${getApiEndpoint()}/v1/experiments/${experimentId}/plots-tables/${plotUuid}`,
    );
    if (response.ok) {
      const data = await response.json();
      dispatch({
        type: LOAD_PLOT_CONFIG,
        payload: data,
      });
    } else if (response.status === 404) {
      dispatch({
        type: LOAD_PLOT_CONFIG,
        payload: {
          experimentId,
          plotUuid,
          type,
          config: _.cloneDeep(initialPlotConfigStates[type]),
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
