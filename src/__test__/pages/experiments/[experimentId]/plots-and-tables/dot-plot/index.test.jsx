import React from 'react';
import _ from 'lodash';

import { act } from 'react-dom/test-utils';
import { render, screen, fireEvent } from '@testing-library/react';
import { mount } from 'enzyme';
import { waitFor, within } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
  delayedResponse,
} from '__test__/test-utils/mockAPI';

import { seekFromS3 } from 'utils/work/seekWorkResponse';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { makeStore } from 'redux/store';

import { loadBackendStatus } from 'redux/actions/backendStatus';
import DotPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/dot-plot/index';
import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from 'redux/actionTypes/experimentSettings';
import paginatedGeneExpressionData from '__test__/data/paginated_gene_expression.json';
import cellSetsDataWithScratchpad from '__test__/data/cell_sets_with_scratchpad.json';
import dotPlotData from '__test__/data/dotplot_plotdata.json';
import userEvent from '@testing-library/user-event';
import { plotNames } from 'utils/constants';
import ExportAsCSV from 'components/plots/ExportAsCSV';

import waitForComponentToPaint from '__test__/test-utils/waitForComponentToPaint';
import { arrayMoveImmutable } from 'utils/array-move';

jest.mock('components/plots/ExportAsCSV', () => jest.fn(() => (<></>)));
jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag').default;

  const mockWorkRequestETag = (ETagParams) => {
    if (ETagParams.body.name === 'ListGenes') return 'paginated-gene-expression';
    if (ETagParams.body.name === 'DotPlot') return 'dot-plot-data';
  };
  const mockGeneExpressionETag = (ETagParams) => `${ETagParams.missingGenesBody.genes.join('-')}-expression`;

  return mockWorkResultETag(objectHash, mockWorkRequestETag, mockGeneExpressionETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(),
}));

const mockWorkerResponses = {
  'paginated-gene-expression': () => paginatedGeneExpressionData,
  'dot-plot-data': () => dotPlotData,
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'dotPlotMain';

const customAPIResponses = {
  [`experiments/${experimentId}/cellSets`]: () => promiseResponse(
    JSON.stringify(cellSetsDataWithScratchpad),
  ),
  [`/plots/${plotUuid}`]: (req) => {
    if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
    return statusResponse(404, 'Not Found');
  },
};

const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = { experimentId };
const dotPlotPageFactory = createTestComponentFactory(DotPlotPage, defaultProps);

// Helper function to get genes held within the tree
const getTreeGenes = (container) => {
  const treeNodeList = container.querySelectorAll('span[class*=ant-tree-title]');
  return Array.from(treeNodeList).map((node) => node.textContent);
};

// Helper function to get current order of displayed genes in enzyme tests
const getCurrentGeneOrder = (component) => {
  const treeNodes = component.find('div.ant-tree-treenode');
  const newOrder = [];
  treeNodes.forEach((node) => {
    newOrder.push(node.text());
  });
  newOrder.splice(0, 1);
  return newOrder;
};

const renderDotPlot = async (store) => {
  await act(async () => {
    render(
      <Provider store={store}>
        {dotPlotPageFactory()}
      </Provider>,
    );
  });
};

const renderDotPlotForEnzyme = async (store) => (
  mount(
    <Provider store={store}>
      {dotPlotPageFactory()}
    </Provider>,
  )
);

enableFetchMocks();

let storeState = null;

describe('Dot plot page', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    seekFromS3
      .mockReset()
      // 1st call to list genes
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]())
      // 2nd call to paginated gene expression
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]());

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();

    await storeState.dispatch(loadBackendStatus(experimentId));

    storeState.dispatch({
      type: EXPERIMENT_SETTINGS_INFO_UPDATE,
      payload: {
        experimentId: fake.EXPERIMENT_ID,
        experimentName: fake.EXPERIMENT_NAME,
      },
    });
  });

  it('Renders the plot page correctly', async () => {
    await renderDotPlot(storeState);

    // There is the text Dot plot show in the breadcrumbs
    expect(screen.getByText(new RegExp(plotNames.DOT_PLOT, 'i'))).toBeInTheDocument();

    // It has the required dropdown options
    expect(screen.getByText(/Gene selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Size scale/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();

    // It shows the plot
    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();

    // csv data is passed correctly
    expect(ExportAsCSV.mock.calls).toMatchSnapshot();
  });

  it('Shows a skeleton if config is not loaded', async () => {
    const noConfigResponse = {
      ...mockAPIResponse,
      [`/plots/${plotUuid}`]: () => delayedResponse({ body: 'Not found', status: 404 }),
    };

    fetchMock.mockIf(/.*/, mockAPI(noConfigResponse));

    await renderDotPlot(storeState);

    expect(screen.getByRole('list')).toHaveClass('ant-skeleton-paragraph');
  });

  it('Shows an error if there are errors loading cell sets', async () => {
    const cellSetsErrorResponse = {
      ...mockAPIResponse,
      [`experiments/${experimentId}/cellSets`]: () => statusResponse(404, 'Nothing found'),
    };

    fetchMock.mockIf(/.*/, mockAPI(cellSetsErrorResponse));

    await renderDotPlot(storeState);

    expect(screen.getByText(/Error loading cell sets/i)).toBeInTheDocument();
  });

  it('Shows platform error if there are errors fetching the work', async () => {
    const errorResponse = {
      ...mockWorkerResponses,
      'dot-plot-data': () => { throw new Error('error'); },
    };

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => errorResponse[Etag]())
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => errorResponse[Etag]());

    await renderDotPlot(storeState);

    expect(screen.getByText(/Error loading plot data/i)).toBeInTheDocument();
    expect(screen.getByText(/Check the options that you have selected and try again/i)).toBeInTheDocument();
  });

  it('Shows an empty message if there is no data to show in the plot', async () => {
    const emptyResponse = {
      ...mockWorkerResponses,
      'dot-plot-data': () => [],
    };

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => emptyResponse[Etag]())
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => emptyResponse[Etag]());

    await renderDotPlot(storeState);

    expect(screen.getByText(/There is no data to show/i)).toBeInTheDocument();
    expect(screen.getByText(/Select another option from the 'Select data' menu/i)).toBeInTheDocument();
  });

  it('Should show a no data error if user is using marker gene and selected filter sets are not represented in more than 1 group in the base cell set', async () => {
    await renderDotPlot(storeState);

    seekFromS3
      .mockReset()
      // 1st call to list genes
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]())
      // 2nd call to load dot plot
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]())
      // 3rd call to load dot plot
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]());

    // Use marker genes
    await act(async () => {
      userEvent.click(screen.getByText(/Marker genes/i));
    });

    // Select data
    await act(async () => {
      userEvent.click(screen.getByText(/Select data/i));
    });

    // Select samples
    const selectBaseCells = screen.getByRole('combobox', { name: 'selectCellSets' });

    await act(async () => {
      fireEvent.change(selectBaseCells, { target: { value: 'Samples' } });
    });

    const baseOption = screen.getByText(/Samples/);

    await act(async () => {
      userEvent.click(baseOption, undefined, { skipPointerEventsCheck: true });
    });

    // Select the filter sets
    const selectFilterCells = screen.getByRole('combobox', { name: 'selectPoints' });

    await act(async () => {
      fireEvent.change(selectFilterCells, { target: { value: 'Samples' } });
    });

    const filterOption = screen.getByText(/Copied WT2/);

    await act(async () => {
      userEvent.click(filterOption, undefined, { skipPointerEventsCheck: true });
    });

    await waitFor(() => {
      expect(screen.getByText(/There is no data to show/i)).toBeInTheDocument();
      expect(screen.getByText(/The cell set that you have chosen to display is repesented by only one group/i)).toBeInTheDocument();
      expect(screen.getByText(/A comparison can not be run to determine the top marker genes/i)).toBeInTheDocument();
      expect(screen.getByText(/Select another option from the 'Select data' menu/i)).toBeInTheDocument();
    });
  });

  it('removing a gene keeps the order', async () => {
    await renderDotPlot(storeState);

    const geneTree = screen.getByRole('tree');

    // first three genes of the data should be loaded by default
    const loadedGenes = paginatedGeneExpressionData.rows.map((row) => (row.gene_names)).slice(0, 3);

    // The genes in Data 5 should be in the tree
    loadedGenes.forEach((geneName) => {
      expect(within(geneTree).getByText(geneName)).toBeInTheDocument();
    });

    // Remove a gene using the X button
    const genesListBeforeRemoval = getTreeGenes(geneTree);

    const geneToRemove = within(geneTree).getByText(genesListBeforeRemoval[1]);

    const geneRemoveButton = geneToRemove.nextSibling.firstChild;

    userEvent.click(geneRemoveButton);

    const genesListAfterRemoval = getTreeGenes(geneTree);

    // remove element from list manually to compare
    genesListBeforeRemoval.splice(1, 1);

    // The gene should be deleted from the list
    expect(_.isEqual(genesListAfterRemoval, genesListBeforeRemoval)).toEqual(true);
  });

  it('searches for genes and adds a valid gene', async () => {
    await renderDotPlot(storeState);

    const geneTree = screen.getByRole('tree');
    const initialOrder = getTreeGenes(geneTree);

    // check placeholder text is loaded
    expect(screen.getByText('Search for genes...')).toBeInTheDocument();

    const searchBox = screen.getByRole('combobox');

    // search for genes using lowercase
    userEvent.type(searchBox, 'ap');

    // antd creates multiple elements for options
    // find option element by title, clicking on element with role='option' does nothing
    const option = screen.getByTitle('Apoe');

    await act(async () => {
      // the element has pointer-events set to 'none', skip check
      // based on https://stackoverflow.com/questions/61080116
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    // check the search text is modified after selecting a valid option
    expect(searchBox.value).toBe('Apoe, ');

    const geneAddButton = screen.getByText('Add');

    userEvent.click(geneAddButton);

    // check the selected gene was added
    expect(within(geneTree).getByText('Apoe')).toBeInTheDocument();

    // check the genes were not re-ordered when adding
    initialOrder.push('Apoe');
    expect(_.isEqual(initialOrder, getTreeGenes(geneTree))).toEqual(true);
  });

  it('tries to select an already loaded gene and clears the input', async () => {
    await renderDotPlot(storeState);

    const searchBox = screen.getByRole('combobox');

    userEvent.type(searchBox, 'ly');

    const option = screen.getByTitle('Lyz2');

    // expecting option to be disabled throws error, click the option instead and check reaction
    await act(async () => {
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    // search box shouldn't clear when selecting an already loaded gene
    expect(searchBox.value).toBe('ly');

    // clear button is automatically generated by antd and cannot be easily accessed
    const clearButton = searchBox.closest('div[class*=ant-select-auto-complete]').lastChild;

    userEvent.click(clearButton);

    expect(searchBox.value).toBe('');
  });

  it('resets the data', async () => {
    await renderDotPlot(storeState);

    seekFromS3
      .mockReset()
      // 1st call to list genes
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]())
      // 2nd call to load dot plot
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]())
      // 3rd call to load dot plot
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]());

    // add a gene to prepare for reset
    const searchBox = screen.getByRole('combobox');

    userEvent.type(searchBox, 'ap');

    const option = screen.getByTitle('Apoe');

    await act(async () => {
      userEvent.click(option, undefined, { skipPointerEventsCheck: true });
    });

    const resetButton = screen.getByText('Reset Plot');

    await act(async () => {
      userEvent.click(resetButton);
    });

    // expect the gene only within the options of the search box, antd creates 2 elements
    expect(screen.getAllByText('Apoe').length).toBe(2);
  });
});

// drag and drop is impossible in RTL, use enzyme
describe('Drag and drop enzyme tests', () => {
  let component;
  let tree;
  let loadedGenes;

  beforeEach(async () => {
    jest.clearAllMocks();

    seekFromS3
      .mockReset()
      // 1st call to list genes
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]())
      // 2nd call to paginated gene expression
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]());

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();

    await storeState.dispatch(loadBackendStatus(experimentId));

    storeState.dispatch({
      type: EXPERIMENT_SETTINGS_INFO_UPDATE,
      payload: {
        experimentId: fake.EXPERIMENT_ID,
        experimentName: fake.EXPERIMENT_NAME,
      },
    });

    component = await renderDotPlotForEnzyme(storeState);

    await waitForComponentToPaint(component);

    component.update();

    // antd renders 5 elements, use the first one
    tree = component.find({ 'data-testid': 'HierachicalTreeGenes' }).at(0);
    loadedGenes = paginatedGeneExpressionData.rows.map((row) => (row.gene_names)).slice(0, 3).reverse();
  });

  it('changes nothing on drop in place', async () => {
    // default genes are in the tree
    loadedGenes.forEach((geneName) => {
      expect(tree.containsMatchingElement(geneName));
    });

    // dropping in place does nothing
    const info = {
      dragNode: { key: 1, pos: '0-1' },
      dropPosition: 1,
      node: { dragOver: false },
    };

    tree.getElement().props.onDrop(info);

    await act(async () => {
      component.update();
    });

    const newOrder = getCurrentGeneOrder(component);

    expect(_.isEqual(newOrder, loadedGenes)).toEqual(true);
  });

  it('re-orders genes correctly', async () => {
    // default genes are in the tree
    loadedGenes.forEach((geneName) => {
      expect(tree.containsMatchingElement(geneName));
    });
    // dropping to gap re-orders genes
    const info = {
      dragNode: { key: 0, pos: '0-0' },
      dropPosition: 2,
      node: { dragOver: false },
    };

    tree.getElement().props.onDrop(info);

    await act(async () => {
      component.update();
    });

    const newOrder = getCurrentGeneOrder(component);

    const expectedOrder = arrayMoveImmutable(loadedGenes, 0, 1);

    expect(_.isEqual(newOrder, expectedOrder)).toEqual(true);
  });
});
