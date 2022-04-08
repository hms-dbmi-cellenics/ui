import {
  render, screen,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';

import techOptions from 'utils/upload/fileUploadSpecifications';

import componentFactory from '__test__/test-utils/testComponentFactory';
import FileUploadModal from 'components/data-management/FileUploadModal';

const defaultProps = {
  onUpload: jest.fn(),
  onCancel: jest.fn(),
};

const FileUploadModalFactory = componentFactory(FileUploadModal, defaultProps);

const chosenTech = Object.keys(techOptions)[0];

const renderFileUploadModal = async (customProps = {}) => {
  await act(() => {
    render(FileUploadModalFactory(customProps));
  });
};

describe('FileUploadModal', () => {
  it('contains required components', async () => {
    await renderFileUploadModal();

    // It has a select button to select technology
    expect(screen.getByText(chosenTech)).toBeInTheDocument();

    // It contains instructions on what files can be uploaded
    expect(screen.getByText(/For each sample, upload a folder containing/i)).toBeInTheDocument();
    techOptions[chosenTech].acceptedFiles.forEach((filename) => {
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
  });
});
