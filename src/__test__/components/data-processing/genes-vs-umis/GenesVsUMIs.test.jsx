import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import GenesVsUMIs from 'components/data-processing/GenesVsUMIs/GenesVsUMIs';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

import filterStatisticsMock from '../../../test-utils/plotData.mock';

const mockStore = configureStore([thunk]);

const sampleId = 'sample-WT';
const sampleIds = ['sample-WT', 'sample-WT1', 'sample-KO'];
const experimentId = 'e1234';
const filterName = 'numGenesVsNumUmis';
const PLOTS_PER_SAMPLE = 1;

const plotData1 = generateDataProcessingPlotUuid(sampleId, filterName, 0);
const filterStatistics = generateDataProcessingPlotUuid(sampleId, filterName, 1);

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

const noData = {
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    [plotData1]: {
      config: initialPlotConfigStates.featuresVsUMIsScatterplot,
      plotData: [],
    },
    [filterStatistics]: {
      plotData: [],
    },
  },
};

const withData = {
  ...noData,
  componentConfig: {
    ...noData.componentConfig,
    [plotData1]: {
      ...noData.componentConfig[plotData1],
      plotData: [
        {
          log_genes: 2.41995574848976,
          log_molecules: 2.70070371714502,
          lower_cutoff: 1,
          upper_cutoff: 3,
        },
        {
          log_genes: 2.36921585741014,
          log_molecules: 2.7041505168398,
          lower_cutoff: 1,
          upper_cutoff: 3,
        },
        {
          log_genes: 2.46389298898591,
          log_molecules: 2.70671778233676,
          lower_cutoff: 1,
          upper_cutoff: 3,
        },
      ],
    },
    [filterStatistics]: filterStatisticsMock(),
  },
};

describe('GenesVsUMIs', () => {
  const renderGeneVsUMIs = (store) => {
    render(
      <Provider store={store}>
        <GenesVsUMIs
          onConfigChange={jest.fn()}
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
          updateSettings={jest.fn()}
          plotType='unused'
          disabled={false}
        />
      </Provider>,
    );
  };

  it('renders correctly with no data', () => {
    const store = mockStore(noData);
    renderGeneVsUMIs(store);

    // Quering by text because antd does not create appropiate roles
    // Quering by test id because canvases are note created with tests
    expect(screen.queryByText('Filtering Settings')).toBeInTheDocument();
    expect(screen.queryByText(/Results will appear here/i)).toBeInTheDocument();
    expect(screen.queryByTestId('vega-container')).not.toBeInTheDocument();
    expect(screen.queryByText('Estimated number of cells')).not.toBeInTheDocument();
  });

  it('Shows plot with data', () => {
    const store = mockStore({
      experimentSettings: {
        ...initialExperimentState,
      },
      ...withData,
    });
    renderGeneVsUMIs(store);

    // Quering by text because antd does not create appropiate roles
    // Quering by test id because canvases are note created with tests
    expect(screen.queryByText('Filtering Settings')).toBeInTheDocument();
    expect(screen.queryAllByTestId('vega-container').length).toEqual(PLOTS_PER_SAMPLE);
    expect(screen.queryAllByText('Estimated number of cells').length).toEqual(PLOTS_PER_SAMPLE);
    expect(screen.queryByText(/Results will appear here/i)).not.toBeInTheDocument();
  });
});
