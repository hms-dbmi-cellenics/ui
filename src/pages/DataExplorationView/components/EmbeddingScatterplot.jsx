import React, { useEffect } from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies, import/extensions
import { Scatterplot } from 'vitessce/build-lib/es/production/scatterplot.min.js';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'vitessce/build-lib/es/production/static/css/index.css';

import { v4 as uuidv4 } from 'uuid';
import { connectionPromise } from '../../../components/content-wrapper/ContentWrapper';

const EmbeddingScatterplot = () => {
  const uuid = 'my-scatterplot';
  const view = { target: [0, 0, 0], zoom: 0.75 };
  const cells = {
    1: {
      mappings: {
        PCA: [2, 1],
      },
    },
    2: {
      mappings: {
        PCA: [5, 1],
      },
    },
    3: {
      mappings: {
        PCA: [6.5, 4],
      },
    },
    4: {
      mappings: {
        PCA: [6, 4.5],
      },
    },
    5: {
      mappings: {
        PCA: [5.5, 5],
      },
    },
    6: {
      mappings: {
        PCA: [0.5, 4],
      },
    },
    7: {
      mappings: {
        PCA: [1, 4.5],
      },
    },
    8: {
      mappings: {
        PCA: [1.5, 5],
      },
    },
    9: {
      mappings: {
        PCA: [2, 5.25],
      },
    },
    10: {
      mappings: {
        PCA: [5, 5.25],
      },
    },
    11: {
      mappings: {
        PCA: [4.5, 5.35],
      },
    },
    12: {
      mappings: {
        PCA: [3.5, 5.45],
      },
    },
    13: {
      mappings: {
        PCA: [2.5, 5.35],
      },
    },
  };
  const cellColors = null;
  const mapping = 'PCA';
  const selectedCellIds = new Set();
  // eslint-disable-next-line no-unused-vars
  const updateCellsHover = (hoverInfo) => { };
  // eslint-disable-next-line no-unused-vars
  const updateCellsSelection = (selectedIds) => { };
  // eslint-disable-next-line no-unused-vars
  const updateStatus = (message) => { };
  // eslint-disable-next-line no-unused-vars
  const updateViewInfo = (viewInfo) => { };
  // eslint-disable-next-line no-unused-vars
  const clearPleaseWait = (layerName) => { };

  useEffect(() => {
    connectionPromise().then((io) => {
      const requestUuid = uuidv4();

      const request = {
        uuid: requestUuid,
        socketId: io.id,
        experimentId: '5e959f9c9f4b120771249001',
        timeout: '2021-01-01T00:00:00Z',
        body: {
          name: 'GetEmbedding',
          type: 'pca',
        },
      };

      io.emit('WorkRequest', request);

      io.on(`WorkResponse-${requestUuid}`, (res) => {
        console.log(res);
      });
    });
  });

  return (
    <div className="vitessce-container vitessce-theme-light" style={{ height: '50vh', position: 'relative' }}>
      <Scatterplot
        uuid={uuid}
        view={view}
        cells={cells}
        mapping={mapping}
        selectedCellIds={selectedCellIds}
        cellColors={cellColors}
        updateStatus={updateStatus}
        updateCellsSelection={updateCellsSelection}
        updateCellsHover={updateCellsHover}
        updateViewInfo={updateViewInfo}
        clearPleaseWait={clearPleaseWait}
      />
    </div>
  );
};

export default EmbeddingScatterplot;
