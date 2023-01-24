import ConfigureEmbedding from 'components/data-processing/ConfigureEmbedding/ConfigureEmbedding';
import React from 'react';
import { Provider } from 'react-redux';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mockCellSets } from '__test__/test-utils/cellSets.mock';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import { screen, render } from '@testing-library/react';
import generateExperimentSettingsMock from '__test__/test-utils/experimentSettings.mock';
import userEvent from '@testing-library/user-event';

const mockStore = configureStore([thunk]);
const filterName = 'configureEmbedding';
const initialExperimentState = generateExperimentSettingsMock([]);

const {
  embeddingPreviewBySample, embeddingPreviewByCellSets,
  embeddingPreviewMitochondrialContent, embeddingPreviewDoubletScore,
} = initialPlotConfigStates;

const mockedStore = mockStore({
  embeddings: {
    ...initialEmbeddingState,
    umap: {
      data: [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
        [9, 10],
        [11, 12],
      ],
      loading: false,
      error: false,
    },
  },
  cellSets: mockCellSets,
  cellMeta: {
    doubletScores: {
      loading: false,
      error: false,
      data: [1, 2, 3, 4, 5],
    },
    mitochondrialContent: {
      loading: false,
      error: false,
      data: [6, 7, 8, 9, 10],
    },
    numOfGenes: {
      loading: false,
      error: false,
      data: [6, 7, 8, 9, 10],
    },
    numOfUmis: {
      loading: false,
      error: false,
      data: [6, 7, 8, 9, 10],
    },
  },
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    [generateDataProcessingPlotUuid(null, filterName, 0)]: {
      config: embeddingPreviewBySample,
      plotData: [],
    },
    [generateDataProcessingPlotUuid(null, filterName, 1)]: {
      config: embeddingPreviewByCellSets,
      plotData: [],
    },
    [generateDataProcessingPlotUuid(null, filterName, 2)]: {
      config: embeddingPreviewMitochondrialContent,
      plotData: [],
    },
    [generateDataProcessingPlotUuid(null, filterName, 3)]: {
      config: embeddingPreviewDoubletScore,
      plotData: [],
    },
  },
});

describe('Configure Embedding', () => {
  const renderConfigureEmbedding = async () => {
    const store = mockedStore;
    await render(
      <Provider store={store}>
        <ConfigureEmbedding
          experimentId='1234'
          key='configureEmbedding'
          onConfigChange={jest.fn}
        />
      </Provider>,
    );
  };
  it('renders correctly ', async () => {
    await renderConfigureEmbedding();

    // one fullsize plot rendered
    const plots = screen.getAllByRole('graphics-document');
    expect(plots.length).toEqual(1);

    // styling and settings options available
    expect(screen.getByText('Plot view')).toBeDefined();
    expect(screen.getByText('Embedding settings')).toBeDefined();
    expect(screen.getByText('Clustering settings')).toBeDefined();
    expect(screen.getByText('Plot styling')).toBeDefined();

    // additional select data option available
    userEvent.click(screen.getByText('Plot styling'));
    expect(screen.getAllByText('Select data')).toBeDefined();
  });

  it('allows selecting other plots', async () => {
    await renderConfigureEmbedding();

    // can select other plots
    ['Samples', 'Mitochondrial fraction reads', 'Doublet score', 'Cell sets', 'Number of genes', 'Number of UMIs'].forEach((plot) => {
      userEvent.click(screen.getByText(plot));
      // check that there are two elements with the plot name:
      // * the main plot title
      // * the plot view selector
      expect(screen.getAllByText(plot).length).toEqual(2);
    });
  });
});
