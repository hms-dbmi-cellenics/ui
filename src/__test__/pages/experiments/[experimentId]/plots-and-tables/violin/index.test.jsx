import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import ViolinIndex from 'pages/experiments/[experimentId]/plots-and-tables/violin/index';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { makeStore } from 'redux/store';
import fetchWork from 'utils/work/fetchWork';

import markerGenes1 from '__test__/data/marker_genes_1.json';
import paginatedGeneExpressionData from '__test__/data/paginated_gene_expression.json';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
} from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

jest.mock('utils/work/fetchWork');

const mockWorkerResponses = {
  ListGenes: paginatedGeneExpressionData,
  GeneExpression: markerGenes1,
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'ViolinMain-0';
const multiViewUuid = 'multiView-violin';

const customAPIResponses = {
  [`/plots/${plotUuid}$`]: (req) => {
    if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
    return statusResponse(404, 'Not Found');
  },
};

const defaultResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = { experimentId };

const violinPageFactory = createTestComponentFactory(ViolinIndex, defaultProps);

const renderViolinPage = async (store) => {
  await act(async () => {
    render(
      <Provider store={store}>
        <div width={800} height={800}>
          {violinPageFactory()}
        </div>
      </Provider>,
    );
  });
};

enableFetchMocks();

let storeState = null;

describe('ViolinIndex', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchWork
      .mockReset()
      .mockImplementation((_experimentId, body) => mockWorkerResponses[body.name]);

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();

    // Set up state for backend status
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Loads controls and elements', async () => {
    await renderViolinPage(storeState);
    expect(screen.getByText(/Gene selection/i)).toBeInTheDocument();

    expect(screen.getByText(/View multiple plots/i)).toBeInTheDocument();
    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Data transformation/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Markers/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
  });

  it('Loads the plot', async () => {
    await renderViolinPage(storeState);

    expect(screen.getByRole('graphics-document', { name: 'Violin plot' })).toBeInTheDocument();
  });

  it('Changes to raw expression', async () => {
    await renderViolinPage(storeState);

    userEvent.click(screen.getByText(/Data transformation/i));

    userEvent.click(screen.getByText('Raw values'));

    expect(screen.getByRole('graphics-document', { name: 'Violin plot' })).toBeInTheDocument();
    expect(storeState.getState().componentConfig[plotUuid].config.normalised).toBe('raw');
  });

  it('Adds a new plot to multi view', async () => {
    await renderViolinPage(storeState);

    userEvent.click(screen.getByText(/View multiple plots/i));

    const searchBox = screen.getByRole('combobox', { name: 'SearchBar' });

    userEvent.type(searchBox, 'cc');

    const option = screen.getByTitle('Ccl5');

    await act(async () => {
      // the element has pointer-events set to 'none', skip check
      // based on https://stackoverflow.com/questions/61080116
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    userEvent.click(screen.getByText('Add'));

    await waitFor(() => expect(screen.getAllByRole('graphics-document', { name: 'Violin plot' }).length).toBe(2));

    // check the multi view was expanded
    const multiViewConfig = storeState.getState().componentConfig[multiViewUuid].config;
    expect(_.isEqual([multiViewConfig.nrows, multiViewConfig.ncols], [2, 2])).toBe(true);

    // New plot's config is correct
    expect(storeState.getState().componentConfig['ViolinMain-1']).toMatchSnapshot('new-config');
  });

  it('Adds new plot using same config as previous plot', async () => {
    await renderViolinPage(storeState);

    // Change to raw expression
    userEvent.click(screen.getByText(/Data transformation/i));
    userEvent.click(screen.getByText('Raw values'));

    userEvent.click(screen.getByText(/View multiple plots/i));

    const searchBox = screen.getByRole('combobox', { name: 'SearchBar' });

    userEvent.type(searchBox, 'cc');

    const option = screen.getByTitle('Ccl5');

    await act(async () => {
      // the element has pointer-events set to 'none', skip check
      // based on https://stackoverflow.com/questions/61080116
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    userEvent.click(screen.getByText('Add'));

    await waitFor(() => expect(screen.getAllByRole('graphics-document', { name: 'Violin plot' }).length).toBe(2));

    // New plot's config contains normalised set to raw too
    expect(storeState.getState().componentConfig['ViolinMain-0'].config.normalised).toEqual('raw');
  });
  it('Changes the shown gene', async () => {
    await renderViolinPage(storeState);

    userEvent.click(screen.getByText(/Gene selection/i));

    const searchBox = screen.getAllByRole('combobox', { name: 'SearchBar' })[0];

    userEvent.clear(searchBox);
    userEvent.type(searchBox, 'cc');

    const option = screen.getByTitle('Ccl5');

    await act(async () => {
      // the element has pointer-events set to 'none', skip check
      // based on https://stackoverflow.com/questions/61080116
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    userEvent.click(screen.getByText('Search'));

    expect(searchBox.textContent).toBe('');

    await waitFor(() => expect(screen.getByRole('graphics-document', { name: 'Violin plot' })).toBeInTheDocument());

    expect(storeState.getState().componentConfig[plotUuid].config.shownGene).toBe('Ccl5');
  });
});
