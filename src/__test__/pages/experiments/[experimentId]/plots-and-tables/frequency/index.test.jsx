import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import fake from '__test__/test-utils/constants';
import FrequencyIndex from 'pages/experiments/[experimentId]/plots-and-tables/frequency/index';
import { act } from 'react-dom/test-utils';
import _ from 'lodash';
import mockAPI, {
  statusResponse,
  promiseResponse,
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';
import cellSetsData from '__test__/data/cell_sets.json';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from 'redux/actionTypes/experimentSettings';
import { makeStore } from 'redux/store';
import { plotNames } from 'utils/constants';
import ExportAsCSV from 'components/plots/ExportAsCSV';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { MAX_LEGEND_ITEMS } from 'components/plots/helpers/PlotLegendAlert';

jest.mock('components/plots/ExportAsCSV', () => jest.fn(() => (<></>)));
jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

const frequencyIndexFactory = createTestComponentFactory(FrequencyIndex);

let storeState = null;
const plotUuid = 'frequencyPlotMain';

// simulating intial load of plot
const customAPIResponses = {
  [`/plots/${plotUuid}`]: () => statusResponse(404, 'Not Found'),
};
const mockApiResponses = _.merge(
  generateDefaultMockAPIResponses(fake.EXPERIMENT_ID), customAPIResponses,
);

describe('Frequency plots and tables index page', () => {
  beforeEach(async () => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(mockApiResponses));
    storeState = makeStore();

    // getting the experiment info which is otherwise done by the SSR
    await storeState.dispatch({
      type: EXPERIMENT_SETTINGS_INFO_UPDATE,
      payload: {
        experimentId: fake.EXPERIMENT_ID,
        experimentName: fake.EXPERIMENT_NAME,
      },
    });
  });

  const renderFrequencyIndex = async () => {
    await act(async () => render(
      <Provider store={storeState}>
        {frequencyIndexFactory({ experimentId: fake.EXPERIMENT_ID })}
      </Provider>,
    ));
  };

  it('Renders all control panels', async () => {
    await renderFrequencyIndex();
    expect(screen.getByText(new RegExp(plotNames.FREQUENCY_PLOT, 'i'))).toBeInTheDocument();

    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Plot type/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();

    // Vega should appear
    expect(screen.getByRole('graphics-document', { name: 'Frequency plot' })).toBeInTheDocument();

    // Csv data should be passed correctly
    expect(ExportAsCSV.mock.calls.slice(-1)[0]).toMatchSnapshot();
  });

  it('Renders a plot legend alert if there are more than MAX_LEGEND_ITEMS number of cell sets', async () => {
    const cellSetsTemplate = (clusterIdx) => ({
      key: `louvain-${clusterIdx}`,
      name: `Cluster ${clusterIdx}`,
      rootNode: false,
      type: 'cellSets',
      color: '#000000',
      cellIds: [clusterIdx],
    });

    const manyCellSets = [...Array(MAX_LEGEND_ITEMS + 1)].map((c, idx) => cellSetsTemplate(idx));

    // Add to louvain cluster
    cellSetsData.cellSets[0].children = manyCellSets;

    const manyCellSetsResponse = {
      ...generateDefaultMockAPIResponses(fake.EXPERIMENT_ID),
      ...customAPIResponses,
      [`experiments/${fake.EXPERIMENT_ID}/cellSets`]: () => promiseResponse(JSON.stringify(cellSetsData)),
    };

    fetchMock.mockIf(/.*/, mockAPI(manyCellSetsResponse));

    await renderFrequencyIndex();

    // Vega should appear
    await waitFor(() => {
      expect(screen.getByRole('graphics-document', { name: 'Frequency plot' })).toBeInTheDocument();
    });

    // The legend alert plot text should appear
    expect(screen.getByText(/We have hidden the plot legend, because it is too large and it interferes with the display of the plot/)).toBeInTheDocument();
  });
});
