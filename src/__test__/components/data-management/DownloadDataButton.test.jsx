import React from 'react';
import _ from 'lodash';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

// import thunk from 'redux-thunk';
import { screen, render, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preloadAll from 'jest-next-dynamic';

import { act } from 'react-dom/test-utils';
// import configureMockStore from 'redux-mock-store';

import DownloadDataButton from 'components/data-management/DownloadDataButton';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';

import { processingConfig } from '__test__/test-utils/mockData';
import backendStatusData from '__test__/data/backend_status.json';

import fetchWork from 'utils/work/fetchWork';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { makeStore } from 'redux/store';
import { loadExperiments } from 'redux/actions/experiments';

import mockAPI, { delayedResponse, generateDefaultMockAPIResponses, promiseResponse } from '__test__/test-utils/mockAPI';
import fake from '__test__/test-utils/constants';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';

jest.mock('utils/pushNotificationMessage');
jest.mock('utils/downloadFromUrl');
jest.mock('utils/work/fetchWork');

const experimentId = `${fake.EXPERIMENT_ID}-0`;

enableFetchMocks();

const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  {
    [`experiments/${experimentId}/processingConfig`]: () => promiseResponse(
      JSON.stringify({ processingConfig }),
    ),
  },
);

describe('DownloadDataButton', () => {
  let storeState;

  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Do not mistake with resetAllMocks()!
    fetchMock.resetMocks();

    storeState = makeStore();
  });

  const renderDownloadDataButton = async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          <DownloadDataButton />
        </Provider>,
      );
    });
  };

  const getMenuItems = async () => {
    const menu = await screen.getByText('Download');
    expect(menu).not.toBeDisabled();

    await act(async () => {
      userEvent.click(menu);
    });

    const options = await screen.getAllByRole('menuitem');
    return options;
  };

  it('should render the download data menu', async () => {
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    await act(async () => {
      storeState.dispatch(loadExperiments());
    });
    await act(async () => {
      storeState.dispatch(loadProcessingSettings(experimentId));
    });
    await act(async () => {
      storeState.dispatch(loadBackendStatus(experimentId));
    });

    await renderDownloadDataButton();

    const options = await getMenuItems();
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Processed Seurat object (.rds)');
    expect(options[1]).toHaveTextContent('Data Processing settings (.txt)');
    expect(options[0]).toHaveAttribute('aria-disabled', 'false');
    expect(options[1]).toHaveAttribute('aria-disabled', 'false');
  });

  it('Processed Seurat object option is disabled if qc has not succeeded', async () => {
    const backendStatus = _.cloneDeep(backendStatusData);

    backendStatus.pipeline.status = 'FAILED';
    backendStatus.gem2s.status = 'SUCCEEDED';

    const qcFailMockAPIResponse = _.merge(
      mockAPIResponse,
      { [`experiments/${experimentId}/backendStatus`]: () => promiseResponse(JSON.stringify(backendStatus)) },
    );

    fetchMock.mockIf(/.*/, mockAPI(qcFailMockAPIResponse));

    await act(async () => {
      storeState.dispatch(loadExperiments());
    });
    await act(async () => {
      storeState.dispatch(loadProcessingSettings(experimentId));
    });

    await act(async () => {
      storeState.dispatch(loadBackendStatus(experimentId));
    });

    await renderDownloadDataButton();
    const options = await getMenuItems();
    expect(options[0]).toHaveAttribute('aria-disabled', 'true');
    expect(options[1]).toHaveAttribute('aria-disabled', 'false');
  });

  it('Data procesing settings option is disabled if a step misses a sample', async () => {
    const processingConfigMissingSample = _.cloneDeep(processingConfig);
    // Remove settings for one sample
    delete processingConfigMissingSample.cellSizeDistribution[`${fake.SAMPLE_ID}-0`];

    const stepMissingMockAPIResponse = _.merge(
      mockAPIResponse,
      {
        [`experiments/${experimentId}/processingConfig`]: () => promiseResponse(
          JSON.stringify({ processingConfig: processingConfigMissingSample }),
        ),
      },
    );

    fetchMock.mockIf(/.*/, mockAPI(stepMissingMockAPIResponse));

    await act(async () => {
      storeState.dispatch(loadExperiments());
    });
    await act(async () => {
      storeState.dispatch(loadProcessingSettings(experimentId));
    });

    await act(async () => {
      storeState.dispatch(loadBackendStatus(experimentId));
    });

    await renderDownloadDataButton();
    const options = await getMenuItems();
    expect(options[0]).toHaveAttribute('aria-disabled', 'false');
    expect(options[1]).toHaveAttribute('aria-disabled', 'true');
  });

  it('Downloads data properly', async () => {
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    await act(async () => {
      storeState.dispatch(loadExperiments());
    });
    await act(async () => {
      storeState.dispatch(loadProcessingSettings(experimentId));
    });
    await act(async () => {
      storeState.dispatch(loadBackendStatus(experimentId));
    });

    fetchWork.mockImplementation((expId, body) => {
      if (body.name === 'GetEmbedding') {
        return Promise.resolve();
      }
    });

    await renderDownloadDataButton();

    // Open the Download dropdown
    userEvent.click(screen.getByText(/Download/i));

    const downloadButton = screen.getByText(/Processed Seurat object/i);

    await act(async () => {
      fireEvent.click(downloadButton);
    });

    expect(fetchWork).toHaveBeenCalledTimes(2);
    expect(fetchWork.mock.calls).toMatchSnapshot();
  });

  it('Shows an error if there is an error downloading data', async () => {
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    await act(async () => {
      storeState.dispatch(loadExperiments());
    });
    await act(async () => {
      storeState.dispatch(loadProcessingSettings(experimentId));
    });
    await act(async () => {
      storeState.dispatch(loadBackendStatus(experimentId));
    });

    fetchWork.mockImplementation((expId, body) => {
      if (body.name === 'GetEmbedding') {
        return Promise.resolve();
      }

      if (body.name === 'DownloadAnnotSeuratObject') {
        return Promise.reject(new Error('some worker error'));
      }
    });

    await renderDownloadDataButton();

    // Open the Download dropdown
    userEvent.click(screen.getByText(/Download/i));

    const downloadButton = screen.getByText(/Processed Seurat object/i);

    await act(async () => {
      fireEvent.click(downloadButton);
    });

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith('error', endUserMessages.ERROR_DOWNLOADING_SEURAT_OBJECT);
  });

  it('Has options disabled if backend status is still loading', async () => {
    const loadingStatusApiResponse = _.merge(
      mockAPIResponse,
      { [`experiments/${experimentId}/backendStatus`]: () => new Promise(() => { }) },
    );

    fetchMock.mockIf(/.*/, mockAPI(loadingStatusApiResponse));

    await act(async () => {
      storeState.dispatch(loadExperiments());
    });
    await act(async () => {
      storeState.dispatch(loadProcessingSettings(experimentId));
    });
    await act(async () => {
      storeState.dispatch(loadBackendStatus(experimentId));
    });

    await renderDownloadDataButton();
    const options = await getMenuItems();

    expect(options[0]).toHaveAttribute('aria-disabled', 'true');
    expect(options[1]).toHaveAttribute('aria-disabled', 'true');
  });
});
