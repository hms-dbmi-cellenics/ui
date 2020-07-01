import React from 'react';
import { configure, mount } from 'enzyme';
import { Provider } from 'react-redux';
import Adapter from 'enzyme-adapter-react-16';
import thunk from 'redux-thunk';
import configureMockStore from 'redux-mock-store';
import HeatmapPlot from '../../../../../pages/data-exploration/components/heatmap/HeatmapPlot';
import VegaHeatmap from '../../../../../pages/data-exploration/components/heatmap/VegaHeatmap';

jest.mock('localforage');
jest.mock('../../../../../pages/data-exploration/components/heatmap/VegaHeatmap');
VegaHeatmap.mockImplementation(() => <div>Mocked Vega Heatmap</div>);

const mockStore = configureMockStore([thunk]);
configure({ adapter: new Adapter() });
let component;

describe('HeatmapPlot', () => {
  afterEach(() => {
    component.unmount();
  });
  it('renders Empty component when no selected gene', () => {
    const store = mockStore({
      selectedGenes: {},
    });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot />
      </Provider>,
    );
    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(component.find('Empty').length).toEqual(2);
  });
  it('renders Spinner when loading genes', () => {
    const store = mockStore({
      selectedGenes: {
        geneList: {
          G1: true,
        },
      },
      geneExpressionData: { isLoading: true },
    });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot />
      </Provider>,
    );
    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(component.find('Spin').length).toEqual(1);
  });
  it('renders Spinner when heatmap rerenders', () => {
    const store = mockStore({
      selectedGenes: {
        geneList: {
          G1: true,
        },
      },
      geneExpressionData: { isLoading: false },
      heatmapSpec: { rendering: true },
    });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot />
      </Provider>,
    );
    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(component.find('Spin').length).toEqual(1);
  });
  it('renders Vega heatmap when genes loaded', () => {
    const store = mockStore({
      selectedGenes: {
        geneList: {
          G1: true,
        },
      },
      geneExpressionData: { isLoading: false },
      heatmapSpec: { rendering: false },
    });

    component = mount(
      <Provider store={store}>
        <HeatmapPlot />
      </Provider>,
    );
    expect(component.find('HeatmapPlot').length).toEqual(1);
    expect(component.find('VegaHeatmap').length).toEqual(1);
  });
});
