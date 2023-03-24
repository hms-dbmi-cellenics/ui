import { render, screen } from '@testing-library/react';

import EditableField from 'components/EditableField';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';

import userEvent from '@testing-library/user-event';

const EditableFieldFactory = createTestComponentFactory(EditableField);

const renderEditableField = (props = {}) => render(EditableFieldFactory(props));

describe('EditableField', () => {
  it('renders correctly', () => {
    renderEditableField({ value: 'Cluster X' });

    expect(screen.getByText('Cluster X')).toBeInTheDocument();

    expect(screen.getByLabelText('Edit')).toBeInTheDocument();

    expect(screen.queryByLabelText('Input')).toBeNull();
    expect(screen.queryByLabelText('Save')).toBeNull();
    expect(screen.queryByLabelText('Cancel')).toBeNull();
  });

  it('The user can toggle between editing mode and non-editing mode', () => {
    const mockOnEdit = jest.fn();
    renderEditableField({ value: 'Cluster X', onEdit: mockOnEdit });

    // click the edit button
    userEvent.click(screen.getByLabelText('Edit'));

    // There should be an input now.
    expect(screen.getByLabelText('Input')).toBeInTheDocument();

    // There should also be Save and Cancel buttongs
    expect(screen.getByLabelText('Save')).toBeInTheDocument();
    expect(screen.getByLabelText('Cancel')).toBeInTheDocument();

    // Edit button shoud disappear
    expect(screen.queryByLabelText('Edit')).toBeNull();

    // The user can click the cancel button.
    userEvent.click(screen.getByLabelText('Cancel'));

    // The input element should be gone
    expect(screen.queryByLabelText('Input')).toBeNull();

    // onEdit should not have been called.
    expect(mockOnEdit).toHaveBeenCalledTimes(0);
  });

  it('Editable field updates changed text on clicking save', () => {
    const mockOnSubmit = jest.fn();

    renderEditableField({ value: 'Cluster X', onAfterSubmit: mockOnSubmit });

    // click the edit button
    userEvent.click(screen.getByLabelText('Edit'));

    // Edit the input
    userEvent.type(screen.getByLabelText('Input'), '{selectall}{backpace}new name');

    // The user can click the save button.
    userEvent.click(screen.getByLabelText('Save'));

    // The input element should be gone
    expect(screen.queryByLabelText('Input')).toBeNull();

    // onSubmit should be called.
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('new name');
  });

  it('Editable field updates changed text on pressing Enter', () => {
    const mockOnSubmit = jest.fn();

    renderEditableField({ value: 'Cluster X', onAfterSubmit: mockOnSubmit });

    // click the edit button
    userEvent.click(screen.getByLabelText('Edit'));

    // Edit the input and presses enter
    userEvent.type(screen.getByLabelText('Input'), '{selectall}{backpace}new name{enter}');

    // The input element should be gone
    expect(screen.queryByLabelText('Input')).toBeNull();

    // onSubmit should be called.
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('new name');
  });

  it('Editable field does not update changed text on cancel', () => {
    const mockOnSubmit = jest.fn();

    renderEditableField({ value: 'Cluster X', onAfterSubmit: mockOnSubmit });

    // click the edit button
    userEvent.click(screen.getByLabelText('Edit'));

    // Edit the input and presses enter
    userEvent.type(screen.getByLabelText('Input'), '{selectall}{backpace}new name');

    // Click the cancel button
    userEvent.click(screen.getByLabelText('Cancel'));

    // The input element should be gone
    expect(screen.queryByLabelText('Input')).toBeNull();

    // onSubmit should be called.
    expect(mockOnSubmit).toHaveBeenCalledTimes(0);
  });

  it('Editable field does not update changed text on hitting escape', () => {
    const mockOnSubmit = jest.fn();

    renderEditableField({ value: 'Cluster X', onAfterSubmit: mockOnSubmit });

    // click the edit button
    userEvent.click(screen.getByLabelText('Edit'));

    // Edit the input and presses escape
    userEvent.type(screen.getByLabelText('Input'), '{selectall}{backpace}new name{esc}');

    // The input element should be gone
    expect(screen.queryByLabelText('Input')).toBeNull();

    // onSubmit should be called.
    expect(mockOnSubmit).toHaveBeenCalledTimes(0);
  });

  it('The onDelete callback should trigger on delete.', () => {
    const mockOnDelete = jest.fn();

    renderEditableField({ value: 'Cluster X', onDelete: mockOnDelete });

    // click the delete button
    userEvent.click(screen.getByLabelText('Delete'));

    // onDelete should be called.
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('onEditing should reflect editing state.', () => {
    const mockOnEditing = jest.fn().mockImplementation((editing) => editing);

    renderEditableField({ value: 'Cluster X', onEditing: mockOnEditing });

    // click the edit button
    userEvent.click(screen.getByLabelText('Edit'));

    // click the save button
    userEvent.click(screen.getByLabelText('Save'));

    // click the edit button
    userEvent.click(screen.getByLabelText('Edit'));

    // click the cancel button
    userEvent.click(screen.getByLabelText('Cancel'));

    // The callback should have been called, returning editing state true
    expect(mockOnEditing).toHaveBeenCalledTimes(5);

    // First call is when component is initializing
    expect(mockOnEditing.mock.results[0].value).toBe(false);

    // True on first open
    expect(mockOnEditing.mock.results[1].value).toBe(true);

    // False on saving
    expect(mockOnEditing.mock.results[2].value).toBe(false);

    // True on second open
    expect(mockOnEditing.mock.results[3].value).toBe(true);

    // False on close by cancel
    expect(mockOnEditing.mock.results[4].value).toBe(false);
  });

  it('formatter works correctly', async () => {
    const mockFormatter = jest.fn((value) => `formatted${value}`);
    const mockOnAfterSubmit = jest.fn();

    renderEditableField({ value: 'Cluster X', formatter: mockFormatter, onAfterSubmit: mockOnAfterSubmit });

    // Starts with original value
    expect(screen.getByText('Cluster X')).toBeInTheDocument();

    // click the edit button
    userEvent.click(screen.getByLabelText('Edit'));

    // Write new text
    userEvent.type(screen.getByLabelText('Input'), '{selectall}{backpace}ImNotFormatted');

    // save new text
    userEvent.click(screen.getByLabelText('Save'));

    // New text is sent
    expect(mockOnAfterSubmit).toHaveBeenCalledWith('formattedImNotFormatted');
  });
});
