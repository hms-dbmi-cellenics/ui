import { metadataNameToKey } from '../../../utils/metadataUtils';
import {
  PROJECTS_METADATA_CREATE,
} from '../../actionTypes/projects';
import saveProject from './saveProject';

const createMetadataTrack = (
  name, projectUuid,
) => async (dispatch) => {
  dispatch({
    type: PROJECTS_METADATA_CREATE,
    payload: {
      projectUuid,
      key: metadataNameToKey(name),
    },
  });
  dispatch(saveProject(projectUuid));
};

export default createMetadataTrack;
