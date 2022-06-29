import _ from 'lodash';

import {
  SAMPLES_DELETE,
  SAMPLES_ERROR,
  SAMPLES_SAVING,
  SAMPLES_SAVED,
} from 'redux/actionTypes/samples';

import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

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
  sampleIds,
) => async (dispatch, getState) => {
  const { samples } = getState();

  const projectSamples = await sampleIds.reduce(async (acc, sampleUuid) => {
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
      async ([experimentId, samplesToDelete]) => {
        await Promise.all(sampleIds.map(async (sampleUuid) => {
          await fetchAPI(
            `/v2/experiments/${experimentId}/samples/${sampleUuid}`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
        }));

        dispatch({
          type: SAMPLES_DELETE,
          payload: { experimentId, sampleIds: samplesToDelete },
        });
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
