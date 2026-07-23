import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { makeStore } from 'redux/store';
import AnnotateClustersTool from 'components/data-exploration/cell-sets-tool/AnnotateClustersTool';
import { runCassiaAnnotation } from 'redux/actions/cellSets';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import fake from '__test__/test-utils/constants';

jest.mock('redux/actions/cellSets', () => ({
  __esModule: true,
  runCellSetsAnnotation: jest.fn(() => () => {}),
  runCassiaAnnotation: jest.fn(() => () => {}),
}));

const experimentId = fake.EXPERIMENT_ID;
const AnnotateClustersToolFactory = createTestComponentFactory(
  AnnotateClustersTool,
  { experimentId, onRunAnnotation: jest.fn() },
);

const renderTool = () => render(
  <Provider store={makeStore()}>
    {AnnotateClustersToolFactory()}
  </Provider>,
);

describe('AnnotateClustersTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to CASSIA and shows the additional-context input', () => {
    renderTool();

    expect(screen.getByRole('radio', { name: 'CASSIA' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'ScType' })).not.toBeChecked();
    // CASSIA-only free-text context box is present
    expect(screen.getByText(/Additional context/i)).toBeInTheDocument();
  });

  it('sends the entered context to runCassiaAnnotation on confirm', async () => {
    renderTool();

    userEvent.type(screen.getByPlaceholderText(/Large Intestine/i), 'Large Intestine');
    userEvent.type(screen.getByPlaceholderText(/e\.g\. Human/i), 'Human');
    userEvent.type(
      screen.getByPlaceholderText(/colorectal tumor/i),
      '3 tumor, 2 normal',
    );

    userEvent.click(screen.getByRole('button', { name: /Compute/i }));

    // Confirmation modal opens; it names Amazon Bedrock (appears in both the
    // alert title and body, so assert the unique modal title).
    await waitFor(() => {
      expect(screen.getByText(/Confirm CASSIA annotation/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Amazon Bedrock/i).length).toBeGreaterThan(0);

    userEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(runCassiaAnnotation).toHaveBeenCalledWith(
        experimentId, 'Human', 'Large Intestine', '3 tumor, 2 normal',
      );
    });
  });
});
