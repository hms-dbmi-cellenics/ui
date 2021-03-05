import _ from 'lodash';

import {
  SAMPLES_UPDATE,
} from '../../actionTypes/samples';

const updateSample = (
  sample,
) => async (dispatch, getState) => {
  const currentSample = getState().samples[sample.uuid];

  if (_.isEqual(currentSample, sample)) return null;

  dispatch({
    type: SAMPLES_UPDATE,
    payload: { sample },
  });
};

export default updateSample;
