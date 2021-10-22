import React from 'react';
import _ from 'lodash';

import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import fake from '__test__/test-utils/constants';
// import mockMarkerHeatmapGeneResponse from '__test__/test-utils/markerHeatmapWorkResponse.mock';
import mockExperimentData from '__test__/test-utils/experimentData.mock';
// import mockBackendStatus from '__test__/test-utils/backendStatus.mock';
import MarkerHeatmap from 'pages/experiments/[experimentId]/plots-and-tables/marker-heatmap/index';
import { loadBackendStatus } from 'redux/actions/backendStatus';

import cellSetsData from '__test__/data/cell_sets.json';
import backendStatusData from '__test__/data/backend_status.json';
import markerGenesData5 from '__test__/data/marker_genes_5.json';
import markerGenesData2 from '__test__/data/marker_genes_2.json';
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
    get: jest.fn().mockImplementation(async (ETag) => `http://mock.s3.amazonaws.com/marker-genes/${ETag}`),
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

const promiseResponse = (response) => Promise.resolve(new Response(response));
const promiseStatus = (code, body) => Promise.resolve({
  status: code,
  body: JSON.stringify(body),
});

const generateMockApiConfig = (customMap = {}) => {
  const defaultMockApiMapping = {
    [experimentId]: () => promiseResponse(
      JSON.stringify(mockExperimentData),
    ),
    processingConfig: () => promiseResponse(
      JSON.stringify(processingConfigData),
    ),
    '/plots-tables/markerHeatmapPlotMain': () => promiseStatus(404, 'Not Founds'),
    '/cellSets': () => promiseResponse(
      JSON.stringify(cellSetsData),
    ),
    '/backendStatus': () => promiseResponse(
      JSON.stringify(backendStatusData),
    ),
    '/marker-genes/5': () => promiseResponse(
      JSON.stringify({
        results: [
          {
            body: JSON.stringify(markerGenesData5),
          },
        ],
        response: { error: false },
      }),
    ),
    '/marker-genes/2': () => promiseResponse(
      JSON.stringify({
        results: [
          {
            body: JSON.stringify(markerGenesData2),
          },
        ],
        response: { error: false },
      }),
    ),
  };

  return _.merge(
    defaultMockApiMapping,
    customMap,
  );
};

const mockApi = (apiMapping) => (req) => {
  const path = req.url;

  console.log('*** path', path);

  const key = _.find(
    Object.keys(apiMapping),
    (urlStub) => path.endsWith(urlStub),
  );

  return apiMapping[key](req);
};

// Mock hash so that eTag is equal to numGenes
jest.mock('object-hash', () => ({
  MD5: (object) => object.body.nGenes.toString(),
}));

describe('Marker heatmap plot', () => {
  const socketMock = new SocketMock();

  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockApi(generateMockApiConfig()));
    storeState = makeStore();

    // Set up state for backend status
    storeState.dispatch(loadBackendStatus(experimentId));

    // Set to null to force fetch from API
    seekWorkResponseMocks.seekFromS3.mockImplementation(() => null);

    // Set up socket emitter mock
    socketConnectionMocks.mockEmit.mockImplementation((workRequestType, requestBody) => {
      const responseBody = { response: { error: false } };

      // After emitting, send reply to listener
      socketMock.socketClient.emit(`WorkResponse-${requestBody.ETag}`, responseBody);
    });

    // Set up socket listener mock
    socketConnectionMocks.mockOn.mockImplementation((channel, f) => {
      socketMock.on(channel, (responseBody) => f(responseBody));
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
    const defaultBody = {
      name: 'MarkerHeatmap',
      nGenes: 5,
      cellSetKey: 'louvain',
    };

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

  it.only('loads marker genes on specifying new nunmber of genes per cluster', async () => {
    await act(async () => (
      render(
        <Provider store={storeState}>
          {heatmapPageFactory()}
        </Provider>,
      )
    ));

    // Check that initially there are 5 marker genes - the default
    markerGenesData5.order.forEach((geneName) => {
      expect(screen.getByText(geneName)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('Marker genes'));

    expect(screen.getByText('Number of marker genes per cluster')).toBeInTheDocument();

    const nGenesInput = screen.getByRole('spinbutton', { name: 'Number of genes input' });

    userEvent.type(nGenesInput, '{backspace}2');

    await act(async () => {
      userEvent.click(screen.getByText('Run'));
    });

    // Expect there have been two calls to load marker genes : initial load and 2nd request
    expect(socketConnectionMocks.mockEmit.mock.calls.length).toEqual(2);

    // Go back to "Custom Genes" and check the number of genes
    userEvent.click(screen.getByText('Custom genes'));

    markerGenesData2.order.forEach((geneName) => {
      expect(screen.getByText(geneName)).toBeInTheDocument();
    });
  });

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
