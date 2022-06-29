import _ from 'lodash';

import { PROJECTS_METADATA_DELETE } from 'redux/actionTypes/experiments';
import { SAMPLES_METADATA_DELETE } from 'redux/actionTypes/samples';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

import endUserMessages from 'utils/endUserMessages';
import { metadataNameToKey } from 'utils/data-management/metadataUtils';

const deleteMetadataTrack = (
  name, experimentId,
) => async (dispatch, getState) => {
  const experiment = getState().experiments[experimentId];

  const metadataKey = metadataNameToKey(name);

  const newExperiment = _.cloneDeep(experiment);
  newExperiment.metadataKeys = experiment.metadataKeys.filter((key) => key !== metadataKey);

  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/metadataTracks/${metadataKey}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    dispatch({
      type: PROJECTS_METADATA_DELETE,
      payload: {
        key: metadataKey,
        projectUuid: experimentId,
      },
    });

    experiment.sampleIds.forEach((sampleUuid) => dispatch({
      type: SAMPLES_METADATA_DELETE,
      payload: {
        sampleUuid,
        metadataKey,
      },
    }));
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default deleteMetadataTrack;
