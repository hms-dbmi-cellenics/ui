import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import '@testing-library/jest-dom';
import thunk from 'redux-thunk';
import _ from 'lodash';
import initialExperimentState from '../../../redux/reducers/experimentSettings/initialState';
import genes from '../../../redux/reducers/genes/initialState';
import VolcanoPlot from '../../../pages/experiments/[experimentId]/plots-and-tables/volcano/index';
import {
  initialPlotConfigStates,
} from '../../../redux/reducers/componentConfig/initialState';

const mockStore = configureMockStore([thunk]);
const experimentId = 'insaneExperiment';
let store;
const plotUuid = 'volcanoPlotMain';
const dataState = {
  cellSets: {
    hierarchy: [
      {
        key: 'louvain',
        children: [
          {
            key: 'louvain-0',
          },
          {
            key: 'louvain-1',
          },
        ],
      }],
    properties: {
      louvain: {
        name: 'louvain clusters',
        cellIds: 'Set()',
        rootNode: true,
        type: 'cellSets',
      },
      'louvain-0': {
        name: 'Cluster 0',
        color: '#e377c2',
        cellIds: 'Set(1,5,14,22,24,26)',
        rootNode: false,
        type: 'cellSets',
      },
      'louvain-1': {
        name: 'Cluster 1',
        color: '#e377c2',
        cellIds: 'Set(165,16,21,25,28)',
        rootNode: false,
        type: 'cellSets',
      },
    },
  },
  componentConfig: { [plotUuid]: { config: initialPlotConfigStates.volcano, plotType: 'volcano' } },
  differentialExpression: {
    comparison: {
      group: {
        between: {
          cellSet: null,
          compareWith: null,
          basis: null,
        },
        within: {
          cellSet: 'louvain/louvain-0',
          compareWith: 'louvain/rest',
          basis: 'sample/4c762ba2-cc69-4fe5-a6b8-31ba993de86a',
        },
      },
      type: 'within',
    },
    properties: {
      loading: false,
    },
  },
};

describe('volcano plot tests', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Do not mistake with resetAllMocks()!
  });
  const renderVolcano = (state) => {
    store = mockStore(state);
    render(
      <Provider store={store}>
        <VolcanoPlot experimentid={experimentId} />
      </Provider>,
    );
  };
  it('renders skeleton when there is no config', () => {
    const state = {
      ..._.cloneDeep(dataState),
      componentConfig: { [plotUuid]: { config: null } },
    };
    renderVolcano(state);
    expect(screen.getByRole('list')).toHaveClass('ant-skeleton-paragraph');
  });

  it('renders empty when there is no data', () => {
    console.log('LOOK AT THIS ', initialPlotConfigStates.volcano);
    renderVolcano(dataState);
    expect(screen.getByText('Create a comparison to get started.')).toBeDefined();
  });
});
