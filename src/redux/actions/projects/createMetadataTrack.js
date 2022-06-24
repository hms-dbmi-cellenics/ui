import _ from 'lodash';

import {
  PROJECTS_METADATA_CREATE,
} from 'redux/actionTypes/projects';
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
  name, projectUuid,
) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];
  const { samples } = getState();

  const metadataKey = metadataNameToKey(name);

  const newProject = _.cloneDeep(project);
  newProject.metadataKeys.push(metadataKey);
  try {
    await fetchAPI(
      `/v2/experiments/${projectUuid}/metadataTracks/${metadataKey}`,
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
        projectUuid,
        key: metadataKey,
      },
    });

    await Promise.all(project.samples.map((sampleUuid) => dispatch({
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

    // Get updated samples in an object
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING);
  }
};

export default createMetadataTrack;
