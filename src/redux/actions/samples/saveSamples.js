/* eslint-disable no-param-reassign */
import _ from 'lodash';
import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import { SAMPLES_ERROR, SAMPLES_SAVING, SAMPLES_SAVED } from '../../actionTypes/samples';

const saveSamples = (
  projectUuid,
  newSample,
  addSample = true,
  notifySave = true,
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
    const response = await fetchAPI(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);

    if (notifySave) {
      dispatch({
        type: SAMPLES_SAVED,
      });
    }
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.ERROR_SAVING;
    }
    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: message,
      },
    });
    pushNotificationMessage('error', message);
    return Promise.reject(message);
  }
};

export default saveSamples;
