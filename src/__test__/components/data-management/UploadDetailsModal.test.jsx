import React from 'react';
import {
  render, screen, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import UploadDetailsModal from 'components/data-management/UploadDetailsModal';
import UploadStatus from 'utils/upload/UploadStatus';

const mockOnDelete = jest.fn();
const mockOnCancel = jest.fn();
const mockOnDownload = jest.fn();
const mockOnRetry = jest.fn();

const defaultProps = {
  visible: true,
  data: {
    size: 1024,
    lastModified: new Date().toISOString(),
    upload: {
      progress: 50,
      status: UploadStatus.UPLOADING,
    },
  },
  extraFields: {},
  onDelete: mockOnDelete,
  onCancel: mockOnCancel,
  onDownload: mockOnDownload,
  onRetry: mockOnRetry,
};

const renderUploadDetailsModal = (props = {}) => {
  render(<UploadDetailsModal {...defaultProps} {...props} />);
};

describe('UploadDetailsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays the modal with the correct title when uploaded', () => {
    renderUploadDetailsModal({
      data: {
        ...defaultProps.data,
        upload: { ...defaultProps.data.upload, status: UploadStatus.UPLOADED },
      },
    });

    expect(screen.getByText('Uploaded')).toBeInTheDocument();
  });

  it('displays the modal with the correct title when file not found', () => {
    renderUploadDetailsModal({
      data: {
        ...defaultProps.data,
        upload: { status: UploadStatus.FILE_NOT_FOUND },
      },
    });
    expect(screen.getAllByText('File not found').length).toBeGreaterThan(0);
  });

  it('calls onRetry when the retry button is clicked', async () => {
    renderUploadDetailsModal({
      data: {
        ...defaultProps.data,
        upload: { ...defaultProps.data.upload, status: UploadStatus.ERROR },
        fileObject: [1, 2, 3, 4, 5, 6],
      },
    });

    const retryButton = screen.getByText('Retry upload');
    expect(retryButton).toBeEnabled();

    userEvent.click(retryButton);

    await waitFor(() => expect(mockOnRetry).toHaveBeenCalled());
  });

  it('calls onDownload when the download button is clicked', () => {
    renderUploadDetailsModal({
      data: {
        ...defaultProps.data,
        upload: { ...defaultProps.data.upload, status: UploadStatus.UPLOADED },
      },
    });

    const downloadButton = screen.getByText('Download');
    userEvent.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalled();
  });

  it('renders error message when there is an upload error', () => {
    const status = UploadStatus.UPLOAD_ERROR;
    renderUploadDetailsModal({
      data: {
        ...defaultProps.data,
        upload: { ...defaultProps.data.upload, status },
      },
    });

    const errorMessages = screen.getAllByText('Error');
    expect(errorMessages.length).toBeGreaterThan(0);
  });
  it('Deleting the file calls onDelete', () => {
    const status = UploadStatus.UPLOADED;
    renderUploadDetailsModal({
      data: {
        ...defaultProps.data,
        upload: { ...defaultProps.data.upload, status },
      },
    });

    const deleteButton = screen.getByText('Delete');
    userEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalled();
  });
});
