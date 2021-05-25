import fetchAPI from '../../../utils/fetchAPI';
import { PROJECTS_ERROR, PROJECTS_LOADED, PROJECTS_LOADING } from '../../actionTypes/projects';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';
import loadSamples from '../samples/loadSamples';

const loadProjects = () => async (dispatch) => {
  try {
    dispatch({
      type: PROJECTS_LOADING,
    });
    const response = await fetchAPI('/v1/projects');
    if (!response.ok) {
      const status = `${response.status} ${response.statusText}`;
      console.log(`Failed to get projects: ${status}`);
      throw status;
    }
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    const ids = data.map((project) => project.uuid);

    data.forEach((entry) => {
      if (entry.samples.length) {
        dispatch(loadSamples(false, entry.uuid));
      }
    });

    dispatch({
      type: PROJECTS_LOADED,
      payload: {
        projects: data,
        ids,
      },
    });
  } catch (e) {
    dispatch({
      type: PROJECTS_ERROR,
      payload: {
        error: e.message,
      },
    });
    dispatch(pushNotificationMessage('error', messages.connectionError, 10));
  }
};
export default loadProjects;
