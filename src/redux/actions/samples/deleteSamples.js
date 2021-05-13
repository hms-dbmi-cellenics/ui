import _ from 'lodash';
import {
  SAMPLES_DELETE,
  SAMPLES_DELETING,
  SAMPLES_DELETED,
  SAMPLES_ERROR,
} from '../../actionTypes/samples';

import {
  PROJECTS_UPDATE,
} from '../../actionTypes/projects';

import saveSamples from './saveSamples';
import { saveProject } from '../projects';

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
    type: SAMPLES_DELETING,
  });

  try {
    Object.entries(projectSamples).forEach(([projectUuid, samplesToDelete]) => {
      const samplesForAProject = getProjectSamples(projects, projectUuid, samples);

      const newSample = _.omit(samplesForAProject, samplesToDelete);
      newSample.ids = _.difference(samplesForAProject.ids, samplesToDelete);

      const newProject = {
        ...projects[projectUuid],
        samples: _.difference(projects[projectUuid].sampels, samplesToDelete),
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
      type: SAMPLES_DELETED,
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
