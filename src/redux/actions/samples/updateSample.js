import _ from 'lodash';
import moment from 'moment';
import saveSamples from './saveSamples';

import {
  SAMPLES_UPDATE,
} from '../../actionTypes/samples';

const updateSample = (
  sampleUuid,
  sample,
) => async (dispatch, getState) => {
  const currentSample = getState().samples[sample.uuid];

  if (_.isEqual(currentSample, sample)) return null;

  // eslint-disable-next-line no-param-reassign
  sample.lastModified = moment().toISOString();

  dispatch({
    type: SAMPLES_UPDATE,
    payload: {
      sampleUuid,
      sample,
    },
  });

  dispatch(saveSamples(currentSample.projectUuid));
};

export default updateSample;
