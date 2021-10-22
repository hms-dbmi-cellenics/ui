import React from 'react';
import _ from 'lodash';

import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import fake from '__test__/test-utils/constants';
import MarkerHeatmap from 'pages/experiments/[experimentId]/plots-and-tables/marker-heatmap/index';
import { loadBackendStatus } from 'redux/actions/backendStatus';

import markerGenesData5 from '__test__/data/marker_genes_5.json';
import markerGenesData2 from '__test__/data/marker_genes_2.json';
import expressionDataFAKEGENE from '__test__/data/gene_expression_FAKEGENE.json';

import mockApi, { promiseResponse, promiseStatus } from '__test__/test-utils/mockPlatformAPI';

import { makeStore } from 'redux/store';
import * as socketConnectionMocks from 'utils/socketConnection';
import * as seekWorkResponseMocks from 'utils/work/seekWorkResponse';

import SocketMock from 'socket.io-mock';
import { loadGeneExpression } from 'redux/actions/genes';

enableFetchMocks();

// Mock hash so we can control the ETag that is produced
// and  use the ETag to route mock responses from S3
jest.mock('object-hash', () => ({
  MD5: (object) => {
    if (object?.body) {
      return object.body.nGenes.toString();
    }

    if (object?.missingGenesBody) {
      // Return concatenated string of missing gene names
      // e.g. gene1-gene2-gene3
      return object.missingGenesBody.genes.join('-');
    }
  },
}));

// Return mock configuration for accessing AWS resources
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

jest.mock('utils/work/seekWorkResponse', () => {
  const mockSeekFromS3 = jest.fn();
  const originalModule = jest.requireActual('utils/work/seekWorkResponse');

  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    seekFromS3: mockSeekFromS3,
  };
});

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

const additionalMockAPIRoutes = {
  '/plots-tables/markerHeatmapPlotMain': () => promiseStatus(404, 'Not Found'),
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
  '/marker-genes/FAKEGENE': () => promiseResponse(
    JSON.stringify({
      results: [
        {
          body: JSON.stringify(expressionDataFAKEGENE),
        },
      ],
      response: { error: false },
    }),
  ),
};

const heatmapPageFactory = (customProps = {}) => {
  const props = _.merge({
    experimentId: fake.EXPERIMENT_ID,
  }, customProps);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <MarkerHeatmap {...props} />;
};

// Helper function to get displayed genes from the gene input
const getDisplayedGenes = (container) => {
  const genesNodeList = container.querySelectorAll('span[class*=selection-item-content]');
  return Array.from(genesNodeList).map((gene) => gene.textContent);
};

describe('Marker heatmap plot', () => {
  const socketMock = new SocketMock();

  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockApi(experimentId, additionalMockAPIRoutes));
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
    await act(async () => (
      render(
        <Provider store={storeState}>
          {heatmapPageFactory()}
        </Provider>,
      )
    ));

    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();
  });

  it('loads marker genes on specifying new nunmber of genes per cluster', async () => {
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

    // Go back to "Custom Genes" and check the number of genes
    userEvent.click(screen.getByText('Custom genes'));

    // The genes in Data 2 should exist
    markerGenesData2.order.forEach((geneName) => {
      expect(screen.getByText(geneName)).toBeInTheDocument();
    });
  });

  it('adds genes correctly into the plot', async () => {
    await act(async () => (
      render(
        <Provider store={storeState}>
          {heatmapPageFactory()}
        </Provider>,
      )
    ));

    // Add in a new gene
    // This is done because we can not insert text into the genes list input
    const genesToLoad = [...markerGenesData5.order, 'FAKEGENE'];

    await act(async () => {
      storeState.dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    });

    expect(screen.getByText('FAKEGENE')).toBeInTheDocument();

    // The returned value is a HTML NodeList
    const genesContainer = screen.getByText('FAKEGENE').closest('div[class*=selector]');

    const displayedGenesList = getDisplayedGenes(genesContainer);

    // Check that the genes is ordered correctly.
    // This means that FAKEGENE should not be the last in the genes list
    expect(_.isEqual(displayedGenesList, genesToLoad)).toEqual(false);
  });

  it('removing a gene keeps the sorted order without re-sorting', async () => {
    await act(async () => (
      render(
        <Provider store={storeState}>
          {heatmapPageFactory()}
        </Provider>,
      )
    ));

    // Setting up so that there is an inserted gene in the list
    const genesToLoad = [...markerGenesData5.order, 'FAKEGENE'];

    await act(async () => {
      // This is done because we can not insert text into the genes list input
      storeState.dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    });

    expect(screen.getByText('FAKEGENE')).toBeInTheDocument();

    // The returned value is a HTML NodeList
    const genesContainer = screen.getByText('FAKEGENE').closest('div[class*=selector]');
    const genesListBeforeRemoval = getDisplayedGenes(genesContainer);

    // Removing the 5th gene from the list
    // genesListBeforeRemoval is modified - splice removes the item from the list
    const geneToRemove = genesListBeforeRemoval.splice(5, 1);
    const geneRemoveButton = screen.getByText(geneToRemove).nextSibling;

    userEvent.click(geneRemoveButton);

    // Get newly displayed genes after the removal
    const genesListAfterRemoval = getDisplayedGenes(genesContainer);

    // The list of displayed genes should be in the same order as the displayed genes
    expect(_.isEqual(genesListAfterRemoval, genesListBeforeRemoval)).toEqual(true);
  });
});
