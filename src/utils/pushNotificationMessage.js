import { message } from 'antd';

const pushNotificationMessage = (type, text) => {
  switch (type) {
    case 'success':
      message.success(text, 4);
      break;
    case 'error':
      message.error(text, 4);
      break;
    case 'info':
      message.info(text, 4);
      break;
    case 'warning':
    case 'warn':
      message.warn(text, 4);
      break;
    case 'loading':
      message.loading(text, 4);
      break;
    default:
      message.info(text, 4);
      break;
  }
};

export default pushNotificationMessage;
