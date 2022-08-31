import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { makeStore } from 'redux/store';

import ExpressionCellSetModal from 'components/data-exploration/generic-gene-table/ExpressionCellSetModal';

import { GENES_SELECT } from 'redux/actionTypes/genes';
import { dispatchWorkRequest } from 'utils/work/seekWorkResponse';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { updateExperimentInfo } from 'redux/actions/experimentSettings';

import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';
import fake from '__test__/test-utils/constants';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';

enableFetchMocks();

const mockOnCancel = jest.fn();

jest.mock('utils/pushNotificationMessage');

jest.mock('utils/work/seekWorkResponse', () => ({
  seekFromS3: jest.fn(),
  dispatchWorkRequest: jest.fn(),
}));

const renderExpressionCellSetModal = async (storeState) => {
  await act(async () => {
    render(
      <Provider store={storeState}>
        <ExpressionCellSetModal onCancel={mockOnCancel} />
      </Provider>,
    );
  });
};

let storeState;
const selectedGenes = ['DOK3', 'DOK4'];
const experimentId = fake.EXPERIMENT_ID;

const createButtonText = /^Create$/i;
const loadingText = /Creating cell set.../i;

describe('ExpressionCellSetModal', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    storeState = makeStore();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId)));

    await storeState.dispatch({
      type: GENES_SELECT,
      payload: {
        experimentId,
        genes: selectedGenes,
      },
    });
    await storeState.dispatch(loadBackendStatus(experimentId));
    await storeState.dispatch(updateExperimentInfo({ experimentId }));
  });

  it('renders correctly', async () => {
    await renderExpressionCellSetModal(storeState);

    expect(screen.getAllByText('Create a new cell set based on gene expression')).toHaveLength(1);
    expect(screen.getByText('DOK3')).toBeInTheDocument();
    expect(screen.getByText('DOK4')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getAllByText('Greater than')).toHaveLength(2);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
    expect(screen.getAllByLabelText('close')[0]).toBeInTheDocument();
  });

  it('Sends the correct genes list with params', async () => {
    await renderExpressionCellSetModal(storeState);

    expect(screen.getByText(createButtonText).closest('button')).not.toBeDisabled();

    // Change the dropdown to less than
    act(() => {
      userEvent.click(screen.getAllByText('Greater than')[0]);
    });

    userEvent.click(screen.getByText('Less than'), undefined, { skipPointerEventsCheck: true });

    // Input another threshold value
    userEvent.type(screen.getAllByRole('spinbutton')[0], '{backspace}5');

    await act(async () => {
      userEvent.click(screen.getByText(createButtonText));
    });

    const requestParams = dispatchWorkRequest.mock.calls[0];
    expect(requestParams).toMatchSnapshot();
  });

  it('Modal closes on success', async () => {
    dispatchWorkRequest.mockImplementationOnce(() => new Promise((resolve) => {
      setTimeout(resolve(null), 2000);
    }));

    await renderExpressionCellSetModal(storeState);

    await act(async () => {
      userEvent.click(screen.getByText(createButtonText).closest('button'));
    });

    expect(screen.getByText(createButtonText)).not.toBeDisabled();
    expect(screen.queryByText(loadingText)).toBeNull();

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('Modal shows error notification and does not close on error', async () => {
    dispatchWorkRequest.mockImplementationOnce(() => Promise.reject(new Error('Some error')));

    await renderExpressionCellSetModal(storeState);

    await act(async () => {
      await userEvent.click(screen.getByText(createButtonText).closest('button'));
    });

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith('error', endUserMessages.ERROR_FETCHING_CELL_SETS);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });
});
