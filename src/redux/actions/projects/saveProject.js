/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';

const saveProject = (projectUuid) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];

  try {
    await fetchAPI(
      `/v1/projects/${projectUuid}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      },
    );
  } catch (e) {
    dispatch(pushNotificationMessage('error', messages.connectionError, 5));
  }
};

export default saveProject;
