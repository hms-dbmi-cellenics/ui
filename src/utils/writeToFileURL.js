const writeToFileURL = (text) => {
  const data = new Blob([text], { type: 'text/plain' });
  const textFileURL = window.URL.createObjectURL(data);

  // returns a URL that can be used as a href
  return textFileURL;
};

export default writeToFileURL;
