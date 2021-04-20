import React from 'react';
import * as rtl from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import _ from 'lodash';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import {
  initialComponentConfigStates,
  initialPlotConfigStates,
} from '../../../redux/reducers/componentConfig/initialState';
import initialExperimentState from '../../../redux/reducers/experimentSettings/initialState';
import rootReducer from '../../../redux/reducers/index';
import genes from '../../../redux/reducers/genes/initialState';
import * as loadConfig from '../../../redux/reducers/componentConfig/loadConfig';
import { updatePlotConfig } from '../../../redux/actions/componentConfig/index';
import ViolinPlot from '../../../components/plots/ViolinPlot';
import ViolinIndex from '../../../pages/experiments/[experimentId]/plots-and-tables/violin/index';
import * as generateViolinSpec from '../../../utils/plotSpecs/generateViolinSpec';
import { fetchCachedWork } from '../../../utils/cacheRequest';
// eslint-disable-next-line prefer-destructuring
const generateData = generateViolinSpec.generateData;

jest.mock('localforage');
const mockStore = configureMockStore([thunk]);
enableFetchMocks();
jest.mock('../../../components/plots/Header', () => () => <div />);
jest.mock('../../../utils/cacheRequest', () => ({
  fetchCachedWork: jest.fn().mockImplementation((expId, timedOut, body) => {
    if (body.name === 'ListGenes') {
      return new Promise((resolve) => resolve({
        rows: [{ gene_names: 'MockGeneWithHighestDispersion', dispersions: 54.0228 }],
      }));
    }
    if (body.name === 'GeneExpression') {
      return new Promise((resolve) => {
        const requestedExpression = {};
        body.genes.forEach((geneName) => {
          requestedExpression[geneName] = {
            min: 0,
            max: 1.6,
            expression: [0, 0.4, 0.5, 1.6, 0, 1],
            zScore: [1, 1.4, 1.5, 2.6, 2, 2],
          };
        });
        resolve(requestedExpression);
      });
    }
  }),
}));

const cellSets = {
  hierarchy: [
    {
      key: 'louvain',
      children: [{ key: 'cluster-a' }, { key: 'cluster-b' }, { key: 'cluster-c' }],
      cellIds: new Set(),
    },
    {
      key: 'sample',
      children: [{ key: 'sample-1' }, { key: 'sample-2' }],
      cellIds: new Set(),
    },
    {
      key: 'scratchpad',
      children: [{ key: 'scratchpad-a' }],
      cellIds: new Set(),
    },
  ],
  properties: {
    'cluster-a': {
      name: 'cluster a',
      key: 'cluster-a',
      cellIds: new Set([0, 1]),
      color: '#01FFFF',
    },
    'cluster-b': {
      name: 'cluster b',
      key: 'cluster-b',
      cellIds: new Set([2, 3]),
      color: '#23FFFF',
    },
    'cluster-c': {
      name: 'cluster c',
      key: 'cluster-c',
      cellIds: new Set([4, 5]),
      color: '#45FFFF',
    },
    'sample-1': {
      name: 'Sample 1',
      key: 'sample-1',
      cellIds: new Set([0, 1, 2]),
      color: '#012FFF',
    },
    'sample-2': {
      name: 'Sample 2',
      key: 'sample-2',
      cellIds: new Set([3, 4, 5]),
      color: '#345FFF',
    },
    'scratchpad-a': {
      cellIds: new Set(['5']),
      key: 'scratchpad-a',
      name: 'New Cluster',
      color: '#5FFFFF',
    },
    louvain: {
      cellIds: new Set(),
      name: 'Louvain clusters',
      key: 'louvain',
      type: 'cellSets',
      rootNode: true,
    },
    sample: {
      cellIds: new Set(),
      name: 'Samples',
      key: 'sample',
      type: 'cellSets',
      rootNode: true,
    },
    scratchpad: {
      cellIds: new Set(),
      name: 'Scratchpad',
      key: 'scratchpad',
      type: 'cellSets',
      rootNode: true,
    },
  },
};

const defaultStore = {
  cellSets,
  componentConfig: initialComponentConfigStates,
  embeddings: {},
  experimentSettings: {
    ...initialExperimentState,
  },
  genes,
};

const experimentId = 'mockExperimentId';
const plotUuid = 'ViolinMain'; // At some point this will stop being hardcoded

describe('generateData', () => {
  const MOCK_RANDOM = 0.1;
  const mockGeneExpression = [...Array(6).keys()];
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(MOCK_RANDOM);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('generates data when grouping by lovain clusters', () => {
    const groupingId = 'louvain';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'All');

    expect(_.keys(plotData.groups).sort()).toEqual(['cluster-a', 'cluster-b', 'cluster-c']);
    expect(plotData.groups['cluster-a']).toEqual({ name: 'cluster a', color: '#01FFFF' });

    const expectedCells = [
      { group: 'cluster-a', y: 0, x: MOCK_RANDOM },
      { group: 'cluster-a', y: 1, x: MOCK_RANDOM },
      { group: 'cluster-b', y: 2, x: MOCK_RANDOM },
      { group: 'cluster-b', y: 3, x: MOCK_RANDOM },
      { group: 'cluster-c', y: 4, x: MOCK_RANDOM },
      { group: 'cluster-c', y: 5, x: MOCK_RANDOM },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates data when grouping by sample', () => {
    const groupingId = 'sample';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'All');

    expect(_.keys(plotData.groups).sort()).toEqual(['sample-1', 'sample-2']);
    expect(plotData.groups['sample-1']).toEqual({ name: 'Sample 1', color: '#012FFF' });

    const expectedCells = [
      { group: 'sample-1', y: 0, x: MOCK_RANDOM },
      { group: 'sample-1', y: 1, x: MOCK_RANDOM },
      { group: 'sample-1', y: 2, x: MOCK_RANDOM },
      { group: 'sample-2', y: 3, x: MOCK_RANDOM },
      { group: 'sample-2', y: 4, x: MOCK_RANDOM },
      { group: 'sample-2', y: 5, x: MOCK_RANDOM },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates data when grouping by scratchpad', () => {
    const groupingId = 'scratchpad';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'All');

    expect(_.keys(plotData.groups).sort()).toEqual(['scratchpad-a']);
    expect(plotData.groups['scratchpad-a']).toEqual({ name: 'New Cluster', color: '#5FFFFF' });

    const expectedCells = [
      { group: 'scratchpad-a', y: 5, x: MOCK_RANDOM },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates the x value for only the cells in the specified group', () => {
    const groupingId = 'louvain';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, 'sample/sample-1');
    const expectedCells = [
      { group: 'cluster-a', y: 0, x: MOCK_RANDOM },
      { group: 'cluster-a', y: 1, x: MOCK_RANDOM },
      { group: 'cluster-b', y: 2, x: MOCK_RANDOM },
      { group: 'cluster-b', y: 3 },
      { group: 'cluster-c', y: 4 },
      { group: 'cluster-c', y: 5 },
    ];
    expect(plotData.cells).toEqual(expectedCells);
  });

  it('generates the no x value when null is specified', () => {
    const groupingId = 'louvain';
    const plotData = generateData(cellSets, mockGeneExpression, groupingId, null);
    expect(plotData.cells.filter((cell) => cell.x).length).toEqual(0);
  });
});

describe('ViolinPlot', () => {
  let store = null;

  beforeAll(async () => {
    await preloadAll();
  });
  beforeEach(() => {
    jest.clearAllMocks(); // Do not mistake with resetAllMocks()!
  });

  const renderViolinPlot = (initialMockStore, config = initialPlotConfigStates.violin) => {
    store = mockStore(_.cloneDeep(initialMockStore));
    rtl.render(
      <Provider store={store}>
        <ViolinPlot
          experimentId={experimentId}
          plotUuid={plotUuid}
          config={config}
        />
      </Provider>,
    );
  };
  const actionCount = (action) => store.getActions().filter(
    (item) => (item.type === action),
  ).length;

  it('displays an error panel with Try Again if cellSets has an error', () => {
    const actionOnTryAgain = 'cellSets/loading';
    const storeContents = {
      ..._.cloneDeep(defaultStore),
      cellSets: {
        error: 'Broken CellSet',
      },
    };
    renderViolinPlot(storeContents);
    const loadingActions = actionCount(actionOnTryAgain);
    userEvent.click(rtl.screen.getByRole('button'));
    expect(actionCount(actionOnTryAgain)).toBe(loadingActions + 1);
  });
  it('displays an error panel with Try Again if error getting gene disperssion', () => {
    const actionOnTryAgain = 'genes/propertiesLoading';
    const storeContents = {
      ..._.cloneDeep(defaultStore),
    };
    storeContents.genes.properties.views[plotUuid] = {
      error: 'Broken dispersion',
    };
    renderViolinPlot(storeContents);
    const loadingActions = actionCount(actionOnTryAgain);
    userEvent.click(rtl.screen.getByRole('button'));
    expect(actionCount(actionOnTryAgain)).toBe(loadingActions + 1);
  });
  it('displays an error panel with Try Again if error getting gene expression', () => {
    const actionOnTryAgain = 'genes/expressionLoading';
    const storeContents = {
      ..._.cloneDeep(defaultStore),
    };
    storeContents.genes.expression.error = 'Broken expression';

    renderViolinPlot(storeContents);
    const loadingActions = actionCount(actionOnTryAgain);
    userEvent.click(rtl.screen.getByRole('button'));
    // console.log(store.getActions());
    // rtl.screen.debug();
    expect(actionCount(actionOnTryAgain)).toBe(loadingActions + 1);
  });
  it('does not fetch dispersion if gene already selected', () => {
    renderViolinPlot(defaultStore);
    expect(actionCount('genes/propertiesLoading')).toBe(1);
    store.clearActions();
    const config = {
      ..._.cloneDeep(initialPlotConfigStates.violin),
      shownGene: 'GeneName',
    };
    renderViolinPlot(defaultStore, config);
    expect(actionCount('genes/propertiesLoading')).toBe(0);
  });
});

describe('ViolinIndex', () => {
  let store = null;
  let loadConfigSpy = null;
  let generateSpecSpy = null;

  beforeAll(async () => {
    await preloadAll();
  });
  beforeEach(() => {
    jest.clearAllMocks(); // Do not mistake with resetAllMocks()!
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({}), { status: 404, statusText: '404 Not Found' });
    loadConfigSpy = jest.spyOn(loadConfig, 'default');
    generateSpecSpy = jest.spyOn(generateViolinSpec, 'generateSpec');
  });

  const renderViolinIndex = async () => {
    store = createStore(rootReducer, _.cloneDeep(defaultStore), applyMiddleware(thunk));
    rtl.render(
      <Provider store={store}>
        <ViolinIndex
          experimentId={experimentId}
        />
      </Provider>,
    );
    await rtl.waitFor(() => expect(loadConfigSpy).toHaveBeenCalledTimes(1));
    await rtl.waitFor(() => expect(fetchCachedWork).toHaveBeenCalledTimes(2));
  };

  const getCanvasStrings = () => {
    const canvas = rtl.screen.getByRole('graphics-document').children[0];
    // eslint-disable-next-line no-underscore-dangle
    return canvas.getContext('2d').__getEvents()
      .filter((event) => event.type === 'fillText')
      .map((event) => event.props.text);
  };
  const ocurrencesInCanvas = (str) => {
    const strings = getCanvasStrings();
    return strings.filter((inCanvas) => inCanvas.includes(str)).length;
  };
  it('loads by default the gene with the highest dispersion, allows another to be selected, ansd updates the plot\'s title', async () => {
    await renderViolinIndex();

    const geneSelection = rtl.screen.getAllByRole('tab')[0];
    expect(geneSelection).toHaveTextContent('Gene Selection');
    const panelContainer = geneSelection.parentElement;

    userEvent.click(geneSelection);
    const geneInput = rtl.getByRole(panelContainer, 'textbox');
    expect(geneInput).toHaveValue('MockGeneWithHighestDispersion');
    expect(store.getState().componentConfig[plotUuid].config.shownGene).toBe('MockGeneWithHighestDispersion');

    const newGeneShown = 'NewGeneShown';
    userEvent.type(geneInput, `{selectall}{del}${newGeneShown}`);
    userEvent.click(rtl.getByRole(panelContainer, 'button'));
    expect(store.getState().componentConfig[plotUuid].config.shownGene).toBe(newGeneShown);

    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(1));
    expect(getCanvasStrings()).toContain(newGeneShown);
  });

  it('allows selection of the grouping/points, defaulting to louvain and All', async () => {
    await renderViolinIndex();

    const dataSelection = rtl.screen.getAllByRole('tab')[1];
    expect(dataSelection).toHaveTextContent('Select Data');
    const panelContainer = dataSelection.parentElement;

    userEvent.click(dataSelection);

    // Testing Selection is awkard :-(
    // The popup descends from the `body`, not from `panelContainer`
    // The `listbox` element that we need to wait for is not really the popup
    // (and I don't not what it is), but rather a sibling of it
    userEvent.click(rtl.getAllByRole(panelContainer, 'combobox')[0]);
    const popup1 = rtl.screen.getByRole('listbox').parentNode;
    expect(popup1).toHaveTextContent('Louvain clusters');
    expect(popup1).toHaveTextContent('Samples');
    expect(popup1).toHaveTextContent('Scratchpad');
    userEvent.click(rtl.getAllByRole(panelContainer, 'combobox')[0]);

    userEvent.click(rtl.getAllByRole(panelContainer, 'combobox')[1]);
    const popup2 = rtl.screen.getAllByRole('listbox')[1].parentNode;
    expect(popup2).toHaveTextContent('cluster a');
    expect(popup2).toHaveTextContent('Sample 1');
    userEvent.click(rtl.getAllByRole(panelContainer, 'combobox')[1]);

    // Testing the default values
    const inputFields = rtl.getAllByRole(panelContainer, 'combobox');
    expect(inputFields.length).toEqual(2);
    expect(inputFields[0].parentNode.parentNode).toHaveTextContent('Louvain clusters');
    expect(inputFields[1].parentNode.parentNode).toHaveTextContent('All');

    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(1));
    expect(getCanvasStrings()).toContain('cluster a');

    // Testing the effect of grouping by sample
    store.dispatch(updatePlotConfig(plotUuid, { selectedCellSet: 'sample' }));
    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(2));
    expect(getCanvasStrings()).toContain('Sample 1');
  });
  it('has a Data Tranformation panel', async () => {
    await renderViolinIndex();

    const tabs = rtl.screen.getAllByRole('tab');
    const dataTransformation = tabs.find((tab) => tab.textContent === 'Data Transformation');
    const panelContainer = dataTransformation.parentElement;
    userEvent.click(dataTransformation);

    // Normalization
    expect(getCanvasStrings()).toContain('Normalised Expression');
    const radioButtons = rtl.getAllByRole(panelContainer, 'radio');
    expect(radioButtons[0].parentNode.parentNode).toHaveTextContent('Normalised');
    expect(radioButtons[1].parentNode.parentNode).toHaveTextContent('Raw values');
    userEvent.click(radioButtons[1]);
    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(2));
    expect(getCanvasStrings()).toContain('Raw Expression');

    // Slider
    const slider = rtl.getByRole(panelContainer, 'slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '1');
    expect(slider).toHaveAttribute('aria-valuenow', '0.3');
  });

  it('has a Markers panel', async () => {
    await renderViolinIndex();

    const tabs = rtl.screen.getAllByRole('tab');
    const markers = tabs.find((tab) => tab.textContent === 'Markers');
    const panelContainer = markers.parentElement;
    userEvent.click(markers);

    const radioButtons = rtl.getAllByRole(panelContainer, 'radio');
    expect(radioButtons.length).toBe(4);
    expect(panelContainer).toHaveTextContent(/cell markers/i);
    expect(radioButtons[0]).toBeChecked();
    // toHaveDisplayValue() currently does not support input[type="radio"]
    expect(radioButtons[0].parentNode.parentNode).toHaveTextContent('Show');

    const slider = rtl.getByRole(panelContainer, 'slider');
    expect(slider).toHaveAttribute('aria-valuemin', '1');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '5');

    expect(panelContainer).toHaveTextContent(/median and interquartile range/i);
    expect(radioButtons[3]).toBeChecked();
    expect(radioButtons[3].parentNode.parentNode).toHaveTextContent('Hide');
  });

  it('has a Lengend panel', async () => {
    await renderViolinIndex();

    const tabs = rtl.screen.getAllByRole('tab');
    const markers = tabs.find((tab) => tab.textContent === 'Legend');
    const panelContainer = markers.parentElement;
    userEvent.click(markers);

    let radioButtons = rtl.getAllByRole(panelContainer, 'radio');
    expect(radioButtons.length).toBe(2);
    expect(panelContainer).toHaveTextContent(/toggle/i);
    expect(radioButtons[1]).toBeChecked();
    // toHaveDisplayValue() currently does not support input[type="radio"]
    expect(radioButtons[1].parentNode.parentNode).toHaveTextContent('Hide');

    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(1));
    expect(ocurrencesInCanvas('cluster a')).toBe(1);

    userEvent.click(radioButtons[0]);
    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(2));
    radioButtons = rtl.getAllByRole(panelContainer, 'radio');
    expect(radioButtons.length).toBe(5);
    expect(panelContainer).toHaveTextContent(/position/i);
    expect(radioButtons[2]).toBeChecked();
    expect(radioButtons[2].parentNode.parentNode).toHaveTextContent('Top');

    expect(ocurrencesInCanvas('cluster a')).toBe(2);
  });
});
