import React from 'react';
import { mount, configure } from 'enzyme';
import preloadAll from 'jest-next-dynamic';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';

import GenesVsUMIs from '../../../../components/data-processing/GenesVsUMIs/GenesVsUMIs';
import CalculationConfig from '../../../../components/data-processing/GenesVsUMIs/CalculationConfig';
import initialExperimentState from '../../../../redux/reducers/experimentSettings/initialState';

import { initialPlotConfigStates } from '../../../../redux/reducers/componentConfig/initialState';
import generateDataProcessingPlotUuid from '../../../../utils/generateDataProcessingPlotUuid';

jest.mock('localforage');
const mockStore = configureStore([thunk]);

const sampleId = 'sample-WT';
const sampleIds = ['sample-WT', 'sample-WT1', 'sample-KO'];
const experimentId = 'e1234';
const filterName = 'numGenesVsNumUmis';

const sample1 = generateDataProcessingPlotUuid(sampleId, filterName, 0);
const sample2 = generateDataProcessingPlotUuid(sampleId, filterName, 1);

const noData = {
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    [sample1]: {
      config: initialPlotConfigStates.featuresVsUMIsScatterplot,
      plotData: [],
    },
  },
};

const withData = {
  ...noData,
  componentConfig: {
    ...noData.componentConfig,
    [sample1]: {
      ...noData.componentConfig[sample1],
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
    [generateDataProcessingPlotUuid(sampleId, filterName, 1)]: {
      ...noData.componentConfig[sample2],
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
  },
};

describe('GenesVsUMIs', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  configure({ adapter: new Adapter() });

  it('renders correctly with no data', () => {
    const store = mockStore(noData);

    const component = mount(
      <Provider store={store}>
        <GenesVsUMIs
          onConfigChange={jest.fn()}
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
        />
      </Provider>,
    );

    const page = component.find(GenesVsUMIs).at(0);
    const calculationConfig = page.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = page.find(Vega);

    // No plots when there are no data
    expect(plots.length).toEqual(0);
  });

  it('Shows plot with data', async () => {
    const store = mockStore({
      experimentSettings: {
        ...initialExperimentState,
      },
      ...withData,
    });

    const component = mount(
      <Provider store={store}>
        <GenesVsUMIs
          onConfigChange={jest.fn()}
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
        />
      </Provider>,
    );

    const page = component.find(GenesVsUMIs).at(0);
    const calculationConfig = page.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = page.find(Vega);

    // only 1 main scatterplot
    expect(plots.length).toEqual(1);
  });
});
