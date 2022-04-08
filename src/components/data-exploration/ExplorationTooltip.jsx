import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import _ from 'lodash';

import CellInfo from 'components/data-exploration/CellInfo';
import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';
import { getCellSetsHierarchyByType, getCellSets } from 'redux/selectors';

const ExplorationTooltip = () => {
  const cellCoordinates = useRef({ x: 0, y: 0 });
  const cellInfoTooltip = useRef(null);

  const {
    cellId,
    geneName,
    trackCluster,
    focus,
  } = useSelector((state) => state.cellInfo);

  const cellSets = useSelector(getCellSets());
  const rootClusterNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => key);

  const geneExpression = useSelector((state) => state.genes.expression.data);

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

    // getting the cluster properties for the cluster in searchCellsets
    const searchCellSets = trackCluster?.length ? trackCluster : rootClusterNodes;
    const cellProperties = getContainingCellSetsProperties(Number.parseInt(cellId, 10), searchCellSets, cellSets);

    const prefixedCellSetNames = [];
    Object.values(cellProperties).forEach((clusterProperties) => {
      clusterProperties.forEach(({ name, parentNodeKey }) => {
        prefixedCellSetNames.push(`${_.capitalize(cellSets.properties[parentNodeKey].name)}: ${name}`);
      });
    });

    let gene = null;
    let expressionName = geneName;
    if (geneName) {
      gene = geneExpression[geneName];
    } else if (focus.store === 'genes') {
      expressionName = focus.key;
      gene = geneExpression[expressionName];
    }

    cellInfoTooltip.current = {
      cellId,
      cellSets: prefixedCellSetNames,
      expression: gene?.rawExpression.expression[cellId],
      geneName: expressionName,
    };
  }, [cellId]);

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, zIndex: 1e10,
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

export default ExplorationTooltip;
