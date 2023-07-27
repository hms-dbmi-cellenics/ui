const writeToFileURL = (data) => {
  let blob;
  if (data instanceof Blob) {
    blob = data;
  } else {
    blob = new Blob([data], { type: 'text/plain' });
  }
  const textFileURL = window.URL.createObjectURL(blob);

  // returns a URL that can be used as a href
  return textFileURL;
};

export default writeToFileURL;
