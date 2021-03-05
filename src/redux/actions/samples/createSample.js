import { v4 as uuidv4 } from 'uuid';

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
    uuid: uuidv4(),
  };

  dispatch({
    type: SAMPLES_CREATE,
    payload: { sample: newSample },
  });
};

export default createSample;
