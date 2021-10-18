import React from 'react';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import _ from 'lodash';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import {
  initialPlotConfigStates,
} from 'redux/reducers/componentConfig/initialState';

import { loadGeneExpression } from '../../../redux/actions/genes/index';
import markerGenesLoaded from '../../../redux/reducers/genes/markerGenesLoaded';
import configUpdated from '../../../redux/reducers/componentConfig/updateConfig';
import initialExperimentState from '../../../redux/reducers/experimentSettings/initialState';
import rootReducer from '../../../redux/reducers/index';
import loadConfig from '../../../redux/reducers/componentConfig/loadConfig';
import MarkerHeatmap from '../../../pages/experiments/[experimentId]/plots-and-tables/marker-heatmap/index';
import cellSetsLoaded from '../../../redux/actions/cellSets/loadCellSets';
import loadedProcessingConfig from '../../../redux/actions/experimentSettings/processingConfig/loadProcessingSettings';
import '__test__/test-utils/setupTests';

enableFetchMocks();
jest.mock('../../../components/plots/Header', () => () => <div />);
jest.mock('../../../utils/socketConnection', () => ({
  __esModule: true,
  default: new Promise((resolve) => {
    resolve({ emit: jest.fn(), on: jest.fn(), id: '5678' });
  }),
}));

const rawGeneExpressionData = [1, 2, 3, 4, 5];
const meanGeneExpressionData = 3;
const stdevExpressionData = 1.414213562;

const generateMockGeneData = ([geneNames]) => {
  const geneDataTemplate = {
    rawExpression: {
      expression: rawGeneExpressionData,
      mean: meanGeneExpressionData,
      stdev: stdevExpressionData,
    },
    truncatedExpression: {
      expression: rawGeneExpressionData,
      mean: meanGeneExpressionData,
      stdev: stdevExpressionData,
    },
    zScore: rawGeneExpressionData,
  };

  const data = geneNames.reduce((acc, geneName) => {
    acc[geneName] = geneDataTemplate;
    return acc;
  }, {});

  return {
    data,
    order: geneNames,
  };
};

jest.mock('utils/work/fetchWork', () => ({
  fetchWork: jest.fn().mockImplementation((expId, body) => {
    if (body.name === 'MarkerHeatmap') {
      return Promise.resolve(
        generateMockGeneData(['GENE0', 'GENE1', 'GENE2', 'GENE3', 'GENE4']),
      );
    }
    if (body.name === 'GeneExpression') {
      return Promise.resolve(
        generateMockGeneData(['GENE0', 'GENE1', 'GENE2', 'GENE3', 'GENE4']),
      );
    }
  }),
}));

const experimentId = 'randomExperiment';
const plotUuid = 'markerHeatmapPlotMain';

const defaultStore = {
  backendStatus: {
    [experimentId]: {
      status: {
        pipeline: {
          startDate: '2020-01-01T00:00:00',
          status: 'SUCEEDED',
        },
        worker: { status: 'Running' },
        gem2s: { status: 'SUCCEEDED' },
      },
    },
  },
  componentConfig: { [plotUuid]: { config: { ...initialPlotConfigStates.markerHeatmap } } },
  embeddings: {},
  experimentSettings: {
    ...initialExperimentState,
    processing: {
      configureEmbedding: {
        clusteringSettings: {
          methodSettings: {
            louvain: {
              resolution: 0.8,
            },
          },
        },
      },
    },
  },
  cellSets: {
    loading: false,
    hierarchy: [
      {
        key: 'louvain',
        children: [
          {
            key: 'louvain-0',
          },
          {
            key: 'louvain-1',
          },
          {
            key: 'louvain-2',
          },
          {
            key: 'louvain-3',
          },
        ],
      },
    ],
    properties: {
      louvain: {
        type: 'cellSets',
        cellIds: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
      },
      'louvain-0': {
        name: 'Cluster 0',
        color: '#e377c2',
        cellIds: new Set([1, 2, 3, 4]),
        rootNode: false,
        type: 'cellSets',
      },
      'louvain-1': {
        name: 'Cluster 1',
        color: '#8c564b',
        cellIds: new Set([5, 6, 7, 8]),
        rootNode: false,
        type: 'cellSets',
      },
      'louvain-2': {
        name: 'Cluster 2',
        color: '#d62728',
        cellIds: new Set([9, 10, 11, 12]),
        rootNode: false,
        type: 'cellSets',
      },
      'louvain-3': {
        name: 'Cluster 3',
        color: '#2ca02c',
        cellIds: new Set([13, 14, 15, 16]),
        rootNode: false,
        type: 'cellSets',
      },
      views: [],
    },
    hidden: 'Set()',
  },
  genes: {
    markers: {
      error: false,
    },
    expression: {
      loading: [],

      data: {
        gene0: {
          rawExpression: { expression: [5, 5, 5, 5, 0, 4, 4, 4, 2, 3, 4, 5, 0, 0, 4, 5] },
        },
        gene1: {
          rawExpression: { expression: [1, 2, 3, 4, 5, 4, 5, 5, 3, 0, 0, 0, 0, 0, 0, 0] },
        },
        gene3: {
          rawExpression: { expression: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1, 0] },
        },
      },
      views: {
        [plotUuid]: {
          data: ['gene0', 'gene1', 'gene3'],
        },
      },
    },
    properties: { views: { [plotUuid]: [] } },
  },
};

let store = null;
let loadConfigSpy = null;
let loadMarkersSpy;
let configUpdatedSpy;
let cellSetsLoadedSpy;
let loadedProcessingConfigSpy;

const heatmapPageFactory = (state, experimentId) => {
  store = createStore(rootReducer, _.cloneDeep(state), applyMiddleware(thunk));

  return(
    <Provider store={store}>
      <MarkerHeatmap
        experimentId={experimentId}
      />
    </Provider>,
  );
  await waitFor(() => expect(loadConfigSpy).toHaveBeenCalledTimes(1));
};

describe('Marker heatmap plot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Loads properly with all the option components', () => {



  })

  it('Initial load fetches genes', async () => {
    await renderHeatmapPage(defaultStore);
    expect(loadMarkersSpy).toHaveBeenCalled();
    expect(configUpdatedSpy).toHaveBeenCalled();
  });

  it('Adding a new gene to the list adds the gene', () => {


  })

  it('Removing a gene from the list removes the gene from the plot', () => {

  })

  it("Using marker genes load the correct number of genes", () => {

  })

  it("", () => {

  })
});
