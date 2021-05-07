import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import {
  SAMPLES_CREATE,
} from '../../actionTypes/samples';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';
import saveSamples from './saveSamples';
import saveProject from '../projects/saveProject';

import { sampleTemplate } from '../../reducers/samples/initialState';

const createSample = (
  projectUuid,
  name,
  type,
) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];

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
        samples: [...project?.samples, newSampleUuid],
      },
    },
  });

  dispatch(saveSamples(projectUuid));
  dispatch(saveProject(projectUuid));

  return Promise.resolve(newSampleUuid);
};

export default createSample;
