import React from 'react';
import { render, screen } from '@testing-library/react';
import CellInfo from 'components/data-exploration/CellInfo';

const cellInfo = {
  cellId: 1904,
  expression: 0,
  geneName: 'DOK3',
  cellSets: ['Louvain : cluster1', 'anotherRootCluster : cluster2'],
};

const coordinates = {
  current: {
    x: 100,
    y: 200,
    width: 500,
    height: 500,
  },
};

describe('CellInfo', () => {
  it('renders cell info card with properties', () => {
    render(<CellInfo coordinates={coordinates} cellInfo={cellInfo} />);
    expect(screen.getByText('Gene name: DOK3')).toBeInTheDocument();
    expect(screen.getByText('Cell id: 1904')).toBeInTheDocument();
    expect(screen.getByText('Expression Level: 0')).toBeInTheDocument();
    expect(screen.getByText('Louvain : cluster1')).toBeInTheDocument();
    expect(screen.getByText('anotherRootCluster : cluster2')).toBeInTheDocument();
  });
});
