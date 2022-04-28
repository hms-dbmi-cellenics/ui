import _ from 'lodash';

import {
  PROJECTS_METADATA_DELETE,
} from 'redux/actionTypes/projects';
import {
  SAMPLES_METADATA_DELETE,
} from 'redux/actionTypes/samples';
import saveSamples from 'redux/actions/samples/saveSamples';
import saveProject from 'redux/actions/projects/saveProject';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

import endUserMessages from 'utils/endUserMessages';
import { metadataNameToKey } from 'utils/data-management/metadataUtils';

import config from 'config';
import { api } from 'utils/constants';

const deleteMetadataTrack = (
  name, projectUuid,
) => async (dispatch, getState) => {
  const { samples } = getState();
  const project = getState().projects[projectUuid];

  const metadataKey = metadataNameToKey(name);

  const newProject = _.cloneDeep(project);
  newProject.metadataKeys = project.metadataKeys.filter((key) => key !== metadataKey);

  const newSamples = project.samples.reduce((curr, sampleUuid) => {
    const updatedSample = _.cloneDeep(samples[sampleUuid]);
    delete updatedSample.metadata[metadataKey];

    return {
      ...curr,
      [sampleUuid]: updatedSample,
    };
  }, {});

  try {
    if (config.currentApiVersion === api.V1) {
      const notifyUser = false;
      await dispatch(saveProject(projectUuid, newProject, false, notifyUser));
      await dispatch(saveSamples(projectUuid, newSamples, false, false, notifyUser));
    } else if (config.currentApiVersion === api.V2) {
      await fetchAPI(
        `/v2/experiments/${projectUuid}/metadataTracks/${name}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    dispatch({
      type: PROJECTS_METADATA_DELETE,
      payload: {
        key: metadataKey,
        projectUuid,
      },
    });

    project.samples.forEach((sampleUuid) => dispatch({
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
