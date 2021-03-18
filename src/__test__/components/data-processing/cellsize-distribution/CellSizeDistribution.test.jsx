import React from 'react';
import { mount, configure } from 'enzyme';
import preloadAll from 'jest-next-dynamic';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';

import CellSizeDistribution from '../../../../components/data-processing/CellSizeDistribution/CellSizeDistribution';
import CalculationConfig from '../../../../components/data-processing/CellSizeDistribution/CalculationConfig';
import initialExperimentState from '../../../../redux/reducers/experimentSettings/initialState';

import { initialPlotConfigStates } from '../../../../redux/reducers/componentConfig/initialState';

jest.mock('localforage');
const mockStore = configureStore([thunk]);

const noData = {
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    cellSizeDistributionHistogram: {
      config: initialPlotConfigStates.cellSizeDistributionHistogram,
      plotData: [],
    },
    cellSizeDistributionKneePlot: {
      config: initialPlotConfigStates.cellSizeDistributionKneePlot,
      plotData: [],
    },
  },
};

const withData = {
  ...noData,
  componentConfig: {
    ...noData.componentConfig,
    cellSizeDistributionHistogram: {
      ...noData.componentConfig.cellSizeDistributionHistogram,
      plotData: [{
        u: 8890.246597269077,
      },
      {
        u: 7986.663750139649,
      },
      {
        u: 9301.510440766624,
      }],
    },
    cellSizeDistributionKneePlot: {
      ...noData.componentConfig.cellSizeDistributionKneePlot,
      plotData: [{
        u: 8890.246597269077,
      },
      {
        u: 7986.663750139649,
      },
      {
        u: 9301.510440766624,
      }],
    },
  },
};

const sampleId = 'WT';
const sampleIds = ['WT', 'WT1', 'KO'];
const experimentId = 'e1234';

describe('CellSizeDistribution', () => {
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
        <CellSizeDistribution
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
        />
      </Provider>,
    );

    const page = component.find(CellSizeDistribution).at(0);
    const calculationConfig = page.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = page.find(Vega);

    // No plots when there are no data
    expect(plots.length).toEqual(0);
  });

  it('Shows plot with data', () => {
    const store = mockStore(withData);

    const component = mount(
      <Provider store={store}>
        <CellSizeDistribution
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
        />
      </Provider>,
    );

    const page = component.find(CellSizeDistribution).at(0);
    const calculationConfig = page.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = page.find(Vega);

    // 1 main 2 miniature
    expect(plots.length).toEqual(3);
  });
});
