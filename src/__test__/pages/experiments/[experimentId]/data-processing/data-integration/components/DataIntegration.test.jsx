import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';

import DataIntegration from '../../../../../../../pages/experiments/[experimentId]/data-processing/data-integration/components/DataIntegration';
import CalculationConfig from '../../../../../../../pages/experiments/[experimentId]/data-processing/data-integration/components/CalculationConfig';
import PlotStyling from '../../../../../../../pages/experiments/[experimentId]/data-processing/filter-cells/components/PlotStyling';
import ElbowPlot from '../../../../../../../pages/experiments/[experimentId]/data-processing/data-integration/components/plots/ElbowPlot';

const mockStore = configureStore([thunk]);

describe('DataIntegration', () => {
  configure({ adapter: new Adapter() });

  beforeEach(async () => {
    await preloadAll();

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

  it('renders correctly', () => {
    const store = mockStore({});

    const component = mount(
      <Provider store={store}>
        <DataIntegration
          experimentId='1234'
          width={50}
          height={50}
        />
      </Provider>,
    );

    const dataIntegration = component.find(DataIntegration).at(0);
    const calculationConfig = dataIntegration.find(CalculationConfig);

    // There is a config element
    expect(calculationConfig.length).toEqual(1);

    const plotStyling = dataIntegration.find(PlotStyling);

    // There is a styling element
    expect(plotStyling.length).toEqual(1);

    const elbowPlots = dataIntegration.find(ElbowPlot);

    // There are two elbow plots, the miniature version and the actually shown one
    expect(elbowPlots.length).toEqual(2);
  });
});
