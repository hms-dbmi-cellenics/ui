import {
  render, screen, fireEvent,
} from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import handleError from 'utils/http/handleError';
import configureMockStore from 'redux-mock-store';
import readFileToString from 'utils/upload/readFileToString';
import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import CellLevelUploadModal from 'components/data-management/metadata/CellLevelUploadModal';

jest.mock('utils/upload/readFileToString');
jest.mock('utils/http/handleError');
const mockStore = configureMockStore([thunk]);

// dropFilesIntoDropzone takes an input element and simulates droping files into it
// inputElement: this needs to be the actual input element not the dropzone itself, e.g.:
// * <input data-testid='drop-input'/> => screen.getByTestId('drop-input');
// files should be a list of files, e.g.:
// * new File(['content'], 'file.txt', { type: 'text/plain' });
const store = mockStore({
  experiments: {
    meta: {
      activeExperimentId: 'some-id-uuid',
    },
  },
});
const dropFilesIntoDropzone = async (inputElement, files) => {
  await act(async () => {
    fireEvent.drop(inputElement, {
      target: { files },
    });
  });
};

const cellLevelMock = {
  id: '5a7b24a9-4b38-4f92-a2d9-d49a15d13f67',
  name: 'asdasdcell_level.tsv',
  createdAt: '2023-10-31 12:33:40.747552+00',
  size: '253',
  experimentId: '606fb0ae-faef-448c-8679-1c223b268a0c',
  percentProgress: 100,
};
const successfulUpload = {
  ...cellLevelMock,
  uploadStatus: 'uploaded',
};

const renderCellLevelUploadModal = async (cellLevelMeta = false) => {
  act(() => {
    render(
      <Provider store={store}>

        <CellLevelUploadModal
          onUpload={jest.fn()}
          onCancel={jest.fn()}
          cellLevelMetadata={cellLevelMeta}
          uploading={false}
        />
      </Provider>,
    );
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

  it('needs to have the barcode column', async () => {
    readFileToString.mockReturnValue('sample\tkey1\tval1');
    await renderCellLevelUploadModal();

    const inputEl = await screen.getByTestId('drop-input');
    const file = new File(['content'], 'file.tsv', { type: 'text/plain' });

    await dropFilesIntoDropzone(inputEl, [file]);

    expect(handleError).toBeCalledWith('error', 'The .tsv file needs to contain the column "barcode"');
  });
});
