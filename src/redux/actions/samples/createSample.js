import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import {
  SAMPLES_CREATE,
} from '../../actionTypes/samples';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';

import { sampleTemplate } from '../../reducers/samples/initialState';

const createSample = (
  projectUuid,
  name,
  type,
) => async (dispatch, getState) => {
  const { projects } = getState();

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

  dispatch({
    type: PROJECTS_UPDATE,
    payload: {
      projectUuid,
      project: {
        samples: [...projects[projectUuid].samples, newSampleUuid],
      },
    },
  });

  return Promise.resolve(newSampleUuid);
};

export default createSample;
