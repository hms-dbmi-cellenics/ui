const downloadFromUrl = (url, filename) => {
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;

  if (filename) link.download = filename;

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.parentNode.removeChild(link);
  }, 0);
};
export default downloadFromUrl;
