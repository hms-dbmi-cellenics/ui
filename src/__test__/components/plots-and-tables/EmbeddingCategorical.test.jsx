import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Vega } from 'react-vega';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { generateSpec, generateData } from 'utils/plotSpecs/generateEmbeddingCategoricalSpec';

const mockStore = configureMockStore([thunk]);
const cellSets = {
  properties: {
    'cluster-a': {
      name: 'cluster a',
      key: 'cluster-a',
      cellIds: new Set([0, 1, 2, 3, 4, 5]),
      color: '#00FF00',
    },
    'cluster-b': {
      name: 'cluster b',
      key: 'cluster-b',
      cellIds: new Set([6, 7, 8, 9, 10]),
      color: '#FF0000',
    },
    'sample-a': {
      name: 'sample a',
      key: 'sample-a',
      cellIds: new Set([0, 2, 7, 8]),
      color: '#00FF00',
    },
    'sample-b': {
      name: 'sample b',
      key: 'sample-b',
      cellIds: new Set([1, 3, 4, 6, 7, 8, 5]),
      color: '#FF0000',
    },
    louvain: {
      name: 'Louvain clusters',
      key: 'louvain',
      type: 'cellSets',
      cellIds: new Set(),
      rootNode: true,
    },
    scratchpad: {
      name: 'Custom selections',
      key: 'scratchpad',
      type: 'cellSets',
      cellIds: new Set(),
      rootNode: true,
    },
    sample: {
      name: 'Samples',
      key: 'sample',
      type: 'metadataCategorical',
      cellIds: new Set(),
      rootNode: true,
    },
  },
  hierarchy: [
    {
      key: 'louvain',
      children: [{ key: 'cluster-a' }, { key: 'cluster-b' }],
    },
    {
      key: 'sample',
      children: [{ key: 'sample-a' }, { key: 'sample-b' }],
    },
    {
      key: 'scratchpad',
      children: [],
    },
  ],
};
const embeddingData = [
  [-1.2343500852584839, -0.6240003705024719],
  [18.337648391723633, -4.259221076965332],
  [12.77301025390625, 9.594305038452148],
  [12.23039436340332, 8.78237533569336],
  [11.743823051452637, 14.542245864868164],
  [14.73792839050293, -6.2992401123046875],
  [18.160137176513672, -5.003548622131348],
  [-0.6337113976478577, -4.029159069061279],
  [-0.44386163353919983, -3.227933883666992],
  [7.28579044342041, 13.526543617248535],
  [14.973455429077148, 11.745992660522461],
  [18, 10],
];
const config = initialPlotConfigStates.embeddingCategorical;
const expression = [0.844880940781665, 0, 0, 0, 0, 0, 1, 2,
  1.0892605007475098, 0.9444651009182008, 0, 0, 0.9955310761799436, 0, 0];

const initialState = {
  cellSets,
  embeddings: {
    umap: {
      embeddingData,
    },
  },
  genes: {
    expression: {
      data: {
        CST3: {
          expression,
        },
      },
    },
  },
};
const store = mockStore(initialState);
let component;
const method = 'UMAP';
const {
  plotData,
  cellSetLegendsData,
} = generateData(cellSets, config.selectedSample, config.selectedCellSet, embeddingData);

const spec = generateSpec(config, method, plotData, cellSetLegendsData);

const testPlot = () => mount(
  <Provider store={store}>
    <Vega
      spec={spec}
      renderer='canvas'
    />
  </Provider>,
);

describe('Embedding categorical plot ', () => {
  afterEach(() => {
    component.unmount();
  });

  it('Embedding categorical loads', () => {
    component = testPlot();
    const vegaAvailable = component.find(Vega);
    expect(vegaAvailable.length).toEqual(1);
  });

  it('Embedding categorical loads filtered', () => {
    component = testPlot();
    config.selectedSample = 'sample-b';
    const vegaAvailable = component.find(Vega);
    expect(vegaAvailable.length).toEqual(1);
  });
});
