import _ from 'lodash';

import {
  PROJECTS_METADATA_CREATE,
} from 'redux/actionTypes/experiments';
import {
  SAMPLES_UPDATE,
} from 'redux/actionTypes/samples';
import {
  DEFAULT_NA,
} from 'redux/reducers/projects/initialState';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

import endUserMessages from 'utils/endUserMessages';
import { metadataNameToKey } from 'utils/data-management/metadataUtils';

const createMetadataTrack = (
  name, experimentId,
) => async (dispatch, getState) => {
  const experiment = getState().experiments[experimentId];
  const { samples } = getState();

  const metadataKey = metadataNameToKey(name);

  const newExperiment = _.cloneDeep(experiment);
  newExperiment.metadataKeys.push(metadataKey);
  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/metadataTracks/${metadataKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    dispatch({
      type: PROJECTS_METADATA_CREATE,
      payload: {
        projectUuid: experimentId,
        key: metadataKey,
      },
    });

    await Promise.all(experiment.sampleIds.map((sampleUuid) => dispatch({
      type: SAMPLES_UPDATE,
      payload: {
        sampleUuid,
        sample: {
          metadata: {
            [metadataKey]: (
              samples[sampleUuid].metadata[metadataKey] || DEFAULT_NA
            ),
          },
        },
      },
    })));
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default createMetadataTrack;
