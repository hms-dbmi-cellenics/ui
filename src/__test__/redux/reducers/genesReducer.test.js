import genesReducer from '../../../redux/reducers/genes';
import initialState from '../../../redux/reducers/genes/initialState';

import {
  GENES_EXPRESSION_LOADING, GENES_EXPRESSION_LOADED, GENES_EXPRESSION_ERROR,
  GENES_SELECT, GENES_DESELECT,
  GENES_PROPERTIES_LOADING, GENES_PROPERTIES_ERROR, GENES_PROPERTIES_LOADED_PAGINATED,
} from '../../../redux/actionTypes/genes';

describe('genesReducer', () => {
  it('Reduces identical state on unknown action', () => expect(
    genesReducer(undefined, {
      action: 'well/this/is/not/a/valid/action',
      payload: {},
    }),
  ).toEqual(initialState));

  it('Sets loading state on expression loading action', () => {
    const newState = genesReducer(initialState, {
      type: GENES_EXPRESSION_LOADING,
      payload: {
        genes: ['A', 'B', 'C'],
        componentUuid: 'abc',
      },
    });

    expect(newState.expression.loading).toEqual(['A', 'B', 'C']);
    expect(newState.expression.views.abc.fetching).toEqual(true);
    expect(newState.expression.views.abc.error).toEqual(false);
    expect(newState).toMatchSnapshot();
  });

  it('Sets loaded state on expression loading action', () => {
    const newState = genesReducer(initialState, {
      type: GENES_EXPRESSION_LOADED,
      payload: {
        data: {
          GENE1: {
            min: 0,
            max: 0,
            expression: [0, 0, 0, 0],
          },
        },
        componentUuid: 'abc',
      },
    });
    expect(newState).toMatchSnapshot();
  });

  it('Multiple components loading some of same expression triggers appropriate action', () => {
    let newState = genesReducer(initialState, {
      type: GENES_EXPRESSION_LOADING,
      payload: {
        componentUuid: 'abc',
        genes: ['a', 'b'],
      },
    });

    newState = genesReducer(newState, {
      type: GENES_EXPRESSION_LOADING,
      payload: {
        componentUuid: 'def',
        genes: ['a', 'b', 'c'],
      },
    });

    expect(newState.expression.loading).toEqual(['a', 'b', 'c']);
    expect(newState).toMatchSnapshot();
  });

  it('Expression loaded state handled appropriately when other things are still loading', () => {
    const newState = genesReducer({
      ...initialState,
      expression: {
        ...initialState.expression,
        loading: ['a', 'b', 'c', 'd', 'e'],
      },
    }, {
      type: GENES_EXPRESSION_LOADED,
      payload: {
        componentUuid: 'asd',
        genes: ['a', 'b', 'c'],
        data: {
          gene1: {
            a: 5,
            b: 6,
            c: 7,
          },
          gene2: {
            a: 7,
            b: 8,
            c: 9,
          },
        },
      },
    });

    expect(newState.expression.loading).toEqual(['D', 'E']);
    expect(newState).toMatchSnapshot();
  });

  it('Sets error state on expression error action', () => {
    const newState = genesReducer(initialState, {
      type: GENES_EXPRESSION_ERROR,
      payload: {
        error: 'asd',
        componentUuid: 'abc',
      },
    });

    expect(newState.expression.error).toEqual('asd');
    expect(newState).toMatchSnapshot();
  });

  //
  // GENES SELECT TESTS
  //

  it('Selected genes get added on empty list', () => {
    const newState = genesReducer(initialState, {
      type: GENES_SELECT,
      payload: {
        genes: ['a', 'b', 'c'],
      },
    });

    expect(newState.selected).toEqual(['a', 'b', 'c']);
    expect(newState).toMatchSnapshot();
  });

  it('Selected genes get added as a set to a non-empty list', () => {
    const newState = genesReducer({ ...initialState, selected: ['a', 'b'] }, {
      type: GENES_SELECT,
      payload: {
        genes: ['b', 'd'],
      },
    });

    expect(newState.selected).toEqual(['a', 'b', 'd']);
    expect(newState).toMatchSnapshot();
  });

  it('Deselecting all genes updates to empty list', () => {
    const newState = genesReducer({ ...initialState, selected: ['a', 'b'] }, {
      type: GENES_DESELECT,
      payload: {
        genes: ['a', 'b'],
      },
    });

    expect(newState.selected).toEqual([]);
    expect(newState).toMatchSnapshot();
  });

  it('Deselecting part of all genes updates list as set', () => {
    const newState = genesReducer({ ...initialState, selected: ['a', 'b', 'd'] }, {
      type: GENES_DESELECT,
      payload: {
        genes: ['b'],
      },
    });

    expect(newState.selected).toEqual(['a', 'd']);
    expect(newState).toMatchSnapshot();
  });

  it('Deselecting non-selected genes is handled gracefully', () => {
    const newState = genesReducer({ ...initialState, selected: ['a', 'b', 'd'] }, {
      type: GENES_DESELECT,
      payload: {
        genes: ['e'],
      },
    });

    expect(newState.selected).toEqual(['a', 'b', 'd']);
    expect(newState).toMatchSnapshot();
  });

  //
  // GENES PROPERTIES TESTS
  //

  it('Properties loading triggers appropriate changes', () => {
    const newState = genesReducer(initialState, {
      type: GENES_PROPERTIES_LOADING,
      payload: {
        componentUuid: 'asd',
        properties: ['a', 'b'],
      },
    });

    expect(newState.properties.views.asd.fetching).toEqual(true);
    expect(newState.properties.views.asd.error).toEqual(false);
    expect(newState).toMatchSnapshot();
  });

  it('Multiple components loading some of same property triggers appropriate action', () => {
    let newState = genesReducer(initialState, {
      type: GENES_PROPERTIES_LOADING,
      payload: {
        componentUuid: 'asd',
        properties: ['a', 'b'],
      },
    });

    newState = genesReducer(newState, {
      type: GENES_PROPERTIES_LOADING,
      payload: {
        componentUuid: 'asdf',
        properties: ['a', 'b', 'c'],
      },
    });

    expect(newState.properties.loading).toEqual(['a', 'b', 'c']);
    expect(newState).toMatchSnapshot();
  });

  it('Error state handled appropriately', () => {
    const newState = genesReducer(initialState, {
      type: GENES_PROPERTIES_ERROR,
      payload: {
        componentUuid: 'asd',
        error: 'asd',
      },
    });

    expect(newState.properties.views.asd.error).toEqual('asd');
    expect(newState).toMatchSnapshot();
  });

  it('Loading on error state causes error to reset', () => {
    let newState = genesReducer(initialState, {
      type: GENES_PROPERTIES_ERROR,
      payload: {
        componentUuid: 'asd',
        error: 'asd',
      },
    });

    newState = genesReducer(newState, {
      type: GENES_PROPERTIES_LOADING,
      payload: {
        componentUuid: 'asd',
        properties: ['a', 'b'],
      },
    });

    expect(newState.properties.views.asd.error).toEqual(false);
    expect(newState).toMatchSnapshot();
  });

  it('Loaded paginated state handled appropriately', () => {
    const newState = genesReducer({
      ...initialState,
      properties: {
        ...initialState.properties,
        loading: ['a', 'b', 'c'],
      },
    }, {
      type: GENES_PROPERTIES_LOADED_PAGINATED,
      payload: {
        componentUuid: 'asd',
        properties: ['a', 'b', 'c'],
        data: {
          gene1: {
            a: 5,
            b: 6,
            c: 7,
          },
          gene2: {
            a: 7,
            b: 8,
            c: 9,
          },
        },
      },
    });

    expect(newState.properties.loading).toEqual([]);
    expect(newState.properties.views.asd.data).toEqual(['gene1', 'gene2']);
    expect(newState).toMatchSnapshot();
  });

  it('Loaded paginated state handled appropriately when other things are still loading', () => {
    const newState = genesReducer({
      ...initialState,
      properties: {
        ...initialState.properties,
        loading: ['a', 'b', 'c', 'd', 'e'],
      },
    }, {
      type: GENES_PROPERTIES_LOADED_PAGINATED,
      payload: {
        componentUuid: 'asd',
        properties: ['a', 'b', 'c'],
        data: {
          gene1: {
            a: 5,
            b: 6,
            c: 7,
          },
          gene2: {
            a: 7,
            b: 8,
            c: 9,
          },
        },
      },
    });

    expect(newState.properties.loading).toEqual(['d', 'e']);
    expect(newState).toMatchSnapshot();
  });
});
