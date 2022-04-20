import React from 'react';
import { render, screen } from '@testing-library/react';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import SingleTileContainer from 'components/SingleTileContainer';

const defaultProps = {
  children: <div>Test component</div>,
};

const singleTileContainerFactory = createTestComponentFactory(SingleTileContainer, defaultProps);

const renderSingleTileContainer = (props) => render(singleTileContainerFactory(props));

describe('SingleTileContainer', () => {
  it('Renders properly', () => {
    renderSingleTileContainer();

    expect(screen.getByText('Test component')).toBeInTheDocument();

    // Does not display title by default
    expect(screen.queryByText('Test title')).toBeNull();
  });

  it('Display a header title if provided', () => {
    const componentTitle = {
      title: 'Test title',
    };

    renderSingleTileContainer(componentTitle);

    expect(screen.getByText('Test title')).toBeInTheDocument();
  });
});
