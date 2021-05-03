import { metadataNameToKey } from '../../../utils/metadataUtils';
import {
  PROJECTS_METADATA_UPDATE,
} from '../../actionTypes/projects';

const updateMetadataTrack = (
  oldKey, newName, projectUuid,
) => async (dispatch) => {
  dispatch({
    type: PROJECTS_METADATA_UPDATE,
    payload: {
      oldKey,
      newKey: metadataNameToKey(newName),
      projectUuid,
    },
  });
};

export default updateMetadataTrack;
