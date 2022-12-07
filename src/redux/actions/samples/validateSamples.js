import {
  SAMPLES_VALIDATING_UPDATED,
} from 'redux/actionTypes/samples';

import SampleValidationError from 'utils/errors/upload/SampleValidationError';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import sampleValidators from 'utils/upload/sampleValidators';

const handleValidatorError = (e, sampleName) => {
  if (e instanceof SampleValidationError) {
    const errorMessage = `Error uploading sample ${sampleName}.\n${e.message}`;
    pushNotificationMessage('error', errorMessage, 15);
  } else {
    const errorMessage = `Error uploading sample ${sampleName}. Please send an email to hello@biomage.net with the sample files you're trying to upload.`;
    pushNotificationMessage('error', errorMessage);
    console.error(e.message);
  }
};

const validateSamples = (experimentId, samplesMap, technology) => async (dispatch) => {
  const samplesList = Object.entries(samplesMap);

  dispatch({
    type: SAMPLES_VALIDATING_UPDATED,
    payload: { experimentId, validating: true },
  });

  const results = await Promise.allSettled(samplesList.map(
    async ([sampleName, sample]) => {
      try {
        await sampleValidators[technology](sample);
        return [sampleName, sample];
      } catch (e) {
        handleValidatorError(e, sampleName);
        throw e;
      }
    },
  ));

  dispatch({
    type: SAMPLES_VALIDATING_UPDATED,
    payload: { experimentId, validating: false },
  });

  const validSamplesList = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);

  return validSamplesList;
};

export default validateSamples;
