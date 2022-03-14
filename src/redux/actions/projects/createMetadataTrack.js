import _ from 'lodash';
import { metadataNameToKey } from '../../../utils/data-management/metadataUtils';
import {
  PROJECTS_METADATA_CREATE,
} from '../../actionTypes/projects';
import {
  SAMPLES_UPDATE,
} from '../../actionTypes/samples';
import {
  DEFAULT_NA,
} from '../../reducers/projects/initialState';

import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import endUserMessages from '../../../utils/endUserMessages';
import saveProject from './saveProject';
import saveSamples from '../samples/saveSamples';

const createMetadataTrack = (
  name, projectUuid,
) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];
  const { samples } = getState();

  const metadataKey = metadataNameToKey(name);

  const newProject = _.cloneDeep(project);
  newProject.metadataKeys.push(metadataKey);
  try {
    const { samples: updatedSamples } = getState();

    const samplesWithMetadata = project.samples.reduce((samplesObject, sampleUuid) => {
      // eslint-disable-next-line no-param-reassign
      samplesObject[sampleUuid] = _.clone(updatedSamples[sampleUuid]);
      return samplesObject;
    }, {});
    dispatch(saveSamples(projectUuid, samplesWithMetadata, false, false));

    await dispatch(saveProject(projectUuid, newProject));

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
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default createMetadataTrack;
