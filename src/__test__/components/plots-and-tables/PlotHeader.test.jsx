import React from 'react';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { plotNames } from 'utils/constants';
import { act } from 'react-dom/test-utils';
import fake from '__test__/test-utils/constants';
import { initialPlotConfigStates } from '../../../redux/reducers/componentConfig/initialState';
import PlotHeader from '../../../components/plots/PlotHeader';
import { LOAD_CONFIG } from '../../../redux/actionTypes/componentConfig';
import '__test__/test-utils/setupTests';

jest.mock('components/UserButton', () => () => <></>);

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
    experiments: { [fake.EXPERIMENT_ID]: {} },
  });

  beforeAll(async () => {
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({ something: 'some value' }));
    await act(async () => {
      render(
        <Provider store={store}>
          <PlotHeader
            title={plotNames.CONTINUOUS_EMBEDDING}
            subtitle='random sub'
            plotUuid='embeddingContinuousMain'
            extra={<></>}
          />
        </Provider>,
      );
    });
  });

  it('Reset button resets to default config', async () => {
    const reset = await screen.findByText('Reset');
    await act(async () => {
      userEvent.click(reset);
    });

    expect(store.getActions()[0].type).toEqual(LOAD_CONFIG);
    expect(store.getActions()[0].payload.config).toEqual(initialConfig);
  });
});
