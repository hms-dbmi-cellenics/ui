import { message } from 'antd';

const pushNotificationMessage = (type, text, duration = 4) => {
  switch (type) {
    case 'success':
      message.success(text, duration);
      break;
    case 'error':
      message.error(text, duration);
      break;
    case 'info':
      message.info(text, duration);
      break;
    case 'warning':
    case 'warn':
      message.warn(text, duration);
      break;
    case 'loading':
      message.loading(text, duration);
      break;
    default:
      message.info(text, duration);
      break;
  }
};

export default pushNotificationMessage;
