import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { loadGeneExpression } from 'redux/actions/genes';
import { renderCellSetColors, colorByGeneExpression } from 'utils/plotUtils';

/**
 * Shared cell-colouring logic for the deck.gl viewers (Embedding, SpatialViewer).
 *
 * On focus change it colours cells by the focused cell set, kicks off
 * gene-expression loading for a focused gene, or clears the colours. Once a
 * focused gene's expression has loaded it colours cells by that expression. Owns
 * the `cellColors` map so both viewers share one implementation.
 *
 * `colorInterpolator` differs per viewer (plasma vs purplered) and is passed in.
 * `onFocusChange` lets the caller react to a focus change (both viewers hide the
 * cell-info tooltip).
 *
 * @returns {[object, Function]} [cellColors, setCellColors]
 */
const useFocusCellColors = ({
  experimentId,
  focusData,
  cellSetHierarchy,
  cellSetProperties,
  expressionMatrix,
  expressionLoading,
  colorInterpolator,
  onFocusChange,
}) => {
  const dispatch = useDispatch();
  const [cellColors, setCellColors] = useState({});

  // Focus change (a cell set / gene / metadata got selected, or cleared); also
  // re-runs when the cell set properties or hierarchy change.
  useEffect(() => {
    const { store, key } = focusData;

    switch (store) {
      // genes/continuous: can't colour yet — wait for the expression to load in
      case 'genes':
        dispatch(loadGeneExpression(experimentId, [key], 'embedding'));
        break;
      // cell sets: colour directly from the hierarchy/properties
      case 'cellSets':
        setCellColors(renderCellSetColors(key, cellSetHierarchy, cellSetProperties));
        break;
      // no focus: clear all colours
      default:
        setCellColors({});
    }

    if (onFocusChange) onFocusChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusData, cellSetHierarchy, cellSetProperties]);

  // Focused gene's expression finished loading → colour cells by it.
  useEffect(() => {
    if (!expressionMatrix.geneIsLoaded(focusData.key)) return;

    const truncated = expressionMatrix.getTruncatedExpression(focusData.key);
    const { truncatedMin, truncatedMax } = expressionMatrix.getStats(focusData.key);
    setCellColors(colorByGeneExpression(truncated, colorInterpolator, truncatedMin, truncatedMax));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusData.key, expressionLoading]);

  return [cellColors, setCellColors];
};

export default useFocusCellColors;
