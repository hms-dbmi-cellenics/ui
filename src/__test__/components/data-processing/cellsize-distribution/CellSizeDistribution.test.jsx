import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';
import { Table } from 'antd';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import generateDataProcessingPlotUuid from 'utils/generateDataProcessingPlotUuid';
import CellSizeDistribution from 'components/data-processing/CellSizeDistribution/CellSizeDistribution';
import CalculationConfig from 'components/data-processing/CellSizeDistribution/CalculationConfig';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

import filterStatisticsMock from '../../../test-utils/plotData.mock';
import '__test__/test-utils/setupTests';

const mockStore = configureStore([thunk]);

const sampleId = 'sample-KO';
const sampleIds = ['sample-WT', 'sample-WT1', 'sample-KO'];
const experimentId = 'e1234';
const filterName = 'cellSizeDistribution';

const plotData1 = generateDataProcessingPlotUuid(sampleId, filterName, 0);
const plotData2 = generateDataProcessingPlotUuid(sampleId, filterName, 1);
const filterStatistics = generateDataProcessingPlotUuid(sampleId, filterName, 3);

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

const noData = {
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    [plotData1]: {
      config: initialPlotConfigStates.cellSizeDistributionHistogram,
      plotData: [],
    },
    [plotData2]: {
      config: initialPlotConfigStates.cellSizeDistributionKneePlot,
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
      plotData: [{
        u: 8890.246597269077,
        status: 'low',
      },
      {
        u: 7986.663750139649,
        status: 'low',
      },
      {
        u: 9301.510440766624,
        status: 'low',
      }],
    },
    [plotData2]: {
      ...noData.componentConfig[plotData2],
      plotData: [{
        u: 864,
        rank: 1365,
        status: 'low',
        logUValue: 6460.3302,
      },
      {
        u: 4472,
        rank: 1110,
        status: 'low',
        logUValue: 8031.1039,
      },
      {
        u: 3065,
        rank: 584,
        status: 'low',
        logUValue: 7670.1470,
      }],
    },
    [filterStatistics]: filterStatisticsMock(),
  },
};

describe('CellSizeDistribution', () => {
  it('renders correctly with no data', () => {
    const store = mockStore(noData);

    const component = mount(
      <Provider store={store}>
        <CellSizeDistribution
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
          onConfigChange={() => { }}
        />
      </Provider>,
    );

    const page = component.find(CellSizeDistribution).at(0);
    const calculationConfig = page.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = page.find(Vega);
    const tables = page.find(Table);

    // No plots when there are no data
    expect(plots.length).toEqual(0);
    expect(tables.length).toEqual(0);
  });

  it('Shows plot with data', async () => {
    const store = mockStore(withData);

    const component = mount(
      <Provider store={store}>
        <CellSizeDistribution
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
          onConfigChange={() => { }}
        />
      </Provider>,
    );

    const page = component.find(CellSizeDistribution).at(0);
    const calculationConfig = page.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = page.find(Vega);
    const tables = page.find(Table);

    // 1 main 2 miniature
    expect(plots.length).toEqual(3);
    expect(tables.length).toEqual(1);
  });
});
