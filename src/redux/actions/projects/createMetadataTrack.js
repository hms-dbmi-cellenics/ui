import _ from 'lodash';
import { metadataNameToKey } from '../../../utils/metadataUtils';
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

const createMetadataTrack = (
  name, projectUuid,
) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];
  const { samples } = getState();

  const metadataKey = metadataNameToKey(name);

  const newProject = _.cloneDeep(project);
  newProject.metadataKeys.push(metadataKey);

  try {
    await dispatch(saveProject(projectUuid, newProject));

    dispatch({
      type: PROJECTS_METADATA_CREATE,
      payload: {
        projectUuid,
        key: metadataKey,
      },
    });

    await Promise.all(samples.ids.map((sampleUuid) => dispatch({
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
    console.log(e);
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default createMetadataTrack;
