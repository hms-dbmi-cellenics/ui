import React from 'react';
import * as rtl from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import _ from 'lodash';

import {
  initialComponentConfigStates,
  initialPlotConfigStates,
} from 'redux/reducers/componentConfig/initialState';
import initialExperimentState from 'redux/reducers/experimentSettings/initialState';
import genes from 'redux/reducers/genes/initialState';
import ViolinPlot from 'components/plots/ViolinPlot';
import '__test__/test-utils/setupTests';

const mockStore = configureMockStore([thunk]);

const experimentId = 'mockExperimentId';
const plotUuid = 'ViolinMain'; // At some point this will stop being hardcoded

const defaultStore = {
  cellSets: {
    hierarchy: [{ key: 'louvain' }],
    properties: {},
  },
  componentConfig: initialComponentConfigStates,
  embeddings: {},
  experimentSettings: {
    ...initialExperimentState,
  },
  genes,
  backendStatus: {
    [experimentId]: {
      status: {},
    },
  },
};

describe('ViolinPlot', () => {
  let store = null;

  beforeEach(() => {
    jest.clearAllMocks(); // Do not mistake with resetAllMocks()!
  });

  const renderViolinPlot = (initialMockStore, config = initialPlotConfigStates.violin) => {
    store = mockStore(_.cloneDeep(initialMockStore));
    rtl.render(
      <Provider store={store}>
        <ViolinPlot
          experimentId={experimentId}
          plotUuid={plotUuid}
          config={config}
        />
      </Provider>,
    );
  };

  const actionCount = (action) => store.getActions().filter(
    (item) => (item.type === action),
  ).length;

  it('displays an error panel with Try Again if cellSets has an error', () => {
    const actionOnTryAgain = 'cellSets/loading';
    const storeContents = {
      ..._.cloneDeep(defaultStore),
      cellSets: {
        hierarchy: [],
        error: 'Broken CellSet',
      },
    };
    renderViolinPlot(storeContents);
    const loadingActions = actionCount(actionOnTryAgain);
    userEvent.click(rtl.screen.getByRole('button'));
    expect(actionCount(actionOnTryAgain)).toBe(loadingActions + 1);
  });

  it('displays an error panel with Try Again if error getting gene disperssion', () => {
    const actionOnTryAgain = 'genes/propertiesLoading';
    const storeContents = {
      ..._.cloneDeep(defaultStore),
    };

    storeContents.genes.properties.views[plotUuid] = {
      error: 'Broken dispersion',
    };

    renderViolinPlot(storeContents);
    const loadingActions = actionCount(actionOnTryAgain);
    userEvent.click(rtl.screen.getByRole('button'));
    expect(actionCount(actionOnTryAgain)).toBe(loadingActions + 1);
  });

  it('displays an error panel with Try Again if error getting gene expression', () => {
    const actionOnTryAgain = 'genes/expressionLoading';
    const storeContents = {
      ..._.cloneDeep(defaultStore),
    };
    storeContents.genes.expression.error = 'Broken expression';

    renderViolinPlot(storeContents);
    const loadingActions = actionCount(actionOnTryAgain);
    userEvent.click(rtl.screen.getByRole('button'));
    expect(actionCount(actionOnTryAgain)).toBe(loadingActions + 1);
  });

  it('does not fetch dispersion if gene already selected', () => {
    renderViolinPlot(defaultStore);
    expect(actionCount('genes/propertiesLoading')).toBe(1);
    store.clearActions();
    const config = {
      ..._.cloneDeep(initialPlotConfigStates.violin),
      shownGene: 'GeneName',
    };
    renderViolinPlot(defaultStore, config);
    expect(actionCount('genes/propertiesLoading')).toBe(0);
  });
});
