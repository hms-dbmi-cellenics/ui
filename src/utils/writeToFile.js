const writeToFile = (text) => {
  let textFile = null;
  const data = new Blob([text], { type: 'text/plain' });

  // If we are replacing a previously generated file we need to
  // manually revoke the object URL to avoid memory leaks.
  if (textFile !== null) {
    window.URL.revokeObjectURL(textFile);
  }

  textFile = window.URL.createObjectURL(data);

  // returns a URL you can use as a href
  return textFile;
};

export default writeToFile;
