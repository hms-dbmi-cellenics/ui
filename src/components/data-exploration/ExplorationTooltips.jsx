import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import _ from 'lodash';

import CellInfo from 'components/data-exploration/CellInfo';
import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';
import { getCellSetsHierarchyByType, getCellSets } from 'redux/selectors';

const ExplorationTooltips = () => {
  const cellCoordinates = useRef({ x: 0, y: 0 });
  const cellInfoTooltip = useRef(null);

  const {
    cellId,
    geneName,
    trackCluster,
  } = useSelector((state) => state.cellInfo);

  const cellSets = useSelector(getCellSets());
  const rootClusterNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => key);

  const focusedExpression = useSelector((state) => state.genes.expression.data[geneName]);

  useEffect(() => {
    document.addEventListener('mousemove', (e) => {
      cellCoordinates.current = {
        x: e.pageX,
        y: e.pageY,
      };
    });
  }, []);

  useEffect(() => {
    if (!cellId) return;

    // getting the cluster properties for every cluster that has the cellId
    const searchCellsets = trackCluster?.length ? trackCluster : rootClusterNodes;
    const cellProperties = getContainingCellSetsProperties(Number.parseInt(cellId, 10), searchCellsets, cellSets);

    const prefixedCellSetNames = [];
    Object.values(cellProperties).forEach((clusterProperties) => {
      clusterProperties.forEach(({ name, parentNodeKey }) => {
        prefixedCellSetNames.push(`${_.capitalize(cellSets.properties[parentNodeKey].name)}: ${name}`);
      });
    });

    cellInfoTooltip.current = {
      cellId,
      cellSets: prefixedCellSetNames,
      expression: focusedExpression?.rawExpression.expression[cellId],
      geneName,
    };
  }, [cellId]);

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, zIndex: 1000,
    }}
    >
      {
        cellId && cellInfoTooltip.current ? (
          <CellInfo
            coordinates={cellCoordinates.current}
            cellInfo={cellInfoTooltip.current}
          />
        ) : <></>
      }
    </div>
  );
};

export default ExplorationTooltips;
