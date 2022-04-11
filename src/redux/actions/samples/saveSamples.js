/* eslint-disable no-param-reassign */
import _ from 'lodash';
import fetchAPI from 'utils/http/fetchAPI';
import { SAMPLES_ERROR, SAMPLES_SAVING, SAMPLES_SAVED } from 'redux/actionTypes/samples';
import endUserMessages from 'utils/endUserMessages';
import handleError from 'utils/http/handleError';

const saveSamples = (
  projectUuid,
  newSample,
  addSample = true,
  notifySave = true,
  notifyUser = true,
) => async (dispatch, getState) => {
  const { projects, samples } = getState();

  let payload;

  const newSampleToUpload = _.cloneDeep(newSample);

  // add new sample to payload
  if (addSample) {
    const projectSamples = projects[projectUuid].samples.reduce((acc, sampleId) => {
      acc[sampleId] = samples[sampleId];
      return acc;
    }, {});

    // Do not save the fileObject to DynamoDB as it can not be serialized
    Object.keys(newSampleToUpload.files).forEach((file) => {
      delete newSampleToUpload.files[file].fileObject;
    });

    payload = projectSamples;
    payload[newSample.uuid] = newSampleToUpload;
  } else {
    payload = newSampleToUpload;
  }

  // This is set right now as there is only one experiment per project
  // Should be changed when we support multiple experiments per project
  const experimentId = projects[projectUuid].experiments[0];

  if (notifySave) {
    dispatch({
      type: SAMPLES_SAVING,
      payload: {
        message: endUserMessages.SAVING_SAMPLE,
      },
    });
  }

  const url = `/v1/projects/${projectUuid}/${experimentId}/samples`;
  try {
    await fetchAPI(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    if (notifySave) {
      dispatch({
        type: SAMPLES_SAVED,
      });
    }
  } catch (e) {
    // REVIEW is the payload in SAMPLES_ERROR needed?
    // the exception handling & user notification will
    // be called in the calling function
    // ideally this next line should be removed
    console.log(`catching exception and notify? ${notifyUser}`);
    const errorMessage = handleError(e, endUserMessages.ERROR_SAVING, notifyUser);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorMessage,
      },
    });

    // return Promise.reject(errorMessage);
    throw e;
  }
};

export default saveSamples;
