import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { Input, Select } from 'antd';
import FilterGenes from 'components/data-exploration/generic-gene-table/FilterGenes';
import '__test__/test-utils/setupTests';

Enzyme.configure({ adapter: new Adapter() });

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
