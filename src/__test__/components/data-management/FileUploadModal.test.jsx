import React from 'react';
import {
  render, screen, waitFor, fireEvent, within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import integrationTestConstants from 'utils/integrationTestConstants';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

import techOptions, { techNamesToDisplay } from 'utils/upload/fileUploadUtils';
import { sampleTech } from 'utils/constants';

import mockFile from '__test__/test-utils/mockFile';
import FileUploadModal from 'components/data-management/FileUploadModal';

jest.mock('utils/http/handleError');

const mockStore = configureMockStore([thunk]);

const initialState = {
  samples: {},
  experiments: {
    meta: {
      activeExperimentId: 'experiment-1234',
    },
  },
};

const prevUpState = {
  samples: { 'sample-1': { experimentId: 'experiment-1234' } },
  experiments: {
    meta: {
      activeExperimentId: 'experiment-1234',
    },
  },
};

const prevUpDiffExpState = {
  samples: { 'sample-1': { experimentId: 'experiment-5678' } },
  experiments: {
    meta: {
      activeExperimentId: 'experiment-1234',
    },
  },
};

const initialStore = mockStore(initialState);
const prevUpStore = mockStore(prevUpState);
const prevUpDiffExpStore = mockStore(prevUpDiffExpState);

const renderFileUploadModal = async (store, currentSelectedTech = null) => {
  await act(async () => (render(
    <Provider store={store}>
      <FileUploadModal
        onUpload={jest.fn()}
        onCancel={jest.fn()}
        currentSelectedTech={currentSelectedTech}
      />
    </Provider>,
  )));
};

const seuratTech = techNamesToDisplay[sampleTech.SEURAT];

const selectTech = (selectedTech) => {
  const displayedName = techNamesToDisplay[selectedTech];

  const techSelection = screen.getByRole('combobox', { name: 'sampleTechnologySelect' });

  act(() => {
    fireEvent.change(techSelection, { target: { value: selectedTech } });
  });

  // The 2nd option is the selection
  const option = screen.getByText(displayedName, { selector: '.ant-select-item-option-content' });

  act(() => {
    fireEvent.click(option);
  });
};

describe('FileUploadModal', () => {
  it('contains required components for Chromium 10X', async () => {
    await renderFileUploadModal(initialStore);

    selectTech(sampleTech['10X']);

    // It contains instructions on what files can be uploaded
    expect(screen.getByText(/For each sample, upload a folder containing/i)).toBeInTheDocument();
    techOptions[sampleTech['10X']].acceptedFiles.forEach((filename) => {
      expect(screen.getByText(filename)).toBeInTheDocument();
    });

    // Tells the user that the folder's name will be used as the sample name
    expect(screen.getByText(/The folder's name will be used to name the sample in it/i)).toBeInTheDocument();

    // And it can later be changed
    expect(screen.getByText(/You can change this name later in Data Management/i)).toBeInTheDocument();

    // It shows direction on drag and drop area
    expect(screen.getByText(/Drag and drop folders here or click to browse/i)).toBeInTheDocument();

    // It has a disabled upload button if there are no uploaded files
    // Upload button is the last "Upload" text in the document
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();

    // if click to browse will be able to upload file instead of folder
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    expect(uploadInput.getAttribute('webkitdirectory')).toBe('');
  });

  it('contains required components for Seurat', async () => {
    await renderFileUploadModal(initialStore);

    // It has default 10x selected
    expect(screen.queryAllByText(techNamesToDisplay[sampleTech['10X']]).length).toBe(1);
    expect(screen.queryAllByText(seuratTech).length).toBe(0);

    selectTech(sampleTech.SEURAT);

    // Lists the requirements of the Seurat object
    expect(screen.getByText(/The Seurat object must contain the following slots and metadata:/i)).toBeInTheDocument();

    // samples
    expect(screen.getAllByText(/scdata\$samples/i).length).toBe(2);

    // counts
    expect(screen.getByText(/scdata\[\['RNA'\]\]@counts/i)).toBeInTheDocument();

    // reductions
    expect(screen.getByText(/scdata@reductions/i)).toBeInTheDocument();

    // inform users that cluster metadata is auto-detected
    expect(screen.getByText(/cluster metadata .+ is auto-detected/i)).toBeInTheDocument();

    // inform users that sample level metadata is auto-detected
    expect(screen.getByText(/sample level metadata .+ is auto-detected/i)).toBeInTheDocument();

    // told to drag and drop rds file
    expect(screen.getByText(/Drag and drop \*\.rds file here or click to browse\./i)).toBeInTheDocument();

    // if click to browse will be able to upload file instead of folder
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    expect(uploadInput.getAttribute('webkitdirectory')).toBe(null);

    // It has a disabled upload button if there are no uploaded files
    // Upload button is the last "Upload" text in the document
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();
  });

  it('drag and drop works with valid 10X Chromium file', async () => {
    await renderFileUploadModal(initialStore);

    selectTech(sampleTech['10X']);

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();
    // It has a select button to select technology
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create a features file
    const file = mockFile('features.tsv.gz', '/WT13');

    //  drop it into drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    //  it was valid and shows up
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText(file.path.slice(1))).toBeInTheDocument();

    // upload is enabled
    // It has a disabled upload button if there are no uploaded files
    // Upload button is the last "Upload" text in the document
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).not.toBeDisabled();
  });

  it('drag and drop works with valid Seurat file', async () => {
    await renderFileUploadModal(initialStore);

    selectTech(sampleTech.SEURAT);

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();

    // get the dropzone input
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create a seurat file
    const file = mockFile('scdata.rds');

    //  drop it into drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    //  it was valid and shows up
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText('scdata.rds')).toBeInTheDocument();

    // upload is enabled
    // It has a disabled upload button if there are no uploaded files
    // Upload button is the last "Upload" text in the document
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).not.toBeDisabled();
  });

  it('drag and drop works with valid Seurat file when different experiment has valid uploaded Seurat object', async () => {
    await renderFileUploadModal(prevUpDiffExpStore);

    selectTech(sampleTech.SEURAT);

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();

    // get the dropzone input
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create a seurat file
    const file = mockFile('scdata.rds');

    //  drop it into drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    //  it was valid and shows up
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText('scdata.rds')).toBeInTheDocument();

    // upload is enabled
    // It has a disabled upload button if there are no uploaded files
    // Upload button is the last "Upload" text in the document
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).not.toBeDisabled();
  });

  it('drag and drop does not work with invalid Seurat file', async () => {
    await renderFileUploadModal(initialStore);

    // technology input should be enabled because there is no previously uploaded data
    const techInput = document.querySelector(
      '[data-testid="uploadTechSelect"] input',
    );

    expect(techInput).toBeEnabled();

    selectTech(sampleTech.SEURAT);

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();

    // get the dropzone input
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create a seurat file
    const file = mockFile('scdata.txt');

    //  drop it into drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    //  it shows up
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText('scdata.txt')).toBeInTheDocument();

    // upload is disabled as the file was invalid
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();
  });

  it('drag and drop fails with valid Seurat file when pre-existing Seurat file exists for experiment', async () => {
    await renderFileUploadModal(prevUpStore, sampleTech.SEURAT);

    // Seurat info should show up as their is previous Seurat data uploaded
    await waitFor(() => expect(
      screen.getByText(/Seurat object \(max 15GB\)/),
    ).toBeInTheDocument());

    // technology input should be disable because we have existing data
    const techInput = document.querySelector(
      '[data-testid="uploadTechSelect"] input',
    );

    expect(techInput).toBeDisabled();

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();

    // get the dropzone input
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create a seurat file
    const file = mockFile('scdata.rds');

    //  drop it into drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    //  it was not valid and doesn't shows up
    expect(await screen.queryByText('scdata.rds')).not.toBeInTheDocument();

    // upload is disabled as there is pre-existing file for experiment
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();

    // error message was displayed to user
    expect(handleError).toHaveBeenCalledWith('error', endUserMessages.ERROR_SEURAT_EXISTING_FILE);
  });

  it('Shows what files can be uploaded for Rhapsody samples', async () => {
    await renderFileUploadModal(initialStore);

    // Switch file upload to Rhapsody
    const chosenTech = sampleTech.RHAPSODY;
    const displayedName = techNamesToDisplay[chosenTech];

    const techSelection = screen.getByRole('combobox', { name: 'sampleTechnologySelect' });

    act(() => {
      fireEvent.change(techSelection, { target: { value: sampleTech.RHAPSODY } });
    });

    // The 2nd option is the selection
    const option = screen.getByText(displayedName);

    act(() => {
      fireEvent.click(option);
    });

    // It contains what files can be uploaded
    techOptions[chosenTech].acceptedFiles.forEach((filename) => {
      expect(screen.getByText(filename)).toBeInTheDocument();
    });
  });

  it('drag and drop works with Parse file', async () => {
    await renderFileUploadModal(initialStore);

    // Switch file upload to Parse
    selectTech(sampleTech.PARSE);

    // It mentions the files that can be uploaded
    techOptions[sampleTech.PARSE].acceptedFiles.forEach((filename) => {
      expect(screen.getByText(filename)).toBeInTheDocument();
    });

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();

    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create an all genes file (features)
    const file = mockFile('all_genes.csv.gz', '/WT13/DGE_unfiltered');

    //  drop it into drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    // It shows up as ready to upload
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText(file.path.slice(1))).toBeInTheDocument();

    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    // Upload is enabled because the file is considered valid
    expect(uploadButton).not.toBeDisabled();
  });

  it('drag and drop works with Parse file, invalid files are shown in warning', async () => {
    await renderFileUploadModal(initialStore);

    // Switch file upload to Parse
    selectTech(sampleTech.PARSE);

    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create an all genes file (features)
    const files = [
      // 4 valid files
      mockFile('all_genes.csv.gz', '/WT13/DGE_unfiltered'),
      mockFile('all_genes.csv.gz', '/WT14/DGE_filtered'),
      mockFile('all_genes.csv.gz', '/WT15'),
      // This one should be ignored, /WT13/DGE_unfiltered takes precedence
      mockFile('all_genes.csv.gz', '/WT13/DGE_filtered'),
      // 1 invalid file
      mockFile('all_genes.csv.gz', '/all-sample'),
    ];

    //  drop it into drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: files,
        configurable: true,
      });

      fireEvent.drop(uploadInput);
    });

    // Valid files show up
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findAllByText('WT13/DGE_unfiltered/all_genes.csv.gz')).toHaveLength(2);
    expect(await screen.findByText('WT14/DGE_filtered/all_genes.csv.gz')).toBeInTheDocument();
    expect(await screen.findByText('WT15/all_genes.csv.gz')).toBeInTheDocument();

    // WT13/DGE_filtered doesn't because it is valid but superseded by WT13/DGE_unfiltered
    expect(screen.queryByText('WT13/DGE_filtered/all_genes.csv.gz')).not.toBeInTheDocument();

    // Warning shows up with offer to expand
    expect(screen.getByText(/1 file was ignored, click to display/i)).toBeInTheDocument();

    // Add a new invalid file
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [mockFile('invalidName.csv.gz', 'KO/DGE_unfiltered')],
        configurable: true,
      });

      fireEvent.drop(uploadInput);
    });

    // Now warning shows plural version
    expect(screen.getByText(/2 files were ignored, click to display/i)).toBeInTheDocument();

    // But invalid files don't show up yet
    expect(screen.queryByText('all-sample/all_genes.csv.gz')).not.toBeInTheDocument();
    expect(screen.queryByText('KO/DGE_unfiltered/invalidName.csv.gz')).not.toBeInTheDocument();

    await act(() => {
      fireEvent.click(screen.getByText(/2 files were ignored, click to display/i));
    });

    // All invalid files are shown here
    expect(screen.getByText('all-sample/all_genes.csv.gz')).toBeInTheDocument();
    expect(screen.getByText('KO/DGE_unfiltered/invalidName.csv.gz')).toBeInTheDocument();

    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    // Upload is enabled because the file is considered valid
    expect(uploadButton).not.toBeDisabled();
  });
});
