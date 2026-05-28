import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { Dropdown } from 'antd';
import thunk from 'redux-thunk';
import preloadAll from 'jest-next-dynamic';
import configureMockStore from 'redux-mock-store';
import { UPDATE_CONFIG } from 'redux/actionTypes/componentConfig';
import fetchWork from 'utils/work/fetchWork';
import ComponentActions from 'components/data-exploration/generic-gene-table/ComponentActions';
import { getTwoGenesExpressionMatrix, getThreeGenesMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

const mockThreeGenesMatrix = getThreeGenesMatrix();
jest.mock('utils/work/fetchWork', () => (jest.fn(() => new Promise((resolve) => resolve(mockThreeGenesMatrix)))));

const mockStore = configureMockStore([thunk]);

let component;
const experimentId = '1234';
const componentType = 'asd';

const backendStatus = {
  [experimentId]: {
    status: {
      pipeline: {
        status: 'SUCCEEDED',
        startDate: '2021-01-01T01:01:01.000Z',
      },
    },
  },
};

const initialState = {
  genes: {
    expression: {
      full: {
        loading: [],
        matrix: getTwoGenesExpressionMatrix(),
      },
      views: {
        [componentType]: {
          data: ['Gzma', 'Lyz2'],
          fetching: false,
          error: false,
        },
      },
    },
    selected: ['GeneA'],
  },
  backendStatus,
  componentConfig: {
    [componentType]: {
      config: {
        selectedGenes: ['Gzma', 'Lyz2'],
      },
    },
  },
};

describe('ComponentActions', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  afterEach(() => {
    component.unmount();
    jest.clearAllMocks();
  });

  it('Renders correctly when there are selected genes', () => {
    const store = mockStore(initialState);

    component = mount(
      <Provider store={store}>
        <ComponentActions name='fakeName' experimentId={experimentId} componentType={componentType} />
      </Provider>,
    );

    const dropdown = component.find(Dropdown);
    expect(dropdown.length).toEqual(1);
    expect(dropdown.props().overlay.type.name).toEqual('Menu');
    expect(dropdown.props().overlay.props.children.length).toEqual(3);
  });

  it('Renders correctly when there are no selected genes', () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        selected: [],
      },
    });

    component = mount(
      <Provider store={store}>
        <ComponentActions name='fakeName' experimentId={experimentId} componentType={componentType} />
      </Provider>,
    );

    expect(component.find(Dropdown).length).toEqual(0);
  });

  it('Updates selectedGenes config when Add is clicked', () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        selected: ['GeneA', 'GeneB', 'GeneC'],
      },
    });

    component = mount(
      <Provider store={store}>
        <ComponentActions name='fakeName' experimentId={experimentId} componentType={componentType} />
      </Provider>,
    );

    const menuButtons = component.find(Dropdown).props().overlay;
    menuButtons.props.children[0].props.onClick();

    expect(fetchWork).not.toHaveBeenCalled();
    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual(UPDATE_CONFIG);
    expect(store.getActions()[0].payload.configChanges.selectedGenes).toEqual(
      ['Gzma', 'Lyz2', 'GeneA', 'GeneB', 'GeneC'],
    );
  });

  it('Updates selectedGenes config when Remove is clicked', () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        selected: ['Gzma'],
      },
    });

    component = mount(
      <Provider store={store}>
        <ComponentActions name='fakeName' experimentId={experimentId} componentType={componentType} />
      </Provider>,
    );

    const menuButtons = component.find(Dropdown).props().overlay;
    menuButtons.props.children[1].props.onClick();

    expect(fetchWork).not.toHaveBeenCalled();
    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual(UPDATE_CONFIG);
    expect(store.getActions()[0].payload.configChanges.selectedGenes).toEqual(['Lyz2']);
  });

  it('Updates selectedGenes config when Overwrite is clicked', () => {
    const store = mockStore({
      ...initialState,
      genes: {
        ...initialState.genes,
        selected: ['Gzma'],
      },
    });

    component = mount(
      <Provider store={store}>
        <ComponentActions name='fakeName' experimentId={experimentId} componentType={componentType} />
      </Provider>,
    );

    const menuButtons = component.find(Dropdown).props().overlay;
    menuButtons.props.children[2].props.onClick();

    expect(fetchWork).not.toHaveBeenCalled();
    expect(store.getActions().length).toEqual(1);
    expect(store.getActions()[0].type).toEqual(UPDATE_CONFIG);
    expect(store.getActions()[0].payload.configChanges.selectedGenes).toEqual(['Gzma']);
  });
});
