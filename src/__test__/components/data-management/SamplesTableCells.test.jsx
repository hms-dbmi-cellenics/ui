import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import '@testing-library/jest-dom';
import {
  UploadCell,
  EditableFieldCell,
  SampleNameCell,
} from 'components/data-management/SamplesTableCells';
import UploadStatus, { messageForStatus } from 'utils/upload/UploadStatus';
import { makeStore } from 'redux/store';

jest.mock('swr', () => () => ({
  data: [
    {
      id: 'mmusculus',
      display_name: 'Mouse',
      scientific_name: 'Mus musculus',
    },
    {
      id: 'hsapiens',
      display_name: 'Human',
      scientific_name: 'Homo sapies',
    },
    {
      id: 'mock',
      display_name: 'Mock',
      scientific_name: 'Mock',
    },
  ],
}));

describe('UploadCell', () => {
  let storeState = null;

  beforeEach(() => {
    storeState = makeStore();
  });

  it('Correctly renders the status messages', () => {
    Object.keys(UploadStatus).forEach((statusKey) => {
      const cellData = {
        file: {
          upload: {
            status: UploadStatus[statusKey],
          },
        },
      };

      render(
        <Provider store={storeState}>
          <UploadCell columnId={1} tableCellData={cellData} />
        </Provider>,
      );

      const statusMessage = messageForStatus(UploadStatus[statusKey]);
      expect(screen.getByText(statusMessage)).toBeInTheDocument();
    });
  });

  it('Correctly renders percent progress', () => {
    const percentUploaded = 67;
    const uploadingCellData = {
      file: {
        upload: {
          progress: percentUploaded,
          status: UploadStatus.UPLOADING,
        },
      },
    };

    render(
      <Provider store={storeState}>
        <UploadCell columnId={1} tableCellData={uploadingCellData} />
      </Provider>,
    );

    expect(screen.getByText(`${percentUploaded}%`)).toBeInTheDocument();
  });

  it('Clicking on the upload shows details modal', () => {
    const status = UploadStatus.UPLOADED;
    const uploadMessage = messageForStatus(status);

    const uploadingCellData = {
      file: {
        upload: {
          status,
        },
      },
    };

    render(
      <Provider store={storeState}>
        <UploadCell columnId={1} tableCellData={uploadingCellData} />
      </Provider>,
    );

    act(() => {
      userEvent.click(screen.getByText(uploadMessage));
    });

    expect(screen.getByText(/Upload successful/i)).toBeInTheDocument();
  });
});

describe('EditableFieldCell', () => {
  // These cells should not be deleted independently of the column.
  it('Field should not be deletable', () => {
    const mockOnAfterSubmit = jest.fn();

    render(<EditableFieldCell
      cellText
      dataIndex='mockIndex'
      rowIdx={1}
      onAfterSubmit={mockOnAfterSubmit}
    />);

    expect(screen.queryByLabelText('delete')).toBeNull();
  });

  it('Shows the input text', () => {
    const mockCellText = 'mock cell text';

    render(<EditableFieldCell
      cellText={mockCellText}
      dataIndex='mockIndex'
      rowIdx={1}
      onAfterSubmit={() => {}}
    />);

    expect(screen.getByText(mockCellText)).toBeInTheDocument();
  });
});

describe('SampleNameCell', () => {
  let storeState = null;

  beforeEach(() => {
    storeState = makeStore();
  });

  it('Shows the sample name', () => {
    const mockSampleName = 'my mocky name';

    const cellInfo = {
      text: mockSampleName,
      record: { uuid: 'mock-uuid' },
      idx: 1,
    };

    render(
      <Provider store={storeState}>
        <SampleNameCell cellInfo={cellInfo} />
      </Provider>,
    );

    expect(screen.getByText(mockSampleName)).toBeInTheDocument();
  });
});
