import _ from 'lodash';
import moment from 'moment';

import {
  SAMPLES_CREATED, SAMPLES_ERROR, SAMPLES_SAVED, SAMPLES_SAVING,
} from 'redux/actionTypes/samples';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

import { METADATA_DEFAULT_VALUE } from 'redux/reducers/experiments/initialState';
import { defaultSampleOptions, sampleTemplate } from 'redux/reducers/samples/initialState';
import { sampleTech } from 'utils/constants';
import UploadStatus from 'utils/upload/UploadStatus';

const createSamples = (
  experimentId,
  newSamples,
  sampleTechnology,
) => async (dispatch, getState) => {
  dispatch({
    type: SAMPLES_SAVING,
    payload: {
      message: endUserMessages.SAVING_SAMPLE,
    },
  });

  const experiment = getState().experiments[experimentId];
  const { samples } = getState();

  const createdDate = moment().toISOString();

  if (!Object.values(sampleTech).includes(sampleTechnology)) throw new Error(`Sample technology ${sampleTechnology} is not recognized`);

  let options = defaultSampleOptions[sampleTechnology] || {};

  // If there are other samples in the same experiment, use the options value from the other samples
  if (experiment.sampleIds.length) {
    const firstSampleId = experiment.sampleIds[0];
    options = samples[firstSampleId].options;
  }

  const alreadyCreatedSampleIds = {};

  experiment.sampleIds.forEach((sampleId) => {
    const [
      repeatedSampleName = null,
    ] = newSamples.find(([name]) => name === samples[sampleId].name) ?? [];

    if (!repeatedSampleName) return;

    alreadyCreatedSampleIds[repeatedSampleName] = sampleId;
  });

  const url = `/v2/experiments/${experimentId}/samples`;

  const sampleToCreate = newSamples
    // Upload only the samples that don't have a repeated name
    .filter(([name]) => !alreadyCreatedSampleIds[name])
    .map(([name]) => ({
      name,
      sampleTechnology,
      options,
    }));

  if (sampleToCreate.length === 0) {
    dispatch({ type: SAMPLES_SAVED });

    return alreadyCreatedSampleIds;
  }

  try {
    const newSampleIdsByName = await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleToCreate),
      },
    );

    const sampleIdsByName = { ...alreadyCreatedSampleIds, ...newSampleIdsByName };

    const newSamplesToRedux = newSamples
      .map(([name, { files }]) => ({
        ..._.cloneDeep(sampleTemplate),
        name,
        type: sampleTechnology,
        experimentId,
        uuid: sampleIdsByName[name],
        createdDate,
        lastModified: createdDate,
        options,
        metadata: experiment?.metadataKeys
          .reduce((acc, curr) => ({ ...acc, [curr]: METADATA_DEFAULT_VALUE }), {}) || {},
        files: Object.values(files).reduce(((acc, curr) => (
          { ...acc, [curr.name]: { upload: { status: UploadStatus.UPLOADING } } }
        )), {}),
      }));

    dispatch({
      type: SAMPLES_CREATED,
      payload: {
        experimentId,
        samples: newSamplesToRedux,
      },
    });

    dispatch({ type: SAMPLES_SAVED });

    return sampleIdsByName;
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_CREATING_SAMPLE);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorMessage,
      },
    });

    // throw again the error so `processUpload` won't upload the sample
    throw new Error(errorMessage);
  }
};

export default createSamples;
