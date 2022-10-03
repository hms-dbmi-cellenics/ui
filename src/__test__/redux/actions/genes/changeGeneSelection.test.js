import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import changeGeneSelection from 'redux/actions/genes/changeGeneSelection';
import getInitialState from 'redux/reducers/genes/getInitialState';

import { GENES_SELECT, GENES_DESELECT } from 'redux/actionTypes/genes';

const mockStore = configureStore([thunk]);

const experimentId = '1234';
const genes = ['a', 'b', 'c', 'd'];

describe('changeGeneSelection action', () => {
  it('Dispatches select event when select event specified', async () => {
    const store = mockStore(getInitialState());
    await store.dispatch(changeGeneSelection(experimentId, genes, 'select'));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(GENES_SELECT);
    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches deselect event when select event specified', async () => {
    const store = mockStore(getInitialState());
    await store.dispatch(changeGeneSelection(experimentId, genes, 'deselect'));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(GENES_DESELECT);
    expect(firstAction).toMatchSnapshot();
  });

  it('Does not dispatch on other choice', async () => {
    const store = mockStore(getInitialState());

    const t = async () => {
      await store.dispatch(changeGeneSelection(experimentId, genes, 'maybeselect'));
    };

    expect(t).rejects.toEqual(new Error("'selectOrDeselect' must be either 'select' or 'deselect', maybeselect given."));

    expect(store.getActions().length).toEqual(0);
  });
});
