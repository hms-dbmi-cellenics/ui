import fetchAPI from '../../../utils/fetchAPI';
import { PROJECTS_LOAD } from '../../actionTypes/projects';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';
import loadSamples from '../samples/loadSamples';

const loadProjects = () => async (dispatch) => {
  try {
    const response = await fetchAPI('/v1/projects');
    const data = await response.json();
    const ids = data.map((project) => project.uuid);
    data.forEach((entry) => {
      if (entry.samples.length) {
        dispatch(loadSamples(false, entry.uuid));
      }
    });
    dispatch({
      type: PROJECTS_LOAD,
      payload: {
        projects: data,
        ids,
      },
    });
  } catch (e) {
    dispatch(pushNotificationMessage('error', messages.connectionError, 10));
  }
};
export default loadProjects;
