import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import { act } from 'react-dom/test-utils';
import { Input, Select } from 'antd';
import FilterGenes from '../../../../../pages/data-exploration/components/gene-list-tool/FilterGenes';

jest.mock('localforage');

const { Search } = Input;

describe('FilterGenes', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  test('renders correctly', () => {
    const component = mount(<FilterGenes filterGenes={jest.fn()} />);
    const select = component.find(Select);
    const search = component.find(Search);

    expect(select.length).toEqual(1);
    expect(search.length).toEqual(1);
  });

  test('sends correct search pattern on search', () => {
    const mockFilter = jest.fn();
    const component = mount(<FilterGenes filterGenes={mockFilter} />);
    const search = component.find(Search);

    search.getElement().props.onSearch('tgf');

    expect(mockFilter).toHaveBeenCalledTimes(1);
    expect(mockFilter).toHaveBeenCalledWith('%tgf%');
  });

  test('change selected search option', () => {
    const mockFilter = jest.fn();
    const component = mount(<FilterGenes filterGenes={mockFilter} />);
    const select = component.find(Select);

    act(() => {
      select.getElement().props.onChange('Starts with');
    });

    component.update();
    const search = component.find(Search);
    search.getElement().props.onSearch('tgf');

    expect(mockFilter).toHaveBeenCalledTimes(1);
    expect(mockFilter).toHaveBeenCalledWith('tgf%');
  });

  configure({ adapter: new Adapter() });
});
