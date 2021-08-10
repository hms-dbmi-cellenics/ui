import React from 'react';
import * as rtl from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import _ from 'lodash';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { getByLabelText } from '@testing-library/react';
import {
  initialComponentConfigStates,
} from '../../../redux/reducers/componentConfig/initialState';
import * as markerGenesLoaded from '../../../redux/reducers/genes/markerGenesLoaded';
import initialExperimentState from '../../../redux/reducers/experimentSettings/initialState';
import rootReducer from '../../../redux/reducers/index';
import genes from '../../../redux/reducers/genes/initialState';
import * as loadConfig from '../../../redux/reducers/componentConfig/loadConfig';
import HeatmapPlot from '../../../pages/experiments/[experimentId]/plots-and-tables/marker-heatmap/index';
import { fetchCachedWork } from '../../../utils/cacheRequest';
import { mockCellSets1 as cellSets } from '../../test-utils/cellSets.mock';

jest.mock('localforage');
enableFetchMocks();
jest.mock('../../../components/plots/Header', () => () => <div />);

jest.mock('../../../utils/cacheRequest', () => ({
  fetchCachedWork: jest.fn().mockImplementation((expId, body) => {
    if (body.name === 'ListGenes') {
      return new Promise((resolve) => resolve({
        rows: [{ gene_names: 'MockGeneWithHighestDispersion', dispersions: 54.0228 }],
      }));
    }
    if (body.name === 'MarkerHeatmap') {
      return new Promise((resolve) => {
        resolve('resolved');
      });
    }
  }),
}));
const defaultStore = {
  cellSets,
  componentConfig: initialComponentConfigStates,
  embeddings: {},
  experimentSettings: {
    ...initialExperimentState,
    backendStatus: {
      status: {
        pipeline: {
          startDate: '2020-01-01T00:00:00',
          status: 'SUCEEDED',
        },
        worker: { status: 'Running' },
        gem2s: { status: 'SUCCEEDED' },
      },
    },
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
  genes,
};

const experimentId = 'randomExperiment';
let store = null;
let loadConfigSpy = null;
let loadMarkersSpy;

const renderHeatmapPage = async () => {
  store = createStore(rootReducer, _.cloneDeep(defaultStore), applyMiddleware(thunk));
  rtl.render(
    <Provider store={store}>
      <HeatmapPlot
        experimentId={experimentId}
      />
    </Provider>,
  );
  await rtl.waitFor(() => expect(loadConfigSpy).toHaveBeenCalledTimes(1));
  await rtl.waitFor(() => expect(fetchCachedWork).toHaveBeenCalledTimes(1));
};

describe('Marker heatmap plot', () => {
  beforeAll(async () => {
    await preloadAll();
  });
  beforeEach(() => {
    jest.clearAllMocks(); // Do not mistake with resetAllMocks()!
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({}), { status: 404, statusText: '404 Not Found' });
    loadConfigSpy = jest.spyOn(loadConfig, 'default');
    loadMarkersSpy = jest.spyOn(markerGenesLoaded, 'default');
  });

  // marker heatmap renders
  it('loads initially', async () => {
    await renderHeatmapPage();

    expect(loadMarkersSpy).toHaveBeenCalled();
  });

  it('loads marker genes on selecting', async () => {
    await renderHeatmapPage();

    const geneSelection = rtl.screen.getByText('Gene selection');
    userEvent.click(geneSelection);
    const radioButton = getByLabelText(geneSelection.parentElement, '10');
    userEvent.click(radioButton);

    expect(loadMarkersSpy).toHaveBeenCalled();
  });
});
