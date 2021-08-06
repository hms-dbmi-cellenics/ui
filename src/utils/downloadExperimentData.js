import downloadTypes from './downloadTypes';
import { getFromApiExpectOK } from './getDataExpectOK';
import pushNotificationMessage from './pushNotificationMessage';
import endUserMessages from './endUserMessages';

const downloadData = async (experimentId, type) => {
  try {
    if (!experimentId) throw new Error('No experimentId specified');
    if (!Object.values(downloadTypes).includes(type)) throw new Error('Invalid download type');

    const { signedUrl } = await getFromApiExpectOK(`/v1/experiments/${experimentId}/download/${type}`);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = signedUrl;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.parentNode.removeChild(link);
    }, 0);
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_DOWNLOADING_DATA);
  }
};

export default downloadData;
