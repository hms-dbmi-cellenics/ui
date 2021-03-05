import moment from 'moment';
import hash from 'object-hash';

import {
  SAMPLES_CREATE,
} from '../../actionTypes/samples';
// import { projectTemplate } from '../../reducers/projects/initialState';

const createSample = (
  sampleName,
) => async (dispatch) => {
  const createdAt = moment().local().format('DD MMM YYYY, HH:mm:ss [GMT]Z');

  const newSample = {
    // ...projectTemplate,
    name: sampleName,
    uuid: hash(sampleName + moment().format('DDMMYYY')).slice(0, 10),
    createdDate: createdAt,
    lastModified: createdAt,
  };

  dispatch({
    type: SAMPLES_CREATE,
    payload: { sample: newSample },
  });
};

export default createSample;
