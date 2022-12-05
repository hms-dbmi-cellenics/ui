import {
  render, screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SubsetCellSetsModal from 'components/data-exploration/cell-sets-tool/SubsetCellSetsModal';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

const mockExperimentName = 'mock experiment name';

const onOk = jest.fn();
const onCancel = jest.fn();

const defaultProps = {
  experimentName: mockExperimentName,
  onOk,
  onCancel,
};

const subsetCellSetsModalFactory = createTestComponentFactory(SubsetCellSetsModal, defaultProps);

describe('SubsetCellSetsModal', () => {
  it('Should render properly', () => {
    render(subsetCellSetsModalFactory());

    // Informational text exists
    expect(
      screen.getByText(/This action will create a new project containing cells only from the selected cell sets./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/New project name/i)).toBeInTheDocument();

    // Check buttons are available
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();

    const expectedInputValue = `Subset of ${mockExperimentName}`;

    const input = screen.getByLabelText('Subset experiment name');

    expect(input.value).toEqual(expectedInputValue);
  });

  it('Should pass the experiment value correctly', () => {
    render(subsetCellSetsModalFactory());

    const input = screen.getByLabelText('Subset experiment name');

    const testExperimentName = 'test experiment';

    userEvent.clear(input);
    userEvent.type(input, testExperimentName);

    expect(input.value).toEqual(testExperimentName);

    userEvent.click(screen.getByText('Create'));

    expect(onOk).toHaveBeenCalledTimes(1);
    expect(onOk).toBeCalledWith(testExperimentName);
  });

  it('Should not create a new experiment when cancel is called', () => {
    render(subsetCellSetsModalFactory());

    userEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
