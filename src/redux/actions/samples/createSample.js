import moment from 'moment';
import hash from 'object-hash';

import {
  SAMPLES_CREATE,
} from '../../actionTypes/samples';
import { sampleTemplate } from '../../reducers/samples/initialState';

const createSample = (
  sampleName,
) => async (dispatch) => {
  const newSample = {
    ...sampleTemplate,
    name: sampleName,
    uuid: hash(sampleName + moment().format('DDMMYYY')),
  };

  dispatch({
    type: SAMPLES_CREATE,
    payload: { sample: newSample },
  });
};

export default createSample;
