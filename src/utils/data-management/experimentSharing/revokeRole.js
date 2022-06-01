import fetchAPI from 'utils/http/fetchAPI';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';

import config from 'config';
import { api } from 'utils/constants';

const revokeRole = async (userEmail, experimentInfo) => {
  const { experimentId, experimentName } = experimentInfo;

  let url;

  if (config.currentApiVersion === api.V1) {
    url = `/v1/access/${experimentId}`;
  } else {
    url = `/v2/access/${experimentId}`;
  }

  try {
    await fetchAPI(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
      }),
    });

    pushNotificationMessage('success', `${userEmail} removed from ${experimentName}.`);
  } catch (e) {
    handleError(e, 'Error removing user.');
  }
};

export default revokeRole;
