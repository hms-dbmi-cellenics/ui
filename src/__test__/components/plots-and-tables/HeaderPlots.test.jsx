import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import * as rtl from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { initialPlotConfigStates } from '../../../redux/reducers/componentConfig/initialState';
import PlotHeader from '../../../components/plots/PlotHeader';
import { LOAD_CONFIG } from '../../../redux/actionTypes/componentConfig';
import '__test__/test-utils/setupTests';

enableFetchMocks();
const mockStore = configureMockStore([thunk]);

describe('Tests for the header in plots and tables ', () => {
  const initialConfig = initialPlotConfigStates.embeddingContinuous;

  const store = mockStore({
    componentConfig: {
      embeddingContinuousMain: {
        config: {
          ...initialConfig,
          axes: {
            ...initialConfig.axes,
            yAxisText: 'Changed value lol',
          },
        },
        plotType: 'embeddingContinuous',
      },
    },
  });

  beforeAll(async () => {
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({ something: 'some value' }));
    rtl.render(
      <Provider store={store}>
        <PlotHeader
          experimentId='a'
          plotUuid='embeddingContinuousMain'
        />
      </Provider>,
    );
  });

  it('Reset button resets to default config', async () => {
    const reset = await rtl.screen.findByText('Reset');
    userEvent.click(reset);
    expect(store.getActions()[0].type).toEqual(LOAD_CONFIG);
    expect(store.getActions()[0].payload.config).toEqual(initialConfig);
  });
});
