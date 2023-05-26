import fetchAPI from 'utils/http/fetchAPI';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';

const sendInvites = async (addedUsers, experimentInfo) => {
  const {
    experimentId, experimentName, role,
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
            // TODO nothing in the api v2 should use a reference to project,
            // so we'll need a ticket to fix this in this api endpoint
            projectUuid: experimentId,
            role,
            userEmail: user,
          }),
        },
      );
      pushNotificationMessage('success', `User ${user} has been successfully invited to view ${experimentName}.`);
    } catch (e) {
      handleError(e, e?.userMessage);
    }
  });

  return Promise.all(requests);
};

export default sendInvites;
