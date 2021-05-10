/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import pushNotificationMessage from '../pushNotificationMessage';

const saveExperiment = (
  experimentId,
) => async (dispatch, getState) => {
  const experiment = getState().experiments[experimentId];

  try {
    const response = await fetchAPI(
      `/v1/experiments/${experimentId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experiment),
      },
    );

    if (!response.ok) {
      throw new Error('HTTP status code was not 200.');
    }
  } catch (e) {
    dispatch(
      pushNotificationMessage(
        'error',
        'We couldn\'t connect to the server to save your current processing settings, retrying...',
        3,
      ),
    );
  }
};

export default saveExperiment;
