import React from 'react';

import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { makeStore } from 'redux/store';

import '__test__/test-utils/mockWorkerBackend';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import PlotsTablesHome from 'pages/experiments/[experimentId]/plots-and-tables';
import { plotNames } from 'utils/constants';

const plotsAndTablesPageFactory = createTestComponentFactory(PlotsTablesHome);

let storeState = null;

describe('Data Management page', () => {
  beforeEach(() => {
    storeState = makeStore();
  });

  it('contains all the plot tiles', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {plotsAndTablesPageFactory()}
        </Provider>,
      );
    });

    Object.values(plotNames).forEach((name) => {
      expect(screen.getByText(new RegExp(name, 'i'))).toBeInTheDocument();
    });
  });
});
