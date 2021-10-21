import React from 'react';
import _ from 'lodash';

import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import fake from '__test__/test-utils/constants';
import mockMarkerHeatmapGeneResponse from '__test__/test-utils/markerHeatmapWorkResponse.mock';
import mockExperimentData from '__test__/test-utils/experimentData.mock';
import mockBackendStatus from '__test__/test-utils/backendStatus.mock';
import MarkerHeatmap from 'pages/experiments/[experimentId]/plots-and-tables/marker-heatmap/index';
import { loadBackendStatus } from 'redux/actions/backendStatus';

import cellSetsData from '__test__/data/cell_sets.json';
import processingConfigData from '__test__/data/processing_config.json';

import { makeStore } from 'redux/store';
import * as socketConnectionMocks from 'utils/socketConnection';
import * as seekWorkResponseMocks from 'utils/work/seekWorkResponse';

import SocketMock from 'socket.io-mock';

enableFetchMocks();
jest.mock('utils/work/seekWorkResponse', () => {
  const mockSeekFromS3 = jest.fn();
  const originalModule = jest.requireActual('utils/work/seekWorkResponse');

  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    seekFromS3: mockSeekFromS3,
  };
});

// Mock Math.random() to return a predictable value
global.Math.random = () => 0.5;

jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-01').getTime());
// jest.mock('moment', () => () => jest.requireActual('moment')('4022-01-01T00:00:00.000Z'));

// Return
jest.mock('aws-amplify', () => ({
  configure: jest.fn().mockImplementation(() => ({
    Storage: {
      AWSS3: {
        bucket: 'biomage-originals-test',
      },
    },
  })),
  Storage: {
    get: jest.fn().mockImplementation(async () => 'http://mock.s3.amazonaws.com/marker-genes'),
  },
  Auth: {
    currentSession: jest.fn(() => ({
      getIdToken: (() => ({
        getJwtToken: () => 'fakeJwtToken',
      })),
    })),
  },
}));

jest.mock('utils/socketConnection', () => {
  const mockEmit = jest.fn();
  const mockOn = jest.fn();
  return {
    __esModule: true,
    default: new Promise((resolve) => {
      resolve({ emit: mockEmit, on: mockOn, id: '5678' });
    }),
    mockEmit,
    mockOn,
  };
});

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'markerHeatmapPlotMain';

let storeState = null;

const heatmapPageFactory = (customProps = {}) => {
  const props = _.merge({
    experimentId: fake.EXPERIMENT_ID,
  }, customProps);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <MarkerHeatmap {...props} />;
};

const mockFetchAPI = (req) => {
  const path = req.url;

  if (path.endsWith(experimentId)) {
    // return SWR call in Header to get experiment data
    return Promise.resolve(new Response(
      JSON.stringify(mockExperimentData),
    ));
  }

  if (path.endsWith('processingConfig')) {
    return Promise.resolve(new Response(
      JSON.stringify(processingConfigData),
    ));
  }

  // return call to loadPlotConfig
  if (path.endsWith('/plots-tables/markerHeatmapPlotMain')) {
    // Return 404 so plot uses default plot config
    return Promise.resolve({
      status: 404,
      body: JSON.stringify('Not Found'),
    });
  }

  // return calls from loadCellSets
  if (path.endsWith('/cellSets')) {
    return Promise.resolve(new Response(
      JSON.stringify(cellSetsData),
    ));
  }

  // Return backend status
  if (path.endsWith('/backendStatus')) {
    return Promise.resolve(new Response(
      JSON.stringify(mockBackendStatus),
    ));
  }

  if (path.endsWith('/marker-genes')) {
    return Promise.resolve(new Response(
      JSON.stringify({
        results: [
          {
            body: JSON.stringify(mockMarkerHeatmapGeneResponse),
          },
        ],
        response: { error: false },
      }),
    ));
  }
};

describe('Marker heatmap plot', () => {
  const socketMock = new SocketMock();

  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockFetchAPI);
    storeState = makeStore();

    // Set up state for backend status
    storeState.dispatch(loadBackendStatus(experimentId));

    socketConnectionMocks.mockEmit.mockImplementation((workRequestType, requestBody) => {
      const responseBody = {
        response: {
          error: false,
        },
      };

      // This is a mocked response emit response from server
      socketMock.socketClient.emit(`WorkResponse-${requestBody.ETag}`, responseBody);
    });

    socketConnectionMocks.mockOn.mockImplementation((channel, f) => {
      // This is a listener for the response from the server
      socketMock.on(channel, (responseBody) => {
        f(responseBody);
      });
    });
  });

  it('Loads controls and elements', async () => {
    await act(async () => (
      render(
        <Provider store={storeState}>
          {heatmapPageFactory()}
        </Provider>,
      )
    ));

    expect(screen.getByText(/Marker heatmap/i)).toBeInTheDocument();

    expect(screen.getByText(/Gene selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Cluster guardlines/i)).toBeInTheDocument();
    expect(screen.getByText(/Expression values/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
  });

  it('Loads the plot', async () => {
    seekWorkResponseMocks.seekFromS3.mockImplementation(() => null);

    const defaultBody = {
      name: 'MarkerHeatmap',
      nGenes: 5,
      cellSetKey: 'louvain',
    };

    socketConnectionMocks.mockEmit.mockImplementation((workRequestType, requestBody) => {
      // change seekfroms3.mockImplementation to return a response with the right genes
      seekWorkResponseMocks.seekFromS3.mockImplementationOnce(() => mockMarkerHeatmapGeneResponse);

      const responseBody = {
        response: {
          error: false,
        },
      };

      // call mockOn with a fake response from the worker
      socketMock.socketClient.emit(`WorkResponse-${requestBody.ETag}`, responseBody);
    });

    socketConnectionMocks.mockOn.mockImplementation((channel, f) => {
      // This is a listener for the response from the server
      socketMock.on(channel, (responseBody) => f(responseBody));
    });

    await act(async () => (
      render(
        <Provider store={storeState}>
          {heatmapPageFactory()}
        </Provider>,
      )
    ));

    // Check that work request is emitted
    expect(socketConnectionMocks.mockEmit).toHaveBeenCalledWith('WorkRequest', {
      ETag: '5935a9216045f65f708abdbfa5621061', // pragma: allowlist secret
      PipelineRunETag: '2021-08-16T12:10:32.320Z',
      socketId: '5678',
      experimentId: fake.EXPERIMENT_ID,
      Authorization: 'Bearer fakeJwtToken',
      body: defaultBody,
      timeout: '2020-01-01T00:01:00.060Z',
    });

    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
  });

  // it('loads marker genes on selecting', async () => {

  //   await act(async () => (
  //     render(
  //       <Provider store={storeState}>
  //         {heatmapPageFactory()}
  //       </Provider>,
  //     )
  //   ));

  //   const markerGenes = screen.getByText('Marker genes');

  //   userEvent.click(markerGenes);
  //   const nGenesInput = screen.getByRole('spinbutton', { name: 'Number of genes input' });
  //   userEvent.type(nGenesInput, 5);

  //   userEvent.click(screen.getByText('Run'));

  //   // Load marker genes
  // });

  // it.only('sorts genes properly when adding a gene', async () => {
  //   await act(async () => (
  //     render(
  //       <Provider store={storeState}>
  //         {heatmapPageFactory()}
  //       </Provider>,
  //     )
  //   ));

  // // Check that all genes are available
  // expect(screen.getByText('GENE1')).toBeInTheDocument();
  // expect(screen.getByText('GENE2')).toBeInTheDocument();
  // expect(screen.getByText('GENE3')).toBeInTheDocument();

  // // Get container of list of genes
  // const geneInput = screen.getByText('GENE1').closest('div[class*="selector"]');

  // // Type in a new gene
  // await act(async () => {
  //   userEvent.type(geneInput, 'GENE4');
  //   userEvent.keyboard(geneInput, '{enter}');
  // });

  // // Check that all genes are in the selection
  // expect(screen.getByText('GENE1')).toBeInTheDocument();
  // expect(screen.getByText('GENE2')).toBeInTheDocument();
  // expect(screen.getByText('GENE3')).toBeInTheDocument();
  // expect(screen.getByText('GENE4')).toBeInTheDocument();

  // // Check that genes are in order
  // const shownGenes = geneInput.querySelectorAll('div[class*=selection-item-content]');

  // ['GENE1', 'GENE2', 'GENE3', 'GENE4'].forEach((gene, i) => {
  //   expect(shownGenes[i].textContent).toBe(gene);
  // });

  // await waitFor(() => expect(configUpdatedSpy).toHaveBeenCalled());

  //   await act(async () => {
  //     storeState.dispatch(loadGeneExpression(experimentId, ['GENE1', 'GENE3', 'GENE2', 'GENE0'], plotUuid));
  //   });

  //   expect(storeState.getState().componentConfig[plotUuid].config.selectedGenes).toEqual(['GENE0', 'GENE1', 'GENE2', 'GENE3']);
  // });

  // it('removing a gene keeps the sorted order without re-sorting', async () => {
  //   await act(async () => (
  //     render(
  //       <Provider store={storeState}>
  //         {heatmapPageFactory()}
  //       </Provider>,
  //     )
  //   ));

  //   // await renderHeatmapPage(defaultStore);
  //   await waitFor(() => expect(configUpdatedSpy).toHaveBeenCalled());
  //   store.dispatch(loadGeneExpression(experimentId, ['gene0', 'gene3'], plotUuid));
  //   await waitFor(() => expect(configUpdatedSpy).toHaveBeenCalledTimes(4));
  //   expect(store.getState().componentConfig[plotUuid].config.selectedGenes).toEqual(['gene0', 'gene3']);
  //   expect(loadMarkersSpy).toHaveBeenCalledTimes(1);
  // });

  // it('loads cellsets if not available', async () => {
  //   const newStore = { ...storeState, cellSets: { loading: true } };
  //   store = createStore(rootReducer, _.cloneDeep(newStore), applyMiddleware(thunk));

  //   await act(async () => (
  //     <Provider store={storeState}>
  //       {heatmapPageFactory(storeState)}
  //     </Provider>
  //   ));

  //   const skeleton = screen.queryAllByRole('list');
  //   expect(skeleton.length).toBe(1);
  //   // await waitFor(() => expect(cellSetsLoadedSpy).toHaveBeenCalled());
  // });

  // it('loads processing settings if louvainresolution is not available', async () => {
  //   const newStore = {
  //     ...defaultStore,
  //     experimentSettings: {
  //       ...defaultStore.experimentSettings,
  //       processing: {
  //         configureEmbedding: {
  //           clusteringSettings: {
  //             methodSettings: {
  //               louvain: {
  //                 resolution: false,
  //               },
  //             },
  //           },
  //         },
  //         meta: { loading: true, loadingSettingsError: false },
  //       },
  //     },
  //   };
  //   await renderHeatmapPage(newStore);
  //   await waitFor(() => expect(loadedProcessingConfigSpy).toHaveBeenCalled());
  // });
});
