import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import '@testing-library/jest-dom';
import {
  UploadCell,
  EditableFieldCell,
  SampleNameCell,
} from 'components/data-management/SamplesTableCells';
import UploadStatus, { messageForStatus } from 'utils/upload/UploadStatus';
import { makeStore } from 'redux/store';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';
import { loadSamples, updateSampleFileUpload } from 'redux/actions/samples';

import fake from '__test__/test-utils/constants';

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

const experimentId = `${fake.EXPERIMENT_ID}-0`;
const sampleId = `${fake.SAMPLE_ID}-0`;

enableFetchMocks();

describe('UploadCell', () => {
  const fileCategory = 'features.tsv.gz';

  let storeState = null;

  beforeEach(async () => {
    fetchMock.mockClear();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId)));

    storeState = makeStore();

    await storeState.dispatch(loadSamples(experimentId));
  });

  it('Correctly renders the status message', async () => {
    render(
      <Provider store={storeState}>
        <UploadCell columnId={fileCategory} sampleUuid={sampleId} />
      </Provider>,
    );

    const statusMessage = messageForStatus(UploadStatus.UPLOADED);
    expect(screen.getByText(statusMessage)).toBeInTheDocument();
  });

  it('Correctly renders percent progress', async () => {
    const percentUploaded = 67;

    await storeState.dispatch(
      updateSampleFileUpload(
        experimentId, sampleId, 'features10x', UploadStatus.UPLOADING, percentUploaded,
      ),
    );

    render(
      <Provider store={storeState}>
        <UploadCell columnId={fileCategory} sampleUuid={sampleId} />
      </Provider>,
    );

    expect(screen.getByText(`${percentUploaded}%`)).toBeInTheDocument();
  });

  it('Clicking on the upload shows details modal', () => {
    const status = UploadStatus.UPLOADED;
    const uploadMessage = messageForStatus(status);

    render(
      <Provider store={storeState}>
        <UploadCell columnId={fileCategory} sampleUuid={sampleId} />
      </Provider>,
    );

    act(() => {
      userEvent.click(screen.getByText(uploadMessage));
    });

    expect(screen.getByText(/Upload successful/i)).toBeInTheDocument();
  });
});

describe('EditableFieldCell', () => {
  let storeState = null;

  beforeEach(async () => {
    fetchMock.mockClear();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId)));

    storeState = makeStore();

    await storeState.dispatch(loadSamples(experimentId));
  });

  // These cells should not be deleted independently of the column.
  it('Field should not be deletable', () => {
    const mockOnAfterSubmit = jest.fn();

    render(
      <Provider store={storeState}>
        <EditableFieldCell
          sampleUuid={sampleId}
          dataIndex='age'
          rowIdx={0}
          onAfterSubmit={mockOnAfterSubmit}
        />
      </Provider>,
    );

    expect(screen.queryByLabelText('delete')).toBeNull();
  });

  it('Shows the input text', () => {
    render(
      <Provider store={storeState}>
        <EditableFieldCell
          sampleUuid={sampleId}
          dataIndex='age'
          rowIdx={0}
          onAfterSubmit={() => { }}
        />
      </Provider>,
    );

    expect(screen.getByText('BL')).toBeInTheDocument();
  });
});

describe('SampleNameCell', () => {
  let storeState = null;

  beforeEach(async () => {
    fetchMock.mockClear();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId)));

    storeState = makeStore();

    await storeState.dispatch(loadSamples(experimentId));
  });

  it('Shows the sample name', () => {
    const cellInfo = {
      record: { uuid: sampleId },
      idx: 1,
    };

    render(
      <Provider store={storeState}>
        <SampleNameCell cellInfo={cellInfo} />
      </Provider>,
    );

    expect(screen.getByText('Mock sample 0')).toBeInTheDocument();
  });
});
