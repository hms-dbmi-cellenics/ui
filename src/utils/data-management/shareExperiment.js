import fetchAPI from 'utils/http/fetchAPI';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';

const sendInvites = async (addedUsers, experimentInfo) => {
  const {
    experimentId, experimentName, activeProjectUuid, role,
  } = experimentInfo;

  const requests = addedUsers.map(async (user) => {
    try {
      await fetchAPI(`/v1/access/${experimentId}`, {
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

const revokeRole = async (userEmail, experimentInfo) => {
  const { experimentId, experimentName } = experimentInfo;

  try {
    await fetchAPI(`/v1/access/${experimentId}`, {
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

export { sendInvites, revokeRole };
