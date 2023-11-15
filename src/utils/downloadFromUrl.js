import { isNil } from 'lodash';

const downloadFromUrl = (url, filename = null) => {
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;

  if (!isNil(filename)) link.download = filename;

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.parentNode.removeChild(link);
  }, 0);
};

export default downloadFromUrl;
