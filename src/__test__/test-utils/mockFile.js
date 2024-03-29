const range = (count) => {
  let output = '';
  for (let i = 0; i < count; i += 1) {
    output += 'a';
  }
  return output;
};

const mockFile = (name, pathPrefix, size = 1024, mimeType = 'application/gzip') => {
  const blob = new Blob([range(size)], { type: mimeType });
  blob.lastModifiedDate = new Date();
  blob.name = name;
  blob.path = pathPrefix ? `${pathPrefix}/${name}` : name;

  return blob;
};

export { range };

export default mockFile;
