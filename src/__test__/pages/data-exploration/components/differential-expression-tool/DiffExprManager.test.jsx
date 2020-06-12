/* eslint-env jest */

import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import DiffExprManager from '../../../../../pages/data-exploration/components/differential-expression-tool/DiffExprManager';
import DiffExprCompute from '../../../../../pages/data-exploration/components/differential-expression-tool/DiffExprCompute';
import DiffExprResults from '../../../../../pages/data-exploration/components/differential-expression-tool/DiffExprResults';
import connectionPromise from '../../../../../utils/socketConnection';

jest.mock('../../../../../utils/socketConnection');

let io;
let mockOn;
let mockEmit;

connectionPromise.mockImplementation(() => new Promise((resolve) => {
  resolve(io);
}));

const mockStore = configureMockStore([thunk]);

const emptyStore = mockStore({
  diffExpr: {
    loading: false,
    rows: [],
  },
  cellSets: {
    data: [],
  },
});

describe('DiffExprManager', () => {
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
  test('renders correctly a compute view', () => {
    const component = mount(
      <Provider store={emptyStore}>
        <DiffExprManager experimentID='1234' view='compute' />
      </Provider>,
    );
    expect(component.find(DiffExprCompute).length).toEqual(1);
  });

  test('renders correctly a results view', () => {
    const component = mount(
      <Provider store={emptyStore}>
        <DiffExprManager experimentID='1234' view='results' />
      </Provider>,
    );
    expect(component.find(DiffExprResults).length).toEqual(1);
  });

  test('on click of compute with changed parameters, DiffExprManager dispatches an action to fetch results', () => {
    const component = mount(
      <Provider store={emptyStore}>
        <DiffExprManager experimentID='1234' view='compute' />
      </Provider>,
    );
    expect(component.find(DiffExprResults).length).toEqual(0);

    act(() => {
      component.find(DiffExprCompute).getElement().props.onCompute('rest', ['cluster-a', 'cluster a'], [null, 'select cluster']);
    });
    component.update();

    const finished = new Promise((resolve, reject) => {
    });

    mockOn = jest.fn(async (x, f) => {
      const res = {
        results: [
        ],
      };
      f(res).then((result) => {
        finished.resolve(result);
      }).catch((e) => finished.reject(e));
    });

    mockEmit = jest.fn();

    io = {
      emit: mockEmit,
      on: mockOn,
    };

    finished.then(() => {
      expect(component.find(DiffExprResults).length).toEqual(1);
      expect(emptyStore.getActions().length).toEqual(2);
      expect(emptyStore.getActions()[0].type).toEqual('DIFF_EXPR.LOAD');
      expect(emptyStore.getActions()[1].type).toEqual('DIFF_EXPR.UPDATE');
      expect(mockEmit).toHaveBeenCalledWith('WorkRequest');
      expect(mockEmit).toHaveBeenCalledTimes(1);
      expect(mockOn).toHaveBeenCalledTimes(1);
    });
  });
});
