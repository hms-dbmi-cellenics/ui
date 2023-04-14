import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';

import { Table } from 'antd';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import MitochondrialContent from 'components/data-processing/MitochondrialContent/MitochondrialContent';
import CalculationConfig from 'components/data-processing/MitochondrialContent/CalculationConfig';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

import filterStatisticsMock from '../../../test-utils/plotData.mock';

const mockStore = configureStore([thunk]);

const sampleId = 'sample-WT';
const sampleIds = ['sample-WT', 'sample-WT1', 'sample-KO'];
const experimentId = 'e1234';
const filterName = 'mitochondrialContent';

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

const plotData1 = generateDataProcessingPlotUuid(sampleId, filterName, 0);
const plotData2 = generateDataProcessingPlotUuid(sampleId, filterName, 1);
const filterStatistics = generateDataProcessingPlotUuid(sampleId, filterName, 2);

const noData = {
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    [plotData1]: {
      config: initialPlotConfigStates.mitochondrialFractionHistogram,
      plotData: [],
    },
    [plotData2]: {
      config: initialPlotConfigStates.mitochondrialFractionLogHistogram,
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
          fracMito: 0.0321412215329531,
          cellSize: 3.11126251365907,
        }, {
          fracMito: 0.0303533272283272,
          cellSize: 3.43184604569873,
        }, {
          fracMito: 0,
          cellSize:
            1.86923171973098,
        },
      ],
    },
    [plotData2]: {
      ...noData.componentConfig[plotData2],
      plotData: [
        {
          fracMito: 0.0321412215329531,
          cellSize: 3.11126251365907,
        },
        {
          fracMito: 0.0303533272283272,
          cellSize: 3.43184604569873,
        },
        {
          fracMito: 0,
          cellSize: 1.86923171973098,
        },
      ],
    },
    [filterStatistics]: filterStatisticsMock(),
  },
};

describe('MitochondrialContent', () => {
  it('renders correctly with no data', () => {
    const store = mockStore(noData);

    const component = mount(
      <Provider store={store}>
        <MitochondrialContent
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
        />
      </Provider>,
    );

    const page = component.find(MitochondrialContent).at(0);
    const calculationConfig = page.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = page.find(Vega);
    const tables = page.find(Table);

    // No plots or table when there are no data
    expect(plots.length).toEqual(0);
    expect(tables.length).toEqual(0);
  });

  it('Shows plot with data', () => {
    const store = mockStore(withData);

    const component = mount(
      <Provider store={store}>
        <MitochondrialContent
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
        />
      </Provider>,
    );

    const page = component.find(MitochondrialContent).at(0);
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
