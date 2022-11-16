import React from 'react';
import {
  render, screen, waitFor, fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import integrationTestConstants from 'utils/integrationTestConstants';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';

import techOptions from 'utils/upload/fileUploadSpecifications';

import mockFile from '__test__/test-utils/mockFile';
import FileUploadModal from 'components/data-management/FileUploadModal';

const mockStore = configureMockStore([thunk]);

const initialState = {
  samples: {},
  experiments: {
    meta: {
      activeExperimentId: 'experiment-1234',
    },
  },
};

const previouslyUploadedState = {
  samples: { 'sample-1': { experimentId: 'experiment-1234' } },
  experiments: {
    meta: {
      activeExperimentId: 'experiment-1234',
    },
  },
};

const previouslyUploadedDifferentExperimentState = {
  samples: { 'sample-1': { experimentId: 'experiment-5678' } },
  experiments: {
    meta: {
      activeExperimentId: 'experiment-1234',
    },
  },
};

const initialStore = mockStore(initialState);
const previouslyUploadedStore = mockStore(previouslyUploadedState);
const previouslyUploadedDifferentExperimentStore = mockStore(previouslyUploadedDifferentExperimentState);

const renderFileUploadModal = async (store) => {
  await act(async () => (render(
    <Provider store={store}>
      <FileUploadModal onUpload={jest.fn()} onCancel={jest.fn()} />
    </Provider>,
  )));
};

const chromiumTech = Object.keys(techOptions)[0];
const seuratTech = Object.keys(techOptions)[1];

describe('FileUploadModal', () => {
  it('contains required components for Chromium 10X', async () => {
    await renderFileUploadModal(initialStore);

    // It has a select button to select technology
    expect(screen.getByText(chromiumTech)).toBeInTheDocument();

    // It contains instructions on what files can be uploaded
    expect(screen.getByText(/For each sample, upload a folder containing/i)).toBeInTheDocument();
    techOptions[chromiumTech].acceptedFiles.forEach((filename) => {
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

    // It has default chromium selected
    expect(screen.queryAllByText(chromiumTech).length).toBe(1);
    expect(screen.queryAllByText(seuratTech).length).toBe(0);

    // get the select
    const select = document.querySelector(
      '[data-testid="uploadTechSelect"] > .ant-select-selector',
    );

    expect(select).not.toBeNull();

    // click the select input
    fireEvent.mouseDown(select);

    // wait for the ant dropdown element to appear
    await waitFor(() => expect(
      document.querySelector('.ant-select-dropdown'),
    ).toBeInTheDocument());

    //
    const seuratOption = await screen.queryByRole('option', { selected: false, title: seuratTech });
    expect(seuratOption).toBeInTheDocument();

    // select a single dropdown option
    fireEvent.click(screen.getAllByText(seuratTech)[1]);

    // wait for Seurat info to appear
    await waitFor(() => expect(
      screen.getByText(/Seurat object[.]/),
    ).toBeInTheDocument());

    // Lists the requirements of the Seurat object
    expect(screen.getByText(/The Seurat object must contain the following slots and metadata:/i)).toBeInTheDocument();

    // including HVFInfo
    expect(screen.getByText(/HVFInfo\(scdata\)/i)).toBeInTheDocument();

    // clusters
    expect(screen.getByText(/scdata\$seurat_clusters/i)).toBeInTheDocument();

    // samples
    expect(screen.getAllByText(/scdata\$samples/i).length).toBe(2);

    // counts
    expect(screen.getByText(/scdata\[\['RNA'\]\]@counts/i)).toBeInTheDocument();

    // log-counts
    expect(screen.getByText(/scdata\[\['RNA'\]\]@data/i)).toBeInTheDocument();

    // reductions
    expect(screen.getByText(/scdata@reductions/i)).toBeInTheDocument();

    // inform used that metadata is auto-detected
    expect(screen.getByText(/sample level metadata .+ is auto-detected\./i)).toBeInTheDocument();

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

    // get the select
    const select = document.querySelector(
      '[data-testid="uploadTechSelect"] > .ant-select-selector',
    );

    expect(select).not.toBeNull();

    // click the select input
    fireEvent.mouseDown(select);

    // wait for the ant dropdown element to appear
    await waitFor(() => expect(
      document.querySelector('.ant-select-dropdown'),
    ).toBeInTheDocument());

    //
    const seuratOption = await screen.queryByRole('option', { selected: false, title: seuratTech });
    expect(seuratOption).toBeInTheDocument();

    // select a single dropdown option
    fireEvent.click(screen.getAllByText(seuratTech)[1]);

    // wait for Seurat info to appear
    await waitFor(() => expect(
      screen.getByText(/Seurat object[.]/),
    ).toBeInTheDocument());

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
    await renderFileUploadModal(previouslyUploadedDifferentExperimentStore);

    // get the select
    const select = document.querySelector(
      '[data-testid="uploadTechSelect"] > .ant-select-selector',
    );

    expect(select).not.toBeNull();

    // click the select input
    fireEvent.mouseDown(select);

    // wait for the ant dropdown element to appear
    await waitFor(() => expect(
      document.querySelector('.ant-select-dropdown'),
    ).toBeInTheDocument());

    //
    const seuratOption = await screen.queryByRole('option', { selected: false, title: seuratTech });
    expect(seuratOption).toBeInTheDocument();

    // select a single dropdown option
    fireEvent.click(screen.getAllByText(seuratTech)[1]);

    // wait for Seurat info to appear
    await waitFor(() => expect(
      screen.getByText(/Seurat object[.]/),
    ).toBeInTheDocument());

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

    // get the select
    const select = document.querySelector(
      '[data-testid="uploadTechSelect"] > .ant-select-selector',
    );

    expect(select).not.toBeNull();

    // click the select input
    fireEvent.mouseDown(select);

    // wait for the ant dropdown element to appear
    await waitFor(() => expect(
      document.querySelector('.ant-select-dropdown'),
    ).toBeInTheDocument());

    //
    const seuratOption = await screen.queryByRole('option', { selected: false, title: seuratTech });
    expect(seuratOption).toBeInTheDocument();

    // select a single dropdown option
    fireEvent.click(screen.getAllByText(seuratTech)[1]);

    // wait for Seurat info to appear
    await waitFor(() => expect(
      screen.getByText(/Seurat object[.]/),
    ).toBeInTheDocument());

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

    //  it was valid and shows up
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText('scdata.txt')).toBeInTheDocument();

    // upload is enabled
    // It has a disabled upload button if there are no uploaded files
    // Upload button is the last "Upload" text in the document
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();
  });

  it('drag and drop fails with valid Seurat file when pre-existing Seurat file exists for experiment', async () => {
    await renderFileUploadModal(previouslyUploadedStore);

    // get the select
    const select = document.querySelector(
      '[data-testid="uploadTechSelect"] > .ant-select-selector',
    );

    expect(select).not.toBeNull();

    // click the select input
    fireEvent.mouseDown(select);

    // wait for the ant dropdown element to appear
    await waitFor(() => expect(
      document.querySelector('.ant-select-dropdown'),
    ).toBeInTheDocument());

    //
    const seuratOption = await screen.queryByRole('option', { selected: false, title: seuratTech });
    expect(seuratOption).toBeInTheDocument();

    // select a single dropdown option
    fireEvent.click(screen.getAllByText(seuratTech)[1]);

    // wait for Seurat info to appear
    await waitFor(() => expect(
      screen.getByText(/Seurat object[.]/),
    ).toBeInTheDocument());

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

    // upload is disabled
    // It has a disabled upload button if there are no uploaded files
    // Upload button is the last "Upload" text in the document
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();
  });

  it('drag and drop does not work with invalid Seurat file', async () => {
    await renderFileUploadModal(initialStore);

    // get the select
    const select = document.querySelector(
      '[data-testid="uploadTechSelect"] > .ant-select-selector',
    );

    expect(select).not.toBeNull();

    // click the select input
    fireEvent.mouseDown(select);

    // wait for the ant dropdown element to appear
    await waitFor(() => expect(
      document.querySelector('.ant-select-dropdown'),
    ).toBeInTheDocument());

    //
    const seuratOption = await screen.queryByRole('option', { selected: false, title: seuratTech });
    expect(seuratOption).toBeInTheDocument();

    // select a single dropdown option
    fireEvent.click(screen.getAllByText(seuratTech)[1]);

    // wait for Seurat info to appear
    await waitFor(() => expect(
      screen.getByText(/Seurat object[.]/),
    ).toBeInTheDocument());

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

    //  it was valid and shows up
    expect(await screen.findByText(/To upload/)).toBeInTheDocument();
    expect(await screen.findByText('scdata.txt')).toBeInTheDocument();

    // upload is enabled
    // It has a disabled upload button if there are no uploaded files
    // Upload button is the last "Upload" text in the document
    const uploadButtonText = screen.getAllByText(/Upload/i).pop();
    const uploadButton = uploadButtonText.closest('button');

    expect(uploadButton).toBeDisabled();
  });
});
