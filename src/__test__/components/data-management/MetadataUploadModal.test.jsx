import {
  render, screen, fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';

import componentFactory from '__test__/test-utils/testComponentFactory';
import MetadataUploadModal from 'components/data-management/MetadataUploadModal';

const defaultProps = {
  onUpload: jest.fn(),
  onCancel: jest.fn(),
};

const MetadataModalFactory = componentFactory(MetadataUploadModal, defaultProps);

const renderMetadataUploadModal = async (customProps = {}) => {
  act(() => {
    render(MetadataModalFactory(customProps));
  });
};

describe('MetadataUploadModal', () => {
  it.only('shows required components required to upload the metadata file', async () => {
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
});
