import {
  updateSelectedGenes,
  loadGeneExpression,
  updateCellInfo,
  setFocusedGene,
} from '../../../redux/actions';
import * as types from '../../../redux/actionTypes';
import connectionPromise from '../../../utils/socketConnection';

jest.mock('localforage');
jest.mock('../../../utils/socketConnection');

const mockOn = jest.fn(async (x, f) => {
  const res = {
    results: [
      {
        body: JSON.stringify({
          cells: ['C1', 'C2'],
          data: [
            { geneName: 'G1', expression: [1, 2] },
            { geneName: 'G2', expression: [1, 2] },
          ],
          minExpression: 0,
          maxExpression: 10,
        }),
      },
    ],
  };
  f(res);
});
const mockEmit = jest.fn();
const io = { emit: mockEmit, on: mockOn };
connectionPromise.mockImplementation(() => new Promise((resolve) => {
  resolve(io);
}));

let dispatch;

describe('updateSelectedGenes action', () => {
  beforeEach(() => {
    dispatch = jest.fn();
  });
  it('Fires correctly with select gene', () => {
    const getState = () => ({
      selectedGenes: {},
      geneExpressionData: {},
    });
    updateSelectedGenes(['G1'], true)(dispatch, getState);
    expect(dispatch).toBeCalledTimes(2);
    expect(dispatch).toBeCalledWith({
      data: { newGenesAdded: true },
      type: types.SELECTED_GENES,
    });
    expect(dispatch).toBeCalledWith({
      data: {
        genes: undefined,
        rendering: true,
        showAxes: true,
      },
      type: types.UPDATE_HEATMAP_SPEC,
    });
  });
  it('Fires correctly with unselect gene', () => {
    const getState = () => ({
      selectedGenes: {
        geneList: {
          G1: true,
        },
      },
      geneExpressionData: {
        cells: ['C1', 'C2'],
        data: [
          {
            geneName: 'G1',
            expression: [1, 2],
          },
          {
            geneName: 'G2',
            expression: [1, 2],
          },
        ],
      },
    });
    updateSelectedGenes(['G1'], false)(dispatch, getState);
    expect(dispatch).toBeCalledTimes(2);
    expect(dispatch).toBeCalledWith({
      data: { newGenesAdded: false },
      type: types.SELECTED_GENES,
    });
    expect(dispatch).toBeCalledWith({
      data: {
        genes: [{
          geneName: 'G2',
          expression: [1, 2],
        }],
        showAxes: true,
        rendering: true,
      },
      type: types.UPDATE_HEATMAP_SPEC,
    });
  });
  it('axes is removed when more than 30 genes are selected', () => {
    const getState = () => ({
      selectedGenes: {},
      geneExpressionData: {},
    });
    updateSelectedGenes(['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12', 'G13', 'G14', 'G15', 'G16', 'G17', 'G18', 'G19', 'G20', 'G21', 'G22', 'G23', 'G24', 'G25', 'G26', 'G27', 'G28', 'G29', 'G30'], true)(dispatch, getState);
    expect(dispatch).toBeCalledTimes(2);
    expect(dispatch).toBeCalledWith({
      data: { newGenesAdded: true },
      type: types.SELECTED_GENES,
    });
    expect(dispatch).toBeCalledWith({
      data: {
        genes: undefined,
        rendering: true,
        showAxes: false,
      },
      type: types.UPDATE_HEATMAP_SPEC,
    });
  });
});

describe('loadGeneExpression action', () => {
  beforeEach(() => {
    dispatch = jest.fn();
  });
  it('Fetch selected gene from API', async () => {
    const getState = () => ({
      selectedGenes: {
        geneList: {
          G1: false,
        },
        newGenesAdded: true,
      },
      geneExpressionData: { isLoading: false },
    });
    await loadGeneExpression('expId')(dispatch, getState);
    expect(dispatch).toBeCalledTimes(4);
    expect(dispatch).toBeCalledWith({
      data: { newGenesAdded: false },
      type: types.SELECTED_GENES,
    });
    expect(dispatch).toBeCalledWith({
      data: {
        isLoading: true,
      },
      type: types.UPDATE_GENE_EXPRESSION,
    });
    expect(dispatch).toBeCalledWith({
      type: types.UPDATE_GENE_EXPRESSION,
      data: {
        heatMapData: {
          cells: ['C1', 'C2'],
          data: [
            { geneName: 'G1', expression: [1, 2] },
            { geneName: 'G2', expression: [1, 2] },
          ],
          minExpression: 0,
          maxExpression: 10,
        },
        isLoading: false,
      },
    });
    expect(dispatch).toBeCalledWith({
      type: types.BUILD_HEATMAP_SPEC,
      data: {
        geneExpressionData: {
          cells: ['C1', 'C2'],
          data: [
            { geneName: 'G1', expression: [1, 2] },
            { geneName: 'G2', expression: [1, 2] },
          ],
          minExpression: 0,
          maxExpression: 10,
        },
      },
    });
  });
  it('Does not apply clustering if there are no louvain cellSets in the store', async () => {
    const getState = () => ({
      selectedGenes: {
        geneList: {
          G1: false,
        },
        newGenesAdded: true,
      },
      geneExpressionData: { isLoading: false },
    });
    await loadGeneExpression('expId')(dispatch, getState);
    expect(mockEmit).toBeCalledWith('WorkRequest', expect.objectContaining({
      body: {
        name: 'GeneExpression',
        cellSets: 'all',
        genes: ['G1'],
      },
    }));
  });
  it('Applies clustering if there are louvain cellSets in the store', async () => {
    const getState = () => ({
      cellSets: {
        hierarchy: [
          {
            key: 'louvain',
            children: [{ key: 'louvain-0' }, { key: 'louvain-1' }, { key: 'louvain-2' }],
          },
          {
            key: 'something-else',
            children: [{ key: 'something-0' }, { key: 'something-1' }, { key: 'something-2' }],
          },
        ],
      },
      selectedGenes: {
        geneList: {
          G1: false,
        },
        newGenesAdded: true,
      },
      geneExpressionData: { isLoading: false },
    });
    await loadGeneExpression('expId')(dispatch, getState);
    expect(mockEmit).toBeCalledWith('WorkRequest', expect.objectContaining({
      body: {
        name: 'GeneExpression',
        cellSets: ['louvain-0', 'louvain-1', 'louvain-2'],
        genes: ['G1'],
      },
    }));
  });
});

describe('updateCellInfo action', () => {
  beforeEach(() => {
    dispatch = jest.fn();
  });
  it('Fetch selected gene from API', () => {
    updateCellInfo({
      cellName: 'C1',
      geneName: 'G1',
      expression: 1,
      componentType: 'heatmap',
    })(dispatch);

    expect(dispatch).toBeCalledTimes(1);
    expect(dispatch).toBeCalledWith({
      data: {
        cellName: 'C1',
        geneName: 'G1',
        expression: 1,
        componentType: 'heatmap',
      },
      type: types.UPDATE_CELL_INFO,
    });
  });
});

describe('setFocusedGene action', () => {
  beforeEach(() => {
    dispatch = jest.fn();
  });
  it('Get focused gene from store', async () => {
    const getState = () => ({
      selectedGenes: {
        geneList: {
          G1: true,
        },
      },
      geneExpressionData: {
        cells: ['C1'],
        data: [{ geneName: 'G1', expression: [1] }],
        minExpression: 0,
        maxExpression: 10,
        isLoading: false,
      },
    });
    await setFocusedGene('G1', 'expId')(dispatch, getState);

    expect(dispatch).toBeCalledTimes(1);
    expect(dispatch).toBeCalledWith({
      data: {
        cells: ['C1'],
        expression: [1],
        geneName: 'G1',
        minExpression: 0,
        maxExpression: 10,
        isLoading: false,
      },
      type: types.SET_FOCUSED_GENE,
    });
  });
  it('Get focused gene from API', async () => {
    const getState = () => ({
      selectedGenes: {},
      geneExperessionData: {
        cells: ['C1'],
        data: [{ geneName: 'G1', expression: [1] }],
        minExpression: 0,
        maxExpression: 10,
        isLoading: false,
      },
    });
    await setFocusedGene('G1', 'expId')(dispatch, getState);

    expect(dispatch).toBeCalledTimes(2);
    expect(dispatch).toBeCalledWith({
      data: {
        isLoading: true,
      },
      type: types.SET_FOCUSED_GENE,
    });

    expect(dispatch).toBeCalledWith({
      data: {
        cells: ['C1', 'C2'],
        expression: [1, 2],
        minExpression: 0,
        maxExpression: 10,
        geneName: 'G1',
        isLoading: false,
      },
      type: types.SET_FOCUSED_GENE,
    });
  });
});
