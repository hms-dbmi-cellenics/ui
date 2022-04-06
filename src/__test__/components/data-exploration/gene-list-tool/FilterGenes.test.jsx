import React from 'react';
import { mount, configure } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Input, Select } from 'antd';
import FilterGenes from 'components/data-exploration/generic-gene-table/FilterGenes';
import '__test__/test-utils/setupTests';

const { Search } = Input;

describe('FilterGenes', () => {
  test('renders correctly', () => {
    const component = mount(<FilterGenes onFilter={jest.fn()} />);
    const select = component.find(Select);
    const search = component.find(Search);

    expect(select.length).toEqual(1);
    expect(search.length).toEqual(1);
  });

  test('sends correct search pattern on search', () => {
    const mockFilter = jest.fn();
    const component = mount(<FilterGenes onFilter={mockFilter} />);
    const search = component.find(Search);

    act(() => {
      search.getElement().props.onSearch('tgf');
    });

    expect(mockFilter).toHaveBeenCalledTimes(1);
    expect(mockFilter).toHaveBeenCalledWith({ filterOption: 'Contains', text: 'tgf' });
  });

  test('change selected search option', () => {
    const mockFilter = jest.fn();
    const component = mount(<FilterGenes onFilter={mockFilter} />);
    const select = component.find(Select);

    act(() => {
      select.getElement().props.onChange('Starts with');
    });

    component.update();
    const search = component.find(Search);
    act(() => {
      search.getElement().props.onSearch('tgf');
    });

    expect(mockFilter).toHaveBeenCalledTimes(2);
    expect(mockFilter).toHaveBeenNthCalledWith(1, { filterOption: 'Starts with', text: null });
    expect(mockFilter).toHaveBeenNthCalledWith(2, { filterOption: 'Starts with', text: 'tgf' });
  });
});
