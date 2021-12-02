import calculateIdealNMarkerGenes from 'utils/calculateIdealNMarkerGenes';

describe('calculateIdealNMarkerGenes', () => {
  it('returns 2 marker genes on 120 clusters', () => {
    expect(calculateIdealNMarkerGenes(120)).toEqual(2);
  });

  it('returns 2 marker genes on more than 120 clusters', () => {
    expect(calculateIdealNMarkerGenes(1000)).toEqual(2);
  });

  it('returns 5 marker genes on 29 clusters', () => {
    expect(calculateIdealNMarkerGenes(29)).toEqual(5);
  });

  it('returns 5 marker genes on 1 cluster', () => {
    expect(calculateIdealNMarkerGenes(1)).toEqual(5);
  });

  it('returns 4 marker genes on 40 clusters', () => {
    expect(calculateIdealNMarkerGenes(40)).toEqual(4);
  });

  it('returns 3 marker genes on 80 clusters', () => {
    expect(calculateIdealNMarkerGenes(80)).toEqual(3);
  });
});
