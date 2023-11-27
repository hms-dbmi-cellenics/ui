import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import PlotLayout from 'components/data-processing/PlotLayout';
import '__test__/test-utils/setupTests';

// Mock data and store setup
const experimentId = 'exp1';
const sampleId = 'sample1';
const sampleIds = ['sample1', 'sample2'];
const filterName = 'testFilter';
const filterTableUuid = 'filterTableUuid1';
const plots = {
  plot1: {
    plotUuid: 'plotUuid1',
    plot: jest.fn(),
    plotType: 'type1',
  },
  plot2: {
    plotUuid: 'plotUuid2',
    plot: jest.fn(),
    plotType: 'type2',
  },
};
const mockStore = configureStore([thunk]);
const initialState = {
  componentConfig: {
    plotUuid1: { config: {}, plotData: {} },
    plotUuid2: { config: {}, plotData: {} },
    filterTableUuid1: { plotData: {} },
  },
  experimentSettings: {
    processing: {
      [filterName]: {
        [sampleId]: { filterSettings: {} },
      },
    },
  },
};

const renderComponent = (store) => render(
  <Provider store={store}>
    <PlotLayout
      experimentId={experimentId}
      plots={plots}
      filterName={filterName}
      filterTableUuid={filterTableUuid}
      sampleId={sampleId}
      sampleIds={sampleIds}
      onConfigChange={jest.fn()}
      stepDisabled={false}
      plotStylingControlsConfig={[]}
      renderCalculationConfig={() => <div />}
      stepHadErrors={false}
      allowedPlotActions={{}}
    />
  </Provider>,
);

describe('PlotLayout', () => {
  let store;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  it('renders without crashing', () => {
    renderComponent(store);
    expect(screen.getByText('Filtering Settings')).toBeInTheDocument();
  });

  it('changes selected plot on mini plot click', () => {
    renderComponent(store);
    const miniPlotButton = screen.getAllByRole('button')[0];
    userEvent.click(miniPlotButton);
    expect(plots.plot1.plot).toHaveBeenCalled();
  });
});
