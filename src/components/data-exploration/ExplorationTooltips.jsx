import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import CellInfo from 'components/data-exploration/CellInfo';
import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';
import { getCellSetsHierarchyByType, getCellSets } from 'redux/selectors';

const ExplorationTooltips = () => {
  const cellCoordinates = useRef(null);
  const cellInfoTooltip = useRef(null);

  const cellInfo = useSelector((state) => state.cellInfo);
  const selectedCell = useSelector((state) => state.cellInfo.cellId);
  const focusData = useSelector((state) => state.cellInfo.focus);
  const focusedExpression = useSelector((state) => state.genes.expression.data[focusData.key]);

  const cellSets = useSelector(getCellSets());
  const rootClusterNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => key);

  useEffect(() => {
    document.addEventListener('mousemove', (e) => {
      cellCoordinates.current = {
        x: e.pageX,
        y: e.pageY,
      };
    });
  }, []);

  useEffect(() => {
    if (selectedCell) {
      let expressionToDispatch;
      let geneName;

      if (focusedExpression) {
        geneName = focusData.key;
        expressionToDispatch = focusedExpression.rawExpression.expression[selectedCell];
      }

      // getting the cluster properties for every cluster that has the cellId
      const cellProperties = getContainingCellSetsProperties(Number.parseInt(selectedCell, 10), rootClusterNodes, cellSets);

      const prefixedCellSetNames = [];
      Object.values(cellProperties).forEach((clusterProperties) => {
        clusterProperties.forEach(({ name, parentNodeKey }) => {
          prefixedCellSetNames.push(`${cellSets.properties[parentNodeKey].name} : ${name}`);
        });
      });

      cellInfoTooltip.current = {
        cellId: selectedCell,
        cellSets: prefixedCellSetNames,
        expression: expressionToDispatch,
        geneName,
      };
    }
  }, [selectedCell]);

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, zIndex: 1000,
    }}
    >
      {cellInfo.cellId && cellInfoTooltip.current ? (
        <CellInfo
          coordinates={cellCoordinates}
          cellInfo={cellInfoTooltip.current}
        />
      ) : <></>}
    </div>
  );
};

export default ExplorationTooltips;
