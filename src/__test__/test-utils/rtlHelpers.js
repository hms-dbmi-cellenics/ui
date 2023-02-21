import { fireEvent, screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

const selectOption = async (optionName, select) => {
  await userEvent.click(select);
  // userEvent click doesnt trigger the onChange in select
  fireEvent.click(screen.getByTitle(optionName));
};

// dropFilesIntoDropzone takes an input element and simulates droping files into it
// inputElement: this needs to be the actual input element not the dropzone itself, e.g.:
// * <input data-testid='drop-input'/> => screen.getByTestId('drop-input');
// files should be a list of files, e.g.:
// * new File(['content'], 'file.txt', { type: 'text/plain' });
const dropFilesIntoDropzone = async (inputElement, files) => {
  await act(async () => {
    fireEvent.drop(inputElement, {
      target: { files },
    });
  });
};

export {
  // eslint-disable-next-line import/prefer-default-export
  selectOption,
  dropFilesIntoDropzone,
};
