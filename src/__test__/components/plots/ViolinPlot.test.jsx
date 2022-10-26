import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Provider } from 'react-redux';
import { act } from 'react-dom/test-utils';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import '__test__/test-utils/setupTests';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { seekFromS3 } from 'utils/work/seekWorkResponse';
import expressionDataFAKEGENE from '__test__/data/gene_expression_FAKEGENE.json';

import ViolinPlot from 'components/plots/ViolinPlot';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { makeStore } from 'redux/store';
import { loadCellSets } from 'redux/actions/cellSets';
import { loadGeneExpression } from 'redux/actions/genes';
import loadConditionalComponentConfig from 'redux/actions/componentConfig/loadConditionalComponentConfig';

import endUserMessages from 'utils/endUserMessages';

import _ from 'lodash';
import mockAPI, {
  generateDefaultMockAPIResponses,
  statusResponse,
} from '__test__/test-utils/mockAPI';

import fake from '__test__/test-utils/constants';
import { plotTypes } from 'utils/constants';

// Mock hash so we can control the ETag that is produced by hash.MD5 when fetching work requests
// EtagParams is the object that's passed to the function which generates ETag in fetchWork
jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag').default;

  const mockWorkRequestETag = () => 'list-genes';
  const mockGeneExpressionETag = () => 'gene-expression';

  return mockWorkResultETag(objectHash, mockWorkRequestETag, mockGeneExpressionETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  dispatchWorkRequest: jest.fn(() => true),
  seekFromS3: jest.fn(),
}));

const mockWorkerResponses = {
  'list-genes': null,
  'gene-expression': expressionDataFAKEGENE,
};

const plotType = plotTypes.VIOLIN_PLOT;
const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'ViolinMain'; // At some point this will stop being hardcoded

const customAPIResponses = {
  [`/plots/${plotUuid}`]: () => statusResponse(404, 'Not found'),
};

const mockAPIResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
);

const defaultProps = {
  experimentId,
  plotUuid,
};

const violinPlotFactory = createTestComponentFactory(ViolinPlot, defaultProps);

const renderViolinPlot = async (storeState) => {
  await act(async () => {
    render(
      <Provider store={storeState}>
        {violinPlotFactory()}
      </Provider>,
    );
  });
};

let storeState = null;

describe('ViolinPlot', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    seekFromS3
      .mockReset()
      .mockImplementationOnce(() => null)
      .mockImplementationOnce((Etag) => mockWorkerResponses[Etag]);

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    storeState = makeStore();

    await storeState.dispatch(loadBackendStatus(experimentId));

    const customConfig = { shownGene: 'FAKEGENE' };
    await storeState.dispatch(
      loadConditionalComponentConfig(experimentId, plotUuid, plotType, false, customConfig),
    );

    const genesToLoad = ['FAKEGENE'];
    await act(async () => {
      await storeState.dispatch(loadGeneExpression(experimentId, genesToLoad, plotUuid));
    });
  });

  it('Shows a loader screen if cell sets are not loaded / still loading', async () => {
    await renderViolinPlot(storeState);

    expect(screen.getByText("We're getting your data ...")).toBeInTheDocument();
  });

  it('Renders a plot', async () => {
    await storeState.dispatch(loadCellSets(experimentId));

    await renderViolinPlot(storeState);

    expect(screen.getByRole('graphics-document', { name: 'Violin plot' })).toBeInTheDocument();
  });

  it('Shows an error if there is an error while loading cellSets', async () => {
    const errorResponse = {
      ...mockAPIResponses,
      [`experiments/${experimentId}/cellSets`]: () => statusResponse(500, 'Some random error'),
    };

    fetchMock.mockIf(/.*/, mockAPI(errorResponse));

    await storeState.dispatch(loadCellSets(experimentId));

    await renderViolinPlot(storeState);

    // No plot should be rendered
    expect(screen.queryByRole('graphics-document', { name: 'Violin plot' })).toBeNull();

    // Error message should be shown
    expect(screen.getByText(endUserMessages.ERROR_FETCHING_CELL_SETS)).toBeInTheDocument();

    const reloadButton = screen.getByText('Try again');
    userEvent.click(reloadButton);
  });
});
