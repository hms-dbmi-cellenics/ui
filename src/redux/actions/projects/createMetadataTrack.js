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

import saveProject from 'redux/actions/projects/saveProject';
import saveSamples from 'redux/actions/samples/saveSamples';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

import endUserMessages from 'utils/endUserMessages';
import { metadataNameToKey } from 'utils/data-management/metadataUtils';

import config from 'config';
import { api } from 'utils/constants';

const createMetadataTrack = (
  name, projectUuid,
) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];
  const { samples } = getState();

  const metadataKey = metadataNameToKey(name);

  const newProject = _.cloneDeep(project);
  newProject.metadataKeys.push(metadataKey);
  try {
    if (config.currentApiVersion === api.V1) {
      const { samples: updatedSamples } = getState();

      const samplesWithMetadata = project.samples.reduce((samplesObject, sampleUuid) => {
        // eslint-disable-next-line no-param-reassign
        samplesObject[sampleUuid] = _.clone(updatedSamples[sampleUuid]);
        return samplesObject;
      }, {});
      const notifyUser = false;

      await dispatch(saveSamples(projectUuid, samplesWithMetadata, false, false, notifyUser));
      await dispatch(saveProject(projectUuid, newProject, true, notifyUser));
    } else if (config.currentApiVersion === api.V2) {
      await fetchAPI(
        `/v2/experiments/${projectUuid}/metadataTracks/${name}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

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
