// this function checks the validity of the file
// this is done in the data-management module - upload samples
import mime from 'mime-types';
import path from 'path';
import _ from 'lodash';
import techOptions from './fileUploadSpecifications';

const checkIfFileValid = (fileName, selectedTech) => {
  const isValidType = (
    techOptions[selectedTech].validMimeTypes
      .includes(
        mime.lookup(fileName),
      )
    || techOptions[selectedTech].validExtensionTypes
      .includes(
        path.extname(fileName),
      )
  );
  const acceptedFilesRegexp = `(${techOptions[selectedTech].acceptedFiles.map(_.escapeRegExp).join('|')})$`;
  const acceptedFilenames = new RegExp(acceptedFilesRegexp, 'gi');
  const isValidFilename = fileName.match(acceptedFilenames) !== null;

  return { isValidFilename, isValidType };
};
export default checkIfFileValid;
