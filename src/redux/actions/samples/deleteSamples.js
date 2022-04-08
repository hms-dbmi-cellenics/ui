import _ from 'lodash';

import {
  SAMPLES_DELETE,
  SAMPLES_ERROR,
  SAMPLES_SAVING,
  SAMPLES_SAVED,
  SAMPLES_DELETE_API_V1,
} from 'redux/actionTypes/samples';

import {
  PROJECTS_UPDATE,
} from 'redux/actionTypes/projects';

import saveProject from 'redux/actions/projects/saveProject';

import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import { updateExperiment } from 'redux/actions/experiments';
import handleError from 'utils/http/handleError';

import config from 'config';
import { api } from 'utils/constants';

const sendDeleteSamplesRequest = async (projectUuid, experimentId, sampleUuids) => {
  await fetchAPI(
    `/v1/projects/${projectUuid}/${experimentId}/samples`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: sampleUuids,
      }),
    },
  );
};

const sendDeleteSamplesRequestApiV2 = async (experimentId, sampleUuids) => {
  await Promise.all(sampleUuids.map(async (sampleUuid) => {
    const response = await fetchAPI(
      `/v2/experiments/${experimentId}/samples/${sampleUuid}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(await response.json().message);
    }
  }));
};

const cancelUploads = async (files) => {
  const promises = Object.values(files).map(({ upload }) => {
    if (upload?.amplifyPromise) {
      // return Storage.cancel(upload.amplifyPromise);
    }
    return Promise.resolve();
  });

  return Promise.all(promises);
};

const deleteSamples = (
  sampleUuids,
) => async (dispatch, getState) => {
  const { samples, projects } = getState();

  const projectSamples = await sampleUuids.reduce(async (acc, sampleUuid) => {
    const { projectUuid, files } = samples[sampleUuid];

    if (!_.has(acc, samples[sampleUuid].projectUuid)) {
      acc[samples[sampleUuid].projectUuid] = [];
    }

    await cancelUploads(files);

    return {
      ...acc,
      [projectUuid]: [
        ...acc[projectUuid],
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

        if (config.currentApiVersion === api.V1) {
          await sendDeleteSamplesRequest(projectUuid, experimentId, sampleUuids);

          dispatch(saveProject(projectUuid, newProject, false));

          dispatch({
            type: PROJECTS_UPDATE,
            payload: {
              projectUuid,
              project: {
                samples: newSamples,
              },
            },
          });

          dispatch({
            type: SAMPLES_DELETE_API_V1,
            payload: { sampleUuids: samplesToDelete },
          });

          dispatch(updateExperiment(experimentId, { sampleIds: newSamples }));
        } else if (config.currentApiVersion === api.V2) {
          await sendDeleteSamplesRequestApiV2(experimentId, sampleUuids);

          dispatch({
            type: SAMPLES_DELETE,
            payload: { projectUuid, experimentId, sampleUuids: samplesToDelete },
          });
        }
      },
    );
    await Promise.all(deleteSamplesPromise);

    dispatch({
      type: SAMPLES_SAVED,
    });
  } catch (e) {
    handleError(e, endUserMessages.ERROR_DELETING_SAMPLES);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: endUserMessages.ERROR_DELETING_SAMPLES,
      },
    });
  }
};

export default deleteSamples;
