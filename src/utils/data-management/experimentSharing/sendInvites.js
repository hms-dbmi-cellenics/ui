import fetchAPI from 'utils/http/fetchAPI';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';

import config from 'config';
import { api } from 'utils/constants';

const sendInvites = async (addedUsers, experimentInfo) => {
  const {
    experimentId, experimentName, activeProjectUuid, role,
  } = experimentInfo;

  const requests = addedUsers.map(async (user) => {
    let url;

    if (config.currentApiVersion === api.V1) {
      url = `/v1/access/${experimentId}`;
    } else {
      url = `/v2/access/${experimentId}`;
    }

    try {
      await fetchAPI(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectUuid: activeProjectUuid,
          role,
          userEmail: user,
        }),
      });
      pushNotificationMessage('success', `User ${user} has been successfully invited to view ${experimentName}.`);
    } catch (e) {
      handleError(e);
    }
  });

  return Promise.all(requests);
};

export default sendInvites;
