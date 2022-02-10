import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { GENES_SELECT } from 'redux/actionTypes/genes';
import fake from '__test__/test-utils/constants';
import ExpressionCellSetModal from 'components/data-exploration/generic-gene-table/ExpressionCellSetModal';
import { makeStore } from 'redux/store';

describe('Create cell set modal', () => {
  let storeState;
  const selectedGenes = ['DOK3', 'DOK4'];

  beforeEach(async () => {
    storeState = makeStore();

    await storeState.dispatch({
      type: GENES_SELECT,
      payload: {
        experimentId: fake.EXPERIMENT_ID,
        genes: selectedGenes,
      },
    });
  });

  it('renders correctly', () => {
    const onCancel = jest.fn();
    render(<Provider store={storeState}><ExpressionCellSetModal onCancel={onCancel} /></Provider>);

    expect(screen.getAllByText('Create a new cell set based on gene expression')).toHaveLength(1);
    expect(screen.getByText('DOK3')).toBeInTheDocument();
    expect(screen.getByText('DOK4')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getAllByText('Greater than')).toHaveLength(2);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
    expect(screen.getAllByLabelText('close')[0]).toBeInTheDocument();
  });
});
