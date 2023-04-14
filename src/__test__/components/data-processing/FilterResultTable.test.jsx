import React from 'react';
import { Table, Empty } from 'antd';
import { mount } from 'enzyme';

import FilterResultTable from 'components/data-processing/FilterResultTable';

const correctInput = {
  after: {
    row1: 1,
    row2: 2,
    row3: 3,
  },
  before: {
    row1: 2,
    row2: 3,
    row3: 4,
  },
};

describe('FilterResultTable', () => {
  it('Should show Empty if passed empty or incorrect input', () => {
    const emptyInput = [];

    let component = mount(
      <FilterResultTable tableData={emptyInput} />,
    );

    let table = component.find(Table);
    let empty = component.find(Empty);

    // No table, and show an empty component
    expect(table.length).toBe(0);
    expect(empty.length).toBe(1);

    const incorrectInput = {
      key1: {},
      key2: {},
    };

    component = mount(
      <FilterResultTable tableData={incorrectInput} />,
    );

    table = component.find(Table);
    empty = component.find(Empty);

    // No table, and show an empty component
    expect(table.length).toBe(0);
    expect(empty.length).toBe(1);
  });

  it('Should show a Table if passed the correct input', () => {
    const component = mount(
      <FilterResultTable tableData={correctInput} />,
    );

    const table = component.find(Table);

    // Check that table exists
    expect(table.length).toBe(1);
  });

  it('The table should have 4 columns, and n + 1 number of rows', () => {
    const component = mount(
      <FilterResultTable tableData={correctInput} />,
    );

    const numRows = Object.keys(correctInput.after).length;
    const table = component.find(Table);

    const headerRow = table.find('HeaderRow');
    const columns = headerRow.find('Cell');
    const bodyRow = table.find('BodyRow');

    // 4 columns : title, before, after, percent removed
    expect(columns.length).toBe(4);
    expect(headerRow.length + bodyRow.length).toBe(numRows + 1);
  });
});
