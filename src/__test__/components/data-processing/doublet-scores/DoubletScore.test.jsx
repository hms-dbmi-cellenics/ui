import React from 'react';
import { mount, configure } from 'enzyme';
import preloadAll from 'jest-next-dynamic';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';

import DoubletScores from '../../../../components/data-processing/DoubletScores/DoubletScores';
import CalculationConfig from '../../../../components/data-processing/DoubletScores/CalculationConfig';
import initialExperimentState from '../../../../redux/reducers/experimentSettings/initialState';

import { initialPlotConfigStates } from '../../../../redux/reducers/componentConfig/initialState';

jest.mock('localforage');
const mockStore = configureStore([thunk]);

const noData = {
  experimentSettings: {
    ...initialExperimentState,
  },
  componentConfig: {
    doubletScoreHistogram: {
      config: initialPlotConfigStates.doubletScoreHistogram,
      plotData: [],
    },
  },
};

const withData = {
  ...noData,
  componentConfig: {
    ...noData.componentConfig,
    doubletScoreHistogram: {
      ...noData.componentConfig.doubletScoreHistogram,
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
  },
};

const sampleId = 'WT';
const sampleIds = ['WT', 'WT1', 'KO'];
const experimentId = 'e1234';

describe('DoubletScores', () => {
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

    // No plots when there are no data
    expect(plots.length).toEqual(0);
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

    // 1 main 2 miniatures
    expect(plots.length).toEqual(1);
  });
});
