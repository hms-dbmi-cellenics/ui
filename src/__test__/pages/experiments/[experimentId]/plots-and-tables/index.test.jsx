import React from 'react';

import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { makeStore } from 'redux/store';

import '__test__/test-utils/mockWorkerBackend';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import PlotsTablesHome from 'pages/experiments/[experimentId]/plots-and-tables';
import { plotNames, spatialPlotNames } from 'utils/constants';

const plotsAndTablesPageFactory = createTestComponentFactory(PlotsTablesHome);

let storeState = null;

const hiddenPlotNames = [...spatialPlotNames];
const shownPlotNames = Object.values(plotNames).filter((name) => !hiddenPlotNames.includes(name));

describe('Plots and Tables page', () => {
  beforeEach(() => {
    storeState = makeStore();
  });

  it('contains all the single-cell plot tiles by default', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {plotsAndTablesPageFactory()}
        </Provider>,
      );
    });

    shownPlotNames.forEach((name) => {
      expect(screen.getByText(new RegExp(name, 'i'))).toBeInTheDocument();
    });

    hiddenPlotNames.forEach((name) => {
      expect(screen.queryByText(new RegExp(name, 'i'))).toBeNull();
    });
  });
});
