import {
  render, screen, fireEvent,
} from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import handleError from 'utils/http/handleError';
import readFileToString from 'utils/upload/readFileToString';

import componentFactory from '__test__/test-utils/testComponentFactory';
import CellLevelUploadModal from 'components/data-management/CellLevelUploadModal';

jest.mock('utils/upload/readFileToString');
jest.mock('utils/http/handleError');

const defaultProps = {
  onUpload: jest.fn(),
  onCancel: jest.fn(),
};

const CellLevelModalFactory = componentFactory(CellLevelUploadModal, defaultProps);

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

const renderCellLevelUploadModal = async (customProps = {}) => {
  act(() => {
    render(CellLevelModalFactory(customProps));
  });
};

describe('CellLevelUploadModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows required components required to upload the cell level file', async () => {
    await renderCellLevelUploadModal();

    expect(screen.getByText(/File Upload/i)).toBeInTheDocument();

    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();
  });

  it('returns error for invalid file', async () => {
    readFileToString.mockReturnValue('bad-content');
    await renderCellLevelUploadModal();

    const inputEl = await screen.getByTestId('drop-input');
    const file = new File(['content'], 'file.tsv', { type: 'text/plain' });

    await dropFilesIntoDropzone(inputEl, [file]);
    const uploadButton = screen.getByRole('button', {
      name: /Upload/,
    });

    expect(uploadButton).toBeDisabled();
    expect(handleError).toHaveBeenCalled();
  });

  it('needs to have the barcodes column', async () => {
    const onUpload = jest.fn();
    readFileToString.mockReturnValue('sample\tkey1\tval1');
    await renderCellLevelUploadModal({ onUpload });

    const inputEl = await screen.getByTestId('drop-input');
    const file = new File(['content'], 'file.tsv', { type: 'text/plain' });

    await dropFilesIntoDropzone(inputEl, [file]);

    expect(handleError).toBeCalledWith('error', 'The .tsv file needs to contain the column "barcodes"');
  });
});
