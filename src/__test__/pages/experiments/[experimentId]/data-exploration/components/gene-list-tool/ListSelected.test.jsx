import React from 'react';
import { mount, configure } from 'enzyme';
import { act } from 'react-dom/test-utils';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import preloadAll from 'jest-next-dynamic';
import thunk from 'redux-thunk';
import _ from 'lodash';
import { ExclamationCircleFilled } from '@ant-design/icons';
import waitForActions from 'redux-mock-store-await-actions';
import GeneListTool from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/gene-list-tool/GeneListTool';
import { fetchCachedWork } from '../../../../../../../utils/cacheRequest';

import { GENES_PROPERTIES_LOADING, GENES_PROPERTIES_LOADED_PAGINATED } from '../../../../../../../redux/actionTypes/genes';
import ListSelected from '../../../../../../../pages/experiments/[experimentId]/data-exploration/components/generic-gene-table/ListSelected'
const initialState = {
  genes: {
    properties: {
      loading: [],
      data: {
        CEMIP: { dispersions: 3.999991789324 },
        TIMP3: { dispersions: 3.4388329 },
        SMYD3: { dispersions: 3.1273264798 },
        I: { dispersions: 0.08756543 },
        J: { dispersions: 1.352342342 },
        K: { dispersions: 33.423142314 },
      },
      views: {
        [TEST_UUID]: {
          fetching: false,
          error: false,
          total: 4,
          data: ['J', 'I', 'K', 'CEMIP'],
        },
      },
    },
    expression: {
      loading: [],
      error: false,
      data: {},
    },
    selected: ['PPBP', 'DOK3', 'YPEL2'],
    focused: undefined,
  },
};

describe('ListSelected', () => {
  beforeAll(async () => {
    await preloadAll();
  });
  test('renders correctly', () => {
    const component = mount(<ListSelected onFilter={jest.fn()} />);
    const select = component.find(Select);
    const search = component.find(Button);

    expect(select.length).toEqual(1);
    expect(search.length).toEqual(1);
  });
});
