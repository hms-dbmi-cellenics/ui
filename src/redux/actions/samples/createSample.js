import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import {
  SAMPLES_CREATE,
} from '../../actionTypes/samples';
import { sampleTemplate } from '../../reducers/samples/initialState';

const createSample = (
  projectUuid,
  name,
  type,
) => async (dispatch) => {
  const createdAt = moment().toISOString();

  const newSampleUuid = uuidv4();

  const newSample = {
    ...sampleTemplate,
    name,
    type,
    projectUuid,
    uuid: newSampleUuid,
    createdDate: createdAt,
    lastModified: createdAt,
  };

  dispatch({
    type: SAMPLES_CREATE,
    payload: { sample: newSample },
  });

  return Promise.resolve(newSampleUuid);
};

export default createSample;
