import { metadataNameToKey } from '../../../utils/metadataUtils';
import {
  PROJECTS_METADATA_UPDATE,
} from '../../actionTypes/projects';

import {
  SAMPLES_UPDATE,
  SAMPLES_METADATA_DELETE,
} from '../../actionTypes/samples';

const updateMetadataTrack = (
  oldName, newName, projectUuid,
) => async (dispatch, getState) => {
  const { samples } = getState();
  const { samples: projectSamples } = getState().projects[projectUuid];

  const oldMetadataKey = metadataNameToKey(oldName);
  const newMetadataKey = metadataNameToKey(newName);

  dispatch({
    type: PROJECTS_METADATA_UPDATE,
    payload: {
      oldKey: oldMetadataKey,
      newKey: newMetadataKey,
      projectUuid,
    },
  });

  projectSamples.forEach((sampleUuid) => {
    dispatch({
      type: SAMPLES_UPDATE,
      payload: {
        sampleUuid,
        sample: { metadata: { [newMetadataKey]: samples[sampleUuid].metadata[oldMetadataKey] } },
      },
    });

    dispatch({
      type: SAMPLES_METADATA_DELETE,
      payload: {
        metadataKey: oldMetadataKey,
        sampleUuid,
      },
    });
  });
};

export default updateMetadataTrack;
