const readFileToBuffer = (file) => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onabort = () => reject(new Error('aborted'));
    reader.onerror = () => reject(new Error('error'));
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(file);
  });
};

export default readFileToBuffer;
