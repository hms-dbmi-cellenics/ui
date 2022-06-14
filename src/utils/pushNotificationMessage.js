import { message } from 'antd';

const pushNotificationMessage = (type, text, duration) => {
  switch (type) {
    case 'success':
      message.success(text, duration ?? 2);
      break;
    case 'error':
      message.error(text, duration ?? 4);
      break;
    case 'info':
      message.info(text, duration ?? 4);
      break;
    case 'warning':
    case 'warn':
      message.warn(text, duration ?? 4);
      break;
    case 'loading':
      message.loading(text, duration ?? 2);
      break;
    default:
      message.info(text, duration ?? 4);
      break;
  }
};

export default pushNotificationMessage;
