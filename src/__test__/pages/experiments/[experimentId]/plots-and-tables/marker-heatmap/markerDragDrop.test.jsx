import { mount } from 'enzyme';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';
import MarkerHeatmap from 'pages/experiments/[experimentId]/plots-and-tables/marker-heatmap/index';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { makeStore } from 'redux/store';
import fetchWork from 'utils/work/fetchWork';

import expressionDataFAKEGENE from '__test__/data/gene_expression_FAKEGENE.json';
import markerGenesData5 from '__test__/data/marker_genes_5.json';
import geneList from '__test__/data/paginated_gene_expression.json';

import preloadAll from 'jest-next-dynamic';

import fake from '__test__/test-utils/constants';
import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
  statusResponse,
} from '__test__/test-utils/mockAPI';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import waitForComponentToPaint from '__test__/test-utils/waitForComponentToPaint';
import { arrayMoveImmutable } from 'utils/arrayUtils';

jest.mock('components/header/UserButton', () => () => <></>);
jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

// Disable local cache
jest.mock('localforage', () => ({
  getItem: () => Promise.resolve(undefined),
  setItem: () => Promise.resolve(),
  config: () => { },
  ready: () => Promise.resolve(),
  length: () => 0,
}));

jest.mock('utils/work/fetchWork');

const mockWorkerResponses = {
  MarkerHeatmap: markerGenesData5,
  'FAKEGENE-expression': expressionDataFAKEGENE,
  ListGenes: geneList,
};

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'markerHeatmapPlotMain';
let storeState = null;

const customAPIResponses = {
  [`/plots/${plotUuid}$`]: (req) => {
    if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
    return statusResponse(404, 'Not Found');
  },
  [`/v2/workRequest/${experimentId}`]: () => statusResponse(200, 'OK'),
};

const defaultResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = { experimentId };

const heatmapPageFactory = createTestComponentFactory(MarkerHeatmap, defaultProps);

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

enableFetchMocks();

const renderHeatmapPageForEnzyme = (store) => (
  mount(
    <Provider store={store}>
      {heatmapPageFactory()}
    </Provider>,
  )
);

// drag and drop is impossible in RTL, use enzyme
describe('Drag and drop enzyme tests', () => {
  let component;
  let tree;

  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    fetchWork
      .mockReset()
      .mockImplementation((_experimentId, body) => mockWorkerResponses[body.name]);

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();

    // Set up state for backend status
    await storeState.dispatch(loadBackendStatus(experimentId));

    component = renderHeatmapPageForEnzyme(storeState);

    await waitForComponentToPaint(component);

    // antd renders 5 elements, use the first one
    tree = component.find({ 'data-testid': 'HierachicalTreeGenes' }).at(0);
  });

  it('changes nothing on drop in place', async () => {
    // default genes are in the tree
    markerGenesData5.orderedGeneNames.forEach((geneName) => {
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

    expect(_.isEqual(newOrder, markerGenesData5.orderedGeneNames)).toEqual(true);
  });

  it('re-orders genes correctly', async () => {
    // dropping to gap re-orders genes
    const info = {
      dragNode: { key: 1, pos: '0-1' },
      dropPosition: 4,
      node: { dragOver: false },
    };

    tree.getElement().props.onDrop(info);

    await act(async () => {
      component.update();
    });

    const newOrder = getCurrentGeneOrder(component);

    const expectedOrder = arrayMoveImmutable(markerGenesData5.orderedGeneNames, 1, 3);

    expect(_.isEqual(newOrder, expectedOrder)).toEqual(true);
  });
});
