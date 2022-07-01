import fetchAPI from 'utils/http/fetchAPI';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';

const sendInvites = async (addedUsers, experimentInfo) => {
  const {
    experimentId, experimentName, activeProjectUuid, role,
  } = experimentInfo;

  const requests = addedUsers.map(async (user) => {
    try {
      await fetchAPI(
        `/v2/access/${experimentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectUuid: activeProjectUuid,
            role,
            userEmail: user,
          }),
        },
      );
      pushNotificationMessage('success', `User ${user} has been successfully invited to view ${experimentName}.`);
    } catch (e) {
      handleError(e);
    }
  });

  return Promise.all(requests);
};

export default sendInvites;
