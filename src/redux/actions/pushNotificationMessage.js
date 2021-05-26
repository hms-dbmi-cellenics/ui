import { message } from 'antd';

const pushNotificationMessage = (type, text, time = 2) => {
  switch (type) {
    case 'success':
      message.success(text, time);
      break;
    case 'error':
      message.error(text, time);
      break;
    case 'info':
      message.info(text, time);
      break;
    case 'warning':
    case 'warn':
      message.warn(text, time);
      break;
    case 'loading':
      message.loading(text, time);
      break;
    default:
      message.info(text, time);
      break;
  }
};

export default pushNotificationMessage;
