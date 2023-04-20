import React from 'react';
import { mount } from 'enzyme';
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
});
