import React from 'react';
import { mount, configure } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import Adapter from 'enzyme-adapter-react-16';
import HierarchicalTree from '../../../../../pages/data-exploration/components/hierarchical-tree/HierarchicalTree';

configure({ adapter: new Adapter() });
const mockStore = configureMockStore([]);

describe('HierarchicalTree', () => {
  test('renders correctly', () => {
    const store = mockStore({
      cellSets: {
        data: [
          {
            key: '1',
            name: 'my element',
            rootNode: false,
            color: '#000000',
          },
        ],
      },
    });

    const component = mount(
      <Provider store={store}>
        <HierarchicalTree />
      </Provider>,
    );
    const tree = component.find('HierarchicalTree Tree');
    expect(tree.length).toEqual(1);
    expect(tree.getElement().props.treeData).toEqual(store.getState().cellSets.data);
  });

  test('can drag first component at the last position', () => {
    const firstChild = {
      key: '1a',
      name: 'first child',
      color: '#00FF00',
    };

    const secondChild = {
      key: '2a',
      name: 'second child',
      color: '#00FF00',
    };

    const thirdChild = {
      key: '3a',
      name: 'third child',
      color: '#00FF00',
    };

    const myData = [
      {
        key: '1',
        name: 'element 1',
        rootNode: true,
        children: [
          firstChild,
          secondChild,
          thirdChild,
        ],
      },
    ];

    const store = mockStore({
      cellSets: {
        data: myData,
      },
    });

    const dropInfo = {
      dragNode: {
        ...firstChild,
        props: { eventKey: firstChild.key },
      },
      dragNodesKeys: [firstChild.key],
      dropPosition: 2,
      dropToGap: true,
      node: {
        ...thirdChild,
        props: { eventKey: thirdChild.key },
      },
    };

    const mockOnTreeUpdate = jest.fn();

    const component = mount(
      <Provider store={store}>
        <HierarchicalTree onTreeUpdate={mockOnTreeUpdate} />
      </Provider>,
    );

    let tree = component.find('HierarchicalTree Tree');

    tree.getElement().props.onDrop(dropInfo);
    component.update();

    tree = component.find('HierarchicalTree Tree').getElement();
    const actualKeys = [];
    mockOnTreeUpdate.mock.calls[0][0][0].children.forEach((c) => actualKeys.push(c.key));
    expect(mockOnTreeUpdate).toHaveBeenCalledTimes(1);
    expect(actualKeys).toEqual(['2a', '3a', '1a']);
  });

  test('Can have child component change parent', () => {
    const child = {
      key: '1a',
      name: 'first child',
      color: '#00FF00',
    };

    const secondParent = {
      key: '2',
      name: 'parent 2',
      rootNode: true,
      children: [],
    };

    const data = [
      {
        key: '1',
        name: 'parent 1',
        rootNode: true,
        children: [
          child,
        ],
      },
      secondParent,
    ];

    const store = mockStore({
      cellSets: {
        data,
      },
    });

    const dropInfo = {
      dragNode: {
        ...child,
        props: { eventKey: child.key },
      },
      dragNodesKeys: [child.key],
      dropPosition: 1,
      dropToGap: false,
      node: {
        ...secondParent,
        props: { eventKey: secondParent.key },
      },
    };

    const mockOnTreeUpdate = jest.fn();

    const component = mount(
      <Provider store={store}>
        <HierarchicalTree onTreeUpdate={mockOnTreeUpdate} />
      </Provider>,
    );

    let tree = component.find('HierarchicalTree Tree').getElement();

    const { treeData } = tree.props;
    expect(treeData[0].children.length).toEqual(1);
    expect(treeData[1].children.length).toEqual(0);

    tree.props.onDrop(dropInfo);
    component.update();

    tree = component.find('HierarchicalTree Tree').getElement();
    expect(mockOnTreeUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnTreeUpdate.mock.calls[0][0][0].children.length).toEqual(0);
    expect(mockOnTreeUpdate.mock.calls[0][0][1].children.length).toEqual(1);
  });

  test("Can't drop parent inside node", () => {
    const firstParent = {
      key: '1',
      name: 'parent 1',
      rootNode: true,
      children: [],
    };

    const secondParent = {
      key: '2',
      name: 'parent 2',
      rootNode: true,
      children: [],
    };

    const data = [
      firstParent,
      secondParent,
    ];

    const store = mockStore({
      cellSets: {
        data,
      },
    });

    const dropInfo = {
      dragNode: {
        ...secondParent,
        props: { eventKey: secondParent.key },
      },
      dragNodesKeys: [secondParent.key],
      dropPosition: 1,
      dropToGap: false,
      node: {
        ...firstParent,
        props: { eventKey: firstParent.key },
      },
    };

    const mockOnTreeUpdate = jest.fn();

    const component = mount(
      <Provider store={store}>
        <HierarchicalTree onTreeUpdate={mockOnTreeUpdate} />
      </Provider>,
    );

    let tree = component.find('HierarchicalTree Tree').getElement();

    let { treeData } = tree.props;
    expect(treeData.length).toEqual(2);
    expect(treeData[0].children.length).toEqual(0);
    expect(treeData[1].children.length).toEqual(0);

    tree.props.onDrop(dropInfo);
    component.update();

    tree = component.find('HierarchicalTree Tree').getElement();

    treeData = tree.props.treeData;
    expect(treeData.length).toEqual(2);
    expect(mockOnTreeUpdate).toHaveBeenCalledTimes(0);
  });
});
