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

import saveProject from '../projects/saveProject';

import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import fetchAPI from '../../../utils/fetchAPI';

const sendDeleteSamplesRequest = async (projectUuid, experimentId, sampleUuids) => {
  const response = await fetchAPI(
    `/v1/projects/${projectUuid}/${experimentId}/samples`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectUuid,
        experimentId,
        samples: { ids: sampleUuids },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.json().message);
  }
};

const deleteSamples = (
  sampleUuids,
) => async (dispatch, getState) => {
  const { samples, projects } = getState();

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
      message: endUserMessages.DELETING_SAMPLE,
    },
  });

  try {
    const deleteSamplesPromise = Object.entries(projectSamples).map(
      async ([projectUuid, samplesToDelete]) => {
        const newSamples = _.difference(projects[projectUuid].samples, samplesToDelete);

        const newProject = {
          ...projects[projectUuid],
          samples: newSamples,
        };

        // This is set right now as there is only one experiment per project
        // Should be changed when we support multiple experiments per project
        const experimentId = projects[projectUuid].experiments[0];

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
              samples: newSamples,
            },
          },
        });

        await sendDeleteSamplesRequest(projectUuid, experimentId, sampleUuids);
      },
    );

    await Promise.all(deleteSamplesPromise);

    dispatch({
      type: SAMPLES_SAVED,
    });
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_DELETING_SAMPLES);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: endUserMessages.ERROR_DELETING_SAMPLES,
      },
    });
  }
};

export default deleteSamples;
