import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';
import { Table } from 'antd';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import DoubletScores from 'components/data-processing/DoubletScores/DoubletScores';
import CalculationConfig from 'components/data-processing/DoubletScores/CalculationConfig';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

import filterStatisticsMock from '../../../test-utils/plotData.mock';

const mockStore = configureStore([thunk]);

const sampleId = 'sample-WT';
const sampleIds = ['sample-WT', 'sample-WT1', 'sample-KO'];
const filterName = 'doubletScores';
const experimentId = 'e1234';

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

const plotData1 = generateDataProcessingPlotUuid(sampleId, filterName, 0);
const filterStatistics = generateDataProcessingPlotUuid(sampleId, filterName, 1);

const noData = {
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    [plotData1]: {
      config: initialPlotConfigStates.doubletScoreHistogram,
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
          doubletP: 0.174785100286533,
          size: 3.38363586836188,
        },
        {
          doubletP: 0.163934426229508,
          size: 3.69010743945633,
        },
        {
          doubletP: 0.0932835820895522,
          size: 3.49762064978129,
        },
      ],
    },
    [filterStatistics]: filterStatisticsMock(),
  },
};

describe('DoubletScores', () => {
  it('renders correctly with no data', () => {
    const store = mockStore(noData);

    const component = mount(
      <Provider store={store}>
        <DoubletScores
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
        />
      </Provider>,
    );

    const page = component.find(DoubletScores).at(0);
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
        <DoubletScores
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
        />
      </Provider>,
    );

    const page = component.find(DoubletScores).at(0);
    const calculationConfig = page.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plots = page.find(Vega);
    const tables = page.find(Table);

    // 1 main 2 miniatures
    expect(plots.length).toEqual(1);

    // 1 table
    expect(tables.length).toEqual(1);
  });
});
