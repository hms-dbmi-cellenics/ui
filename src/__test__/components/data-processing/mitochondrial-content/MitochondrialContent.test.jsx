import React from 'react';
import { mount, configure } from 'enzyme';
import preloadAll from 'jest-next-dynamic';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';

import MitochondrialContent from '../../../../components/data-processing/MitochondrialContent/MitochondrialContent';
import CalculationConfig from '../../../../components/data-processing/MitochondrialContent/CalculationConfig';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

import { initialPlotConfigStates } from '../../../../redux/reducers/componentConfig/initialState';
import generateDataProcessingPlotUuid from '../../../../utils/generateDataProcessingPlotUuid';

jest.mock('localforage');
const mockStore = configureStore([thunk]);

const sampleId = 'sample-WT';
const sampleIds = ['sample-WT', 'sample-WT1', 'sample-KO'];
const experimentId = 'e1234';
const filterName = 'mitochondrialContent';

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

const sample1 = generateDataProcessingPlotUuid(sampleId, filterName, 0);
const sample2 = generateDataProcessingPlotUuid(sampleId, filterName, 1);

const noData = {
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    [sample1]: {
      config: initialPlotConfigStates.mitochondrialFractionHistogram,
      plotData: [],
    },
    [sample2]: {
      config: initialPlotConfigStates.mitochondrialFractionLogHistogram,
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
    [sample2]: {
      ...noData.componentConfig[sample2],
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
  },
};

describe('MitochondrialContent', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  configure({ adapter: new Adapter() });

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

    // No plots when there are no data
    expect(plots.length).toEqual(0);
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

    // 1 main 2 miniature
    expect(plots.length).toEqual(3);
  });
});
