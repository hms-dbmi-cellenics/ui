import React from 'react';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import EditableField from '../../components/EditableField';

configure({ adapter: new Adapter() });

const eventStub = {
  stopPropagation: () => { },
};

describe('EditableField', () => {
  test('renders correctly', () => {
    const component = mount(<EditableField value='Cluster X' />);
    const buttons = component.find('Button');
    expect(component.getElement().props.value).toEqual('Cluster X');
    expect(buttons.length).toEqual(2);
  });

  test('The user can toggle between editing mode and non-editing mode', () => {
    const mockOnEdit = jest.fn();
    const component = shallow(<EditableField value='Cluster X' onEdit={mockOnEdit} />);

    // No input should show now.
    let input = component.find('Input');
    expect(input.length).toEqual(0);

    // click the edit button
    component.find('Button').at(0).simulate('click', eventStub);
    component.update();

    // There should be an input now.
    input = component.find('Input');
    expect(input.length).toEqual(1);

    // It should be in focus
    expect(input.getElement().props.autoFocus).toEqual(true);

    // There should also be three buttons now.
    expect(component.find('Button').length).toEqual(3);

    // The user can click the cancel button.
    component.find('Button').at(1).simulate('click', eventStub);
    component.update();

    // The input should be gone.
    input = component.find('Input');
    expect(input.length).toEqual(0);

    // onEdit should not have been called.
    expect(mockOnEdit).toHaveBeenCalledTimes(0);
  });

  test('Editable field updates changed text on clicking save', () => {
    const mockOnSubmit = jest.fn();
    const component = shallow(<EditableField value='Cluster X' onAfterSubmit={mockOnSubmit} />);

    // click the edit button
    component.find('Button').at(0).simulate('click', eventStub);
    component.update();

    // Edit the input
    component.find('Input').simulate('change', { target: { value: 'new name' } });

    // Click save
    component.find('Button').at(0).simulate('click', eventStub);
    component.update();

    // No input should show
    expect(component.find('Input').length).toEqual(0);

    // onEdit should have been called with new data
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('new name');
  });

  test('Editable field updates changed text on pressing Enter', () => {
    const mockOnSubmit = jest.fn();
    const component = shallow(<EditableField value='Cluster X' onAfterSubmit={mockOnSubmit} />);

    // click the edit button
    component.find('Button').at(0).simulate('click', eventStub);
    component.update();

    // Edit the input
    component.find('Input').simulate('change', { target: { value: 'new name' } });

    // Hit enter
    component.find('Input').simulate('keydown', { key: 'Enter', ...eventStub });

    // No input should show
    expect(component.find('Input').length).toEqual(0);

    // onEdit should have been called with new data
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('new name');
  });

  test('Editable field does not update changed text on cancel', () => {
    const mockOnSubmit = jest.fn();
    const component = shallow(<EditableField value='Cluster X' onAfterSubmit={mockOnSubmit} />);

    // click the edit button
    component.find('Button').at(0).simulate('click', eventStub);
    component.update();

    // Edit the input
    component.find('Input').simulate('change', { target: { value: 'new name' } });

    // Click cancel
    component.find('Button').at(1).simulate('click', eventStub);
    component.update();

    // No input should show
    expect(component.find('Input').length).toEqual(0);

    // onEdit should not have been called
    expect(mockOnSubmit).toHaveBeenCalledTimes(0);
  });

  test('Editable field does not update changed text on hitting escape', () => {
    const mockOnSubmit = jest.fn();
    const component = shallow(<EditableField value='Cluster X' onAfterSubmit={mockOnSubmit} />);

    // click the edit button
    component.find('Button').at(0).simulate('click', eventStub);
    component.update();

    // Edit the input
    component.find('Input').simulate('change', { target: { value: 'new name' } });

    // Hit escape
    component.find('Input').simulate('keydown', { key: 'Escape', ...eventStub });

    // No input should show
    expect(component.find('Input').length).toEqual(0);

    // onEdit should not have been called
    expect(mockOnSubmit).toHaveBeenCalledTimes(0);
  });

  test('The onDelete callback should trigger on delete.', () => {
    const mockOnDelete = jest.fn();

    const component = shallow(<EditableField value='Cluster X' onDelete={mockOnDelete} />);

    // Click delete button.
    component.find('Button').at(1).simulate('click', eventStub);
    component.update();

    // The callback should have been called
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });
});
