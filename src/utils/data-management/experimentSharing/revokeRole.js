import fetchAPI from 'utils/http/fetchAPI';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import handleError from 'utils/http/handleError';

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

export default revokeRole;
