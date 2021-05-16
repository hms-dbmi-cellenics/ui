import _ from 'lodash';
import {
  SAMPLES_DELETE,
  SAMPLES_ERROR,
  SAMPLES_SAVING,
  SAMPLES_SAVED,
} from '../../actionTypes/samples';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';

import saveSamples from './saveSamples';
import saveProject from '../projects/saveProject';

import pushNotificationMessage from '../notifications';
import getProjectSamples from '../../../utils/getProjectSamples';
import errorTypes from './errorTypes';

const deleteSamples = (
  sampleUuids,
) => async (dispatch, getState) => {
  const { samples, projects } = getState();

  if (!_.isArray(sampleUuids)) {
    // eslint-disable-next-line no-param-reassign
    sampleUuids = [sampleUuids];
  }

  const projectSamples = sampleUuids.reduce((acc, sampleUuid) => {
    if (!_.has(acc, samples[sampleUuid].projectUuid)) {
      acc[samples[sampleUuid].projectUuid] = [];
    }

    return {
      ...acc,
      [samples[sampleUuid].projectUuid]: [
        ...acc[samples[sampleUuid].projectUuid],
        sampleUuid,
      ],
    };
  }, {});
  dispatch({
    type: SAMPLES_SAVING,
    payload: {
      message: 'Deleting sample...',
    },
  });

  try {
    Object.entries(projectSamples).forEach(([projectUuid, samplesToDelete]) => {
      const samplesForAProject = getProjectSamples(projects, projectUuid, samples);
      const newSample = _.omit(samplesForAProject, samplesToDelete);
      newSample.ids = _.difference(samplesForAProject.ids, samplesToDelete.ids);

      const newProject = {
        ...projects[projectUuid],
        samples: _.difference(projects[projectUuid].samples, samplesToDelete),
      };

      dispatch(saveSamples(projectUuid, newSample, false, false));
      dispatch(saveProject(projectUuid, newProject, false));

      dispatch({
        type: SAMPLES_DELETE,
        payload: { sampleUuids: samplesToDelete },
      });

      dispatch({
        type: PROJECTS_UPDATE,
        payload: {
          projectUuid,
          project: {
            samples: _.difference(projects[projectUuid].samples, samplesToDelete),
          },
        },
      });
    });

    dispatch({
      type: SAMPLES_SAVED,
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.DELETE_SAMPLES);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorTypes.DELETE_SAMPLES,
      },
    });
  }
};

export default deleteSamples;
