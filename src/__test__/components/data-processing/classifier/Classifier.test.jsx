import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';

import { Table } from 'antd';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import Classifier from 'components/data-processing/Classifier/Classifier';
import CalculationConfig from 'components/data-processing/Classifier/CalculationConfig';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

import filterStatisticsMock from '../../../test-utils/plotData.mock';

import '__test__/test-utils/setupTests';

const mockStore = configureStore([thunk]);

const sampleId = 'sample-WT';
const sampleIds = ['sample-WT', 'sample-WT1', 'sample-KO'];
const filterName = 'classifier';
const experimentId = 'e1234';

const plotData1 = generateDataProcessingPlotUuid(sampleId, filterName, 0);
const filterStatistics = generateDataProcessingPlotUuid(sampleId, filterName, 2);

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

const noData = {
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    [plotData1]: {
      config: initialPlotConfigStates.classifierEmptyDropsPlot,
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
          classifierP: 0.994553522823595,
          size: 4.25168687816849,
        },
        {
          classifierP: 0.999997574990386,
          size: 4.24084865848536,
        },
        {
          classifierP: 0.995012565653238,
          size: 4.08589681113159,
        },
      ],
    },
    [filterStatistics]: filterStatisticsMock(),
  },
};

describe('Classifier', () => {
  it('renders correctly with no data', () => {
    const store = mockStore(noData);

    const component = mount(
      <Provider store={store}>
        <Classifier
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
        />
      </Provider>,
    );

    const page = component.find(Classifier).at(0);
    const calculationConfig = page.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = page.find(Vega);
    const tables = page.find(Table);

    // No plots when there are no data
    expect(plots.length).toEqual(0);
    expect(tables.length).toEqual(0);
  });

  it('Shows plot with data', () => {
    const store = mockStore(withData);

    const component = mount(
      <Provider store={store}>
        <Classifier
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
        />
      </Provider>,
    );

    const page = component.find(Classifier).at(0);
    const calculationConfig = page.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = page.find(Vega);
    const tables = page.find(Table);

    // 1 main
    expect(plots.length).toEqual(1);
    expect(tables.length).toEqual(1);
  });
});
