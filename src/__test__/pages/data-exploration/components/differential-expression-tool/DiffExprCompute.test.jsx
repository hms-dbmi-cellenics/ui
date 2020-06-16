import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  Form, Select, Radio, Button,
} from 'antd';
import DiffExprCompute from '../../../../../pages/data-exploration/components/differential-expression-tool/DiffExprCompute';

const { Item } = Form;
const mockStore = configureMockStore([thunk]);

const store = mockStore({
  cellSets: {
    data: [
      {
        name: 'Louvain clusters',
        key: 'louvain',
        rootNode: true,
        children: [
          {
            name: 'cluster a',
            key: 'cluster-a',
            cellIds: ['one', 'two'],
            color: '#00FF00',
          },
          {
            name: 'cluster b',
            key: 'cluster-b',
            cellIds: ['three', 'four', 'five'],
            color: '#FF0000',
          },
          {
            name: 'cluster c',
            key: 'cluster-c',
            cellIds: ['six'],
            color: '#0000FF',
          },
        ],
      },
      {
        name: 'Custom selections',
        key: 'custom',
        rootNode: true,
        children: [],
      },
    ],
  },
});

describe('DiffExprCompute', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  configure({ adapter: new Adapter() });
  test('renders correctly with no comparison method', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute experimentID='1234' onCompute={jest.fn()} />
      </Provider>,
    );

    const form = component.find(Form);

    expect(form.length).toEqual(1);
    expect(form.find('div').at(0).getElement().props.children).toEqual('Compare');
    expect(form.find(Item).length).toEqual(2);
    expect(form.find(Item).at(0).find(Radio.Group).length).toEqual(1);
    expect(form.find(Item).at(1).find(Button).length).toEqual(1);
  });

  test('renders correctly with versus rest comparison method', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute experimentID='1234' onCompute={jest.fn()} comparison='Versus Rest' />
      </Provider>,
    );

    const form = component.find(Form);
    expect(form.length).toEqual(1);
    expect(form.find('div').at(0).getElement().props.children).toEqual('Compare');
    expect(form.find(Item).length).toEqual(3);
    expect(form.find(Item).at(0).find(Radio.Group).length).toEqual(1);
    expect(form.find(Item).at(1).find(Select).length).toEqual(1);

    const computeButton = form.find(Item).at(2).find(Button);
    expect(computeButton.length).toEqual(1);
    expect(computeButton.getElement().props.disabled).toEqual(true);
  });

  test('renders correctly with across sets comparison method', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute experimentID='1234' onCompute={jest.fn()} comparison='Across Sets' />
      </Provider>,
    );

    const form = component.find(Form);
    expect(form.length).toEqual(1);
    expect(form.find('div').at(0).getElement().props.children).toEqual('Compare');
    expect(form.find(Item).length).toEqual(3);
    expect(form.find(Item).at(0).find(Radio.Group).length).toEqual(1);
    expect(form.find(Item).at(1).find(Select).length).toEqual(2);
    expect(form.find(Item).at(2).find(Button).length).toEqual(1);
  });

  test('the select options render correctly', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentID='1234'
          onCompute={jest.fn()}
          comparison='Versus Rest'
        />
      </Provider>,
    );

    const options = component.find(Form).find(Item).at(1).find(Select)
      .getElement();
    expect(options.props.children.length).toEqual(3);
    expect(options.props.value).toEqual('select cluster');

    expect(options.props.children[0].key).toEqual('cluster-a');
    expect(options.props.children[0].props.value).toEqual('cluster a (Louvain clusters)');
    expect(options.props.children[1].key).toEqual('cluster-b');
    expect(options.props.children[1].props.value).toEqual('cluster b (Louvain clusters)');
    expect(options.props.children[2].key).toEqual('cluster-c');
    expect(options.props.children[2].props.value).toEqual('cluster c (Louvain clusters)');
  });

  test('renders correctly with previously selected clusters', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentID='1234'
          onCompute={jest.fn()}
          comparison='Across Sets'
          first={{ key: 'cluster-a', value: 'cluster a' }}
          second={{ key: 'cluster-b', value: 'cluster b' }}
        />
      </Provider>,
    );

    const firstSelected = component.find(Form).find(Item).at(1).find(Select)
      .at(0)
      .getElement();
    expect(firstSelected.props.value).toEqual('cluster a');

    const secondSelected = component.find(Form).find(Item).at(1).find(Select)
      .at(1)
      .getElement();
    expect(secondSelected.props.value).toEqual('cluster b');

    expect(component.find(Form).find(Item).at(2).find(Button)
      .getElement().props.disabled).toEqual(false);
  });

  test('button gets disabled when switching from versus rest to across sets', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentID='1234'
          onCompute={jest.fn()}
          comparison='Versus Rest'
          first={{ key: 'cluster-a', value: 'cluster a' }}
        />
      </Provider>,
    );

    let firstSelected = component.find(Form).find(Item).at(1).find(Select)
      .at(0);
    let computeButton = component.find(Form).find(Item).at(2).find(Button);

    expect(firstSelected.getElement().props.value).toEqual('cluster a');
    expect(computeButton.getElement().props.disabled).toEqual(false);

    // change the comparison type
    act(() => {
      component.find(Form).find(Item).at(0).find(Radio.Group)
        .getElement().props.onChange({ target: { value: 'Across Sets' } });
    });
    component.update();

    firstSelected = component.find(Form).find(Item).at(1).find(Select)
      .at(0);
    computeButton = component.find(Form).find(Item).at(2).find(Button);

    expect(firstSelected.getElement().props.value).toEqual('cluster a');
    expect(computeButton.getElement().props.disabled).toEqual(true);
  });

  test('button stays enabled when switching from across sets to versus rest', () => {
    const component = mount(
      <Provider store={store}>
        <DiffExprCompute
          experimentID='1234'
          onCompute={jest.fn()}
          comparison='Across Sets'
          first={{ key: 'cluster-a', value: 'cluster a' }}
          second={{ key: 'cluster-b', value: 'cluster b' }}
        />
      </Provider>,
    );

    let firstSelected = component.find(Form).find(Item).at(1).find(Select)
      .at(0);
    let computeButton = component.find(Form).find(Item).at(2).find(Button);

    expect(firstSelected.getElement().props.value).toEqual('cluster a');
    expect(computeButton.getElement().props.disabled).toEqual(false);

    // change the comparison type
    act(() => {
      component.find(Form).find(Item).at(0).find(Radio.Group)
        .getElement().props.onChange({ target: { value: 'Versus Rest' } });
    });
    component.update();

    firstSelected = component.find(Form).find(Item).at(1).find(Select)
      .at(0);
    computeButton = component.find(Form).find(Item).at(2).find(Button);

    expect(firstSelected.getElement().props.value).toEqual('cluster a');
    expect(computeButton.getElement().props.disabled).toEqual(false);
  });
});
