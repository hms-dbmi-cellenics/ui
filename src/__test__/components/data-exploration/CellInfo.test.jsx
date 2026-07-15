import React from 'react';
import { render, screen } from '@testing-library/react';
import CellInfo from 'components/data-exploration/CellInfo';

const cellInfo = {
  cellId: 1904,
  expression: 0,
  geneName: 'DOK3',
  cellSets: ['Louvain : cluster1', 'anotherRootCluster : cluster2'],
};

const coordinates = { x: 100, y: 200 };

// each tooltip line renders as "<bold label> value", so the label and value are
// separate text nodes — match them individually
const lineWithLabelAndValue = (label, value) => (
  (content, node) => node?.textContent === `${label} ${value}`
);

describe('CellInfo', () => {
  it('renders cell info card with properties', () => {
    render(
      <CellInfo
        containerWidth={500}
        containerHeight={500}
        coordinates={coordinates}
        cellInfo={cellInfo}
      />,
    );
    expect(screen.getByText(lineWithLabelAndValue('Cell id:', cellInfo.cellId))).toBeInTheDocument();
    expect(screen.getByText(lineWithLabelAndValue('Gene name:', cellInfo.geneName))).toBeInTheDocument();
    expect(
      screen.getByText(lineWithLabelAndValue('Expression Level:', cellInfo.expression)),
    ).toBeInTheDocument();
    // cell-set entries split into a bold "Parent :" label + value
    expect(screen.getByText('cluster1')).toBeInTheDocument();
    expect(screen.getByText('cluster2')).toBeInTheDocument();
  });

  it('renders category labels in bold', () => {
    render(
      <CellInfo
        containerWidth={500}
        containerHeight={500}
        coordinates={coordinates}
        cellInfo={cellInfo}
      />,
    );
    const label = screen.getByText('Cell id:');
    expect(label.tagName).toBe('SPAN');
    expect(label).toHaveStyle({ fontWeight: 600 });
  });
});
