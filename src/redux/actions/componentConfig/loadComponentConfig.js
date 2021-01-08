import _ from 'lodash';
import { LOAD_CONFIG } from '../../actionTypes/componentConfig';
import { initialComponentConfigStates } from '../../reducers/componentConfig/initialState';

const loadComponentConfig = (experimentId, plotUuid, type) => (dispatch) => {
  dispatch({
    type: LOAD_CONFIG,
    payload: {
      experimentId,
      plotUuid,
      type,
      config: _.cloneDeep(initialComponentConfigStates[type]),
    },
  });
};

export default loadComponentConfig;
