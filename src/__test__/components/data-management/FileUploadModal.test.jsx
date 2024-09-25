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
import { sampleTech, obj2sTechs } from 'utils/constants';

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

const seuratTech = techNamesToDisplay[sampleTech.SEURAT_OBJECT];

const obj2sTechFiles = {
  anndata_object: 'adata.h5ad',
  seurat_object: 'seurat.rds',
  sce_object: 'sce.rds',
};

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

  it('contains required components for Seurat object uploads', async () => {
    await renderFileUploadModal(initialStore);

    // It has default 10x selected
    expect(screen.queryAllByText(techNamesToDisplay[sampleTech['10X']]).length).toBe(1);
    expect(screen.queryAllByText(seuratTech).length).toBe(0);

    selectTech(sampleTech.SEURAT_OBJECT);

    // Lists the requirements of the Seurat object
    expect(screen.getByText(/The Seurat object must contain the following slots and metadata:/i)).toBeInTheDocument();

    // samples
    expect(screen.getAllByText(/scdata\$samples/i).length).toBe(2);

    // counts
    expect(screen.getByText(/scdata\[\['RNA'\]\]@counts/i)).toBeInTheDocument();

    // reductions
    expect(screen.getByText(/DefaultDimReduc\(scdata\)/i)).toBeInTheDocument();

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

  it('contains required components for SingleCellExperiment object uploads', async () => {
    await renderFileUploadModal(initialStore);

    // It has default 10x selected
    expect(screen.queryAllByText(techNamesToDisplay[sampleTech['10X']]).length).toBe(1);

    selectTech(sampleTech.SCE_OBJECT);

    // Lists the requirements of the Seurat object
    expect(screen.getByText(/The SingleCellExperiment object must contain the following slots and metadata:/i)).toBeInTheDocument();

    // samples
    expect(screen.getAllByText(/sce\$samples/i).length).toBe(2);

    // counts
    expect(screen.getByText(/counts\(sce\)/i)).toBeInTheDocument();

    // reductions
    expect(screen.getByText(/reducedDimNames\(sce\)/i)).toBeInTheDocument();

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

  test.each(obj2sTechs)('drag and drop works with valid Obj2s files for tech %s', async (obj2sTech) => {
    await renderFileUploadModal(initialStore);

    selectTech(obj2sTech);

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();

    // get the dropzone input
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create a file specific to each tech if needed
    const fileName = obj2sTechFiles[obj2sTech];
    const file = mockFile(fileName);

    // drop it into drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    // it was valid and shows up
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText(fileName)).toBeInTheDocument();

    // upload is enabled
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).not.toBeDisabled();
  });

  test.each(obj2sTechs)('drag and drop works with valid Obj2s files for tech %s', async (obj2sTech) => {
    await renderFileUploadModal(initialStore);

    selectTech(obj2sTech);

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();

    // get the dropzone input
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create a mock file with a fixed name
    const fileName = obj2sTechFiles[obj2sTech];
    const file = mockFile(fileName);

    // drop the file into the drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    // expect the file to appear as uploaded
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText(fileName)).toBeInTheDocument();

    // check that the upload button is enabled
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).not.toBeDisabled();
  });

  test.each(obj2sTechs)('drag and drop works with valid Seurat file when different experiment has valid uploaded Obj2s file for tech %s', async (obj2sTech) => {
    await renderFileUploadModal(prevUpDiffExpStore);

    selectTech(obj2sTech);

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();

    // get the dropzone input
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create a mock file with a fixed name
    const fileName = obj2sTechFiles[obj2sTech];
    const file = mockFile(fileName);

    // drop the file into the drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    // expect the file to appear as uploaded
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText(fileName)).toBeInTheDocument();

    // check that the upload button is enabled
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).not.toBeDisabled();
  });

  test.each(obj2sTechs)('drag and drop does not work with invalid Obj2s file for tech %s', async (obj2sTech) => {
    await renderFileUploadModal(initialStore);

    // technology input should be enabled because there is no previously uploaded data
    const techInput = document.querySelector(
      '[data-testid="uploadTechSelect"] input',
    );

    expect(techInput).toBeEnabled();

    selectTech(obj2sTech);

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();

    // get the dropzone input
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create an invalid file
    const file = mockFile('scdata.txt');

    // drop the invalid file into the drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    // expect the invalid file to show up
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText('scdata.txt')).toBeInTheDocument();

    // check that the upload button is disabled as the file is invalid
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();
  });

  test.each(obj2sTechs)('drag and drop fails with valid Obj2s file when pre-existing Obj2s file exists for experiment for tech %s', async (obj2sTech) => {
    await renderFileUploadModal(prevUpStore, obj2sTech);

    // relevant tech info should show up as there is previously uploaded data
    await waitFor(() => expect(
      screen.getByText(/object must contain the following/),
    ).toBeInTheDocument());

    // technology input should be disabled because we have existing data
    const techInput = document.querySelector(
      '[data-testid="uploadTechSelect"] input',
    );

    expect(techInput).toBeDisabled();

    expect(await screen.queryByText(/To upload/)).not.toBeInTheDocument();

    // get the dropzone input
    const uploadInput = document.querySelector(
      `[data-test-id="${integrationTestConstants.ids.FILE_UPLOAD_INPUT}"]`,
    );

    // create a file specific to each tech if needed
    const fileName = obj2sTechFiles[obj2sTech];
    const file = mockFile(fileName);

    // drop the valid file into the drop-zone
    await act(async () => {
      Object.defineProperty(uploadInput, 'files', {
        value: [file],
      });

      fireEvent.drop(uploadInput);
    });

    // expect that the file does not show up due to pre-existing file
    expect(await screen.queryByText(fileName)).not.toBeInTheDocument();

    // upload should be disabled as a pre-existing file exists for the experiment
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();

    // expect an error message to be displayed to the user
    expect(handleError).toHaveBeenCalledWith('error', endUserMessages.ERROR_OBJ2S_EXISTING_FILE);
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
