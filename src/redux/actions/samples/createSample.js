import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

import {
  SAMPLES_CREATE, SAMPLES_RESTORE,
} from '../../actionTypes/samples';

import {
  PROJECTS_RESTORE,
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';
import saveSamples from './saveSamples';
import saveProject from '../projects/saveProject';
import pushNotificationMessage from '../pushNotificationMessage';
import errorTypes from './errorTypes';

import { sampleTemplate } from '../../reducers/samples/initialState';

const createSample = (
  projectUuid,
  name,
  type,
) => async (dispatch, getState) => {
  const currentProjectState = getState().projects;
  const currentSampleState = getState().samples;

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

  try {
    dispatch({
      type: SAMPLES_CREATE,
      payload: { sample: newSample },
    });

    dispatch({
      type: PROJECTS_UPDATE,
      payload: {
        projectUuid,
        project: {
          samples: [...currentProjectState?.samples || [], newSampleUuid],
        },
      },
    });

    dispatch(saveSamples(projectUuid));
    dispatch(saveProject(projectUuid));
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_PROJECT);

    dispatch({
      type: PROJECTS_RESTORE,
      state: currentProjectState,
    });

    dispatch({
      type: SAMPLES_RESTORE,
      state: currentSampleState,
    });
  }

  return Promise.resolve(newSampleUuid);
};

export default createSample;
