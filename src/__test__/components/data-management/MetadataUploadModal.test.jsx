import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import handleError from 'utils/http/handleError';
import readFileToString from 'utils/upload/readFileToString';

import componentFactory from '__test__/test-utils/testComponentFactory';
import MetadataUploadModal from 'components/data-management/MetadataUploadModal';
import userEvent from '@testing-library/user-event';

jest.mock('utils/upload/readFileToString');

jest.mock('utils/http/handleError');

const defaultProps = {
  onUpload: jest.fn(),
  onCancel: jest.fn(),
};

const MetadataModalFactory = componentFactory(MetadataUploadModal, defaultProps);

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

const renderMetadataUploadModal = async (customProps = {}) => {
  act(() => {
    render(MetadataModalFactory(customProps));
  });
};

describe('MetadataUploadModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('shows required components required to upload the metadata file', async () => {
    await renderMetadataUploadModal();

    // It contains instructions on what files can be uploaded
    expect(screen.getByText(/Metadata Upload/i)).toBeInTheDocument();

    // It shows direction on drag and drop area
    expect(screen.getByText(/Drag and drop the metadata file here or click to browse/i)).toBeInTheDocument();

    // It has a disabled upload button if there are no uploaded files
    // Upload button is the last "Upload" text in the document
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();
  });

  it('returns error for invalid format file', async () => {
    await renderMetadataUploadModal();

    const inputEl = screen.getByTestId('drop-input');
    const file = new File(['content'], 'file.txt', { type: 'text/plain' });

    await dropFilesIntoDropzone(inputEl, [file]);

    const uploadButton = screen.getByRole('button', {
      name: /Upload/,
    });

    expect(uploadButton).toBeDisabled();
    expect(handleError).toHaveBeenCalled();
  });

  it('returns error for invalid file', async () => {
    readFileToString.mockReturnValue('osiajdfoasidf');
    await renderMetadataUploadModal();

    const inputEl = await screen.getByTestId('drop-input');
    const file = new File(['content'], 'file.tsv', { type: 'text/plain' });

    await dropFilesIntoDropzone(inputEl, [file]);
    const uploadButton = screen.getByRole('button', {
      name: /Upload/,
    });

    expect(uploadButton).toBeDisabled();
    expect(handleError).toHaveBeenCalled();
  });

  it('accepts correct file', async () => {
    const onUpload = jest.fn();
    readFileToString.mockReturnValue('sample\tkey1\tval1');
    await renderMetadataUploadModal({ onUpload });

    const inputEl = await screen.getByTestId('drop-input');
    const file = new File(['content'], 'file.tsv', { type: 'text/plain' });

    await dropFilesIntoDropzone(inputEl, [file]);

    expect(handleError).not.toHaveBeenCalled();
    expect(screen.getByText('file.tsv')).toBeInTheDocument();

    const uploadButton = screen.getByRole('button', {
      name: /Upload/,
    });
    userEvent.click(uploadButton);

    expect(onUpload).toHaveBeenCalled();
  });
});
