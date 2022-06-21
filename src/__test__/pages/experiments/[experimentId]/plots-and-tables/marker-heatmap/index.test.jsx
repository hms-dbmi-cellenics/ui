import { render, screen } from '@testing-library/react';
import { mount } from 'enzyme';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import MarkerHeatmap from 'pages/experiments/[experimentId]/plots-and-tables/marker-heatmap/index';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadGeneExpression } from 'redux/actions/genes';
import { makeStore } from 'redux/store';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import expressionDataFAKEGENE from '__test__/data/gene_expression_FAKEGENE.json';
import markerGenesData2 from '__test__/data/marker_genes_2.json';
import markerGenesData5 from '__test__/data/marker_genes_5.json';

import { Tree } from 'antd';

import preloadAll from 'jest-next-dynamic';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
} from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import waitForComponentToPaint from '__test__/test-utils/waitForComponentToPaint';
import { arrayMoveImmutable } from 'utils/array-move';

jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

// Mock hash so we can control the ETag that is produced by hash.MD5 when fetching work requests
// EtagParams is the object that's passed to the function which generates ETag in fetchWork
jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag').default;

  const mockWorkRequestETag = (ETagParams) => `${ETagParams.body.nGenes}-marker-genes`;
  const mockGeneExpressionETag = (ETagParams) => `${ETagParams.missingGenesBody.genes.join('-')}-expression`;

  return mockWorkResultETag(objectHash, mockWorkRequestETag, mockGeneExpressionETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(),
}));

const mockWorkerResponses = {
  '5-marker-genes': markerGenesData5,
  '2-marker-genes': markerGenesData2,
  'FAKEGENE-expression': expressionDataFAKEGENE,
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'markerHeatmapPlotMain';
let storeState = null;

const customAPIResponses = {
  [`/plots/${plotUuid}`]: (req) => {
    if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
    return statusResponse(404, 'Not Found');
  },
};

const defaultResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = { experimentId };

const heatmapPageFactory = createTestComponentFactory(MarkerHeatmap, defaultProps);

// Helper function to get displayed genes from the gene input
const getDisplayedGenes = (container) => {
  const genesNodeList = container.querySelectorAll('span[class*=selection-item-content]');
  return Array.from(genesNodeList).map((gene) => gene.textContent);
};

// Helper functions to get genes held within the tree
const getTreeGenes = (container) => {
  const treeNodeList = container.querySelectorAll('span[class*=ant-tree-title]');
  return Array.from(treeNodeList).map((node) => node.firstChild.firstChild.textContent);
};

const renderHeatmapPage = async (store) => {
  await act(async () => (
    render(
      <Provider store={store}>
        {heatmapPageFactory()}
      </Provider>,
    )
  ));
};

const renderHeatmapPageForEnzyme = async (store) => (
  mount(
    <Provider store={store}>
      {heatmapPageFactory()}
    </Provider>,
  )
);

describe('Marker heatmap plot', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]);

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();

    // Set up state for backend status
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Loads controls and elements', async () => {
    await renderHeatmapPage(storeState);

    expect(screen.getByText(/Gene selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Select data/i)).toBeInTheDocument();
    expect(screen.getByText(/Cluster guardlines/i)).toBeInTheDocument();
    expect(screen.getByText(/Metadata tracks/i)).toBeInTheDocument();
    expect(screen.getByText(/Group by/i)).toBeInTheDocument();
    expect(screen.getByText(/Expression values/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
  });

  it('Loads the plot', async () => {
    await renderHeatmapPage(storeState);

    expect(screen.getByRole('graphics-document', { name: 'Marker heatmap' })).toBeInTheDocument();
  });

  it('Shows an error message if marker genes failed to load', async () => {
    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => { throw new Error('Not found'); });

    await renderHeatmapPage(storeState);

    // It shouldn't show the plot
    expect(screen.queryByRole('graphics-document', { name: 'Marker heatmap' })).toBeNull();

    // There is an error message
    expect(screen.getByText(/Could not load marker genes/i)).toBeInTheDocument();
  });

  it('loads marker genes on specifying new nunmber of genes per cluster', async () => {
    await renderHeatmapPage(storeState);

    // Check that initially there are 5 marker genes - the default
    markerGenesData5.order.forEach((geneName) => {
      expect(screen.getByText(geneName)).toBeInTheDocument();
    });

    await act(async () => {
      userEvent.click(screen.getByText('Marker genes'));
    });

    expect(screen.getByText('Number of marker genes per cluster')).toBeInTheDocument();

    const nGenesInput = screen.getByRole('spinbutton', { name: 'Number of genes input' });

    userEvent.type(nGenesInput, '{backspace}2');

    await act(async () => {
      userEvent.click(screen.getByText('Run'));
    });

    // Go back to "Custom Genes" and check the number of genes
    await act(async () => {
      userEvent.click(screen.getByText('Custom genes'));
    });

    // The genes in Data 2 should exist
    markerGenesData2.order.forEach((geneName) => {
      expect(screen.getByText(geneName)).toBeInTheDocument();
    });
  });

  it('adds genes correctly into the plot', async () => {
    seekFromS3
      .mockReset()
      // 1st load
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((ETag) => mockWorkerResponses[ETag])
      // 2nd load
      .mockImplementationOnce(() => null)
      .mockImplementation((ETag) => mockWorkerResponses[ETag]);

    await renderHeatmapPage(storeState);

    // Add in a new gene
    // This is done because we can not insert text into the genes list input
    const genesToLoad = [...markerGenesData5.order, 'FAKEGENE'];

    await act(async () => {
      await storeState.dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    });

    expect(screen.getByText('FAKEGENE')).toBeInTheDocument();

    // The returned value is a HTML NodeList
    const genesContainer = screen.getByText('FAKEGENE').closest('div[class*=selector]');

    const displayedGenesList = getDisplayedGenes(genesContainer);

    // Check that the genes is ordered correctly.
    // This means that FAKEGENE should not be the last in the genes list
    expect(_.isEqual(displayedGenesList, genesToLoad)).toEqual(false);
  });

  it('Shows an error message if gene expression fails to load', async () => {
    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce(() => { throw new Error('Not found'); });

    await renderHeatmapPage(storeState);

    const genesToLoad = [...markerGenesData5.order, 'FAKEGENE'];

    await act(async () => {
      await storeState.dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    });

    // It shouldn't show the plot
    expect(screen.queryByRole('graphics-document', { name: 'Marker heatmap' })).toBeNull();

    // There is an error message
    expect(screen.getByText(/Could not load gene expression data/i)).toBeInTheDocument();
  });

  it('removing a gene keeps the sorted order without re-sorting', async () => {
    seekFromS3
      .mockReset()
      // 1st load
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((ETag) => mockWorkerResponses[ETag])
      // 2nd load
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((ETag) => mockWorkerResponses[ETag]);

    await renderHeatmapPage(storeState);

    // Setting up so that there is an inserted gene in the list
    const genesToLoad = [...markerGenesData5.order, 'FAKEGENE'];

    await act(async () => {
      // This is done because we can not insert text into the genes list input
      await storeState.dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    });

    expect(screen.getByText('FAKEGENE')).toBeInTheDocument();

    // The returned value is a HTML NodeList
    const genesContainer = screen.getByText('FAKEGENE').closest('div[class*=selector]');
    const genesListBeforeRemoval = getDisplayedGenes(genesContainer);

    // Removing the 5th gene from the list
    // genesListBeforeRemoval is modified - splice removes the item from the list
    const geneToRemove = genesListBeforeRemoval.splice(5, 1);
    const geneRemoveButton = screen.getByText(geneToRemove).nextSibling;

    userEvent.click(geneRemoveButton);

    // Get newly displayed genes after the removal
    const genesListAfterRemoval = getDisplayedGenes(genesContainer);

    // The list of displayed genes should be in the same order as the displayed genes
    expect(_.isEqual(genesListAfterRemoval, genesListBeforeRemoval)).toEqual(true);
  });

  it('loads the tabs under gene selection', async () => {
    await renderHeatmapPage(storeState);

    expect(screen.getByText(/Add\/Remove genes/i)).toBeInTheDocument();
    expect(screen.getByText(/Re-order genes/i)).toBeInTheDocument();
  });

  it('switches tabs and removes genes within the tree', async () => {
    await renderHeatmapPage(storeState);

    await act(async () => {
      userEvent.click(screen.getByText('Re-order genes'));
    });
    // note: clicking another tab doesn't remove previous tab from screen
    // screen.getByText will find multiples of the same gene -> use within(geneTree)

    const geneTree = screen.getByRole('tree');

    // The genes in Data 5 should be in the tree
    markerGenesData5.order.forEach((geneName) => {
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

  it.only('Re-orders genes within the tree', async () => {
    const component = await renderHeatmapPageForEnzyme(storeState);

    await waitForComponentToPaint(component);

    await act(async () => {
      // needs to find specifically the tab button to click
      const reorderTab = component.find('div.ant-tabs-tab-btn');

      reorderTab.at(1).simulate('click');
    });

    component.update();

    // this finds the tree and tree nodes
    const tree = component.find('div.ant-tree');
    const treeNodes = component.find('div.ant-tree-treenode');

    console.log(tree.props());

    // The default data should be in the tree
    // markerGenesData5.order.forEach((geneName) => {
    //   expect(tree.containsMatchingElement(geneName)).toEqual(true);
    // });

    // const expectedOrder = arrayMoveImmutable(markerGenesData5.order, 1, 4);
    

    // const newOrder = [];
    // treeNodes.forEach((node) => {
    //   newOrder.push(node.text());
    // });

    // expect(_.isEqual(newOrder, expectedOrder).toEqual(true));

    // component.update();
  });
});
