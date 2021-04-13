import _ from 'lodash';

/* eslint-disable no-param-reassign */
const generateSpec = (config, plotData) => {
  const legends = [];

  const numGroups = _.keys(plotData.groups).length;
  let plotWidth = Math.round(Math.min(100, 0.9 * (config.dimensions.width / numGroups)));
  plotWidth += (plotWidth % 2);

  return {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A set of violin plot depicting gene expression accross groupings.',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
    background: config.colour.toggleInvert,
    padding: 5,
    legends,
    signals: [
      {
        name: 'plotWidth',
        value: plotWidth,
      },
      {
        name: 'bandwidth',
        value: config.kdeBandwidth,
      },
    ],

    data: [
      {
        name: 'groupCfg',
        values: plotData.groups,
      },
      {
        name: 'cells',
        values: plotData.cells,
      },
      {
        name: 'density',
        source: 'cells',
        transform: [
          {
            type: 'kde',
            field: 'y',
            groupby: [
              'group',
            ],
            bandwidth: {
              signal: 'bandwidth',
            },
          },
        ],
      },
      {
        name: 'stats',
        source: 'cells',
        transform: [
          {
            type: 'aggregate',
            groupby: [
              'group',
            ],
            fields: [
              'y',
              'y',
              'y',
            ],
            ops: [
              'q1',
              'median',
              'q3',
            ],
            as: [
              'q1',
              'median',
              'q3',
            ],
          },
        ],
      },
    ],
    scales: [
      {
        name: 'layout',
        type: 'band',
        range: 'width',
        domain: {
          data: 'cells',
          field: 'group',
        },
      },
      {
        name: 'yscale',
        type: 'linear',
        range: 'height',
        round: true,
        domain: {
          data: 'cells',
          field: 'y',
        },
        zero: true,
        nice: true,
      },
      {
        name: 'xdensity',
        type: 'linear',
        range: [
          0,
          {
            signal: 'plotWidth',
          },
        ],
        domain: {
          data: 'density',
          field: 'density',
        },
      },
      {
        name: 'xrandom',
        type: 'linear',
        range: [
          {
            signal: '-plotWidth / 2',
          },
          {
            signal: 'plotWidth / 2',
          },
        ],
        domain: [0, 1],
      },
    ],
    axes: [
      {
        orient: 'left',
        scale: 'yscale',
        zindex: 1,
        title: config.normalised === 'normalised' ? 'Normalised Expression' : 'Raw Expression',
        titlePadding: 5,
        gridColor: { value: config.colour.masterColour },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.axes.gridWidth / 20) },
        tickColor: { value: config.colour.masterColour },
        offset: { value: config.axes.offset },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        labelColor: { value: config.colour.masterColour },
        titleFontSize: { value: config.axes.titleFontSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelFontSize },
      },
      {
        orient: 'bottom',
        scale: 'layout',
        zindex: 1,
        encode: {
          labels: {
            update: {
              text: {
                signal: "datum.value? data('groupCfg')[0][datum.value].name : ''",
              },
            },
          },
        },
      },
      /*
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: { value: config.axes.xAxisText },
        titleFont: { value: config.fontStyle.font },
        labelFont: { value: config.fontStyle.font },
        labelColor: { value: config.colour.masterColour },
        tickColor: { value: config.colour.masterColour },
        gridColor: { value: config.colour.masterColour },
        gridOpacity: { value: (config.axes.gridOpacity / 20) },
        gridWidth: { value: (config.gridWidth / 20) },
        offset: { value: config.axes.offset },
        titleFontSize: { value: config.axes.titleFontSize },
        titleColor: { value: config.colour.masterColour },
        labelFontSize: { value: config.axes.labelFontSize },
        domainWidth: { value: config.axes.domainWidth },
      },
      */
    ],
    marks: [
      {
        type: 'group',
        from: {
          facet: {
            data: 'density',
            name: 'violin',
            groupby: 'group',
          },
        },
        encode: {
          enter: {
            xc: {
              scale: 'layout',
              field: 'group',
              band: 0.5,
            },
            width: {
              signal: 'plotWidth',
            },
            height: {
              signal: 'height',
            },
          },
        },
        data: [
          {
            name: 'summaryOfGroup',
            source: 'stats',
            transform: [
              {
                type: 'filter',
                expr: 'datum.group === parent.group',
              },
            ],
          },
          {
            name: 'cellsInGroup',
            source: 'cells',
            transform: [
              {
                type: 'filter',
                expr: 'datum.group === parent.group && isDefined(datum.x)',
              },
            ],
          },
        ],
        marks: [
          {
            type: 'area',
            orient: 'horizontal',
            from: {
              data: 'violin',
            },
            encode: {
              enter: {
                orient: {
                  value: 'horizontal',
                },
                fill: {
                  signal: "data('groupCfg')[0][parent.group].color",
                },
              },
              update: {
                y: {
                  scale: 'yscale',
                  field: 'value',
                },
                xc: {
                  signal: 'plotWidth / 2',
                },
                width: {
                  scale: 'xdensity',
                  field: 'density',
                },
              },
            },
          },
          {
            type: 'rect',
            from: {
              data: 'summaryOfGroup',
            },
            encode: {
              enter: {
                fill: {
                  value: 'black',
                },
                width: {
                  value: 2,
                },
              },
              update: {
                y: {
                  scale: 'yscale',
                  field: 'q1',
                },
                y2: {
                  scale: 'yscale',
                  field: 'q3',
                },
                xc: {
                  signal: 'plotWidth / 2',
                },
              },
            },
          },
          {
            type: 'rect',
            from: {
              data: 'summaryOfGroup',
            },
            encode: {
              enter: {
                fill: {
                  value: 'black',
                },
                width: {
                  value: 8,
                },
                height: {
                  value: 2,
                },
              },
              update: {
                y: {
                  scale: 'yscale',
                  field: 'median',
                },
                xc: {
                  signal: 'plotWidth / 2',
                },
              },
            },
          },
          {
            type: 'symbol',
            from: {
              data: 'cellsInGroup',
            },
            encode: {
              update: {
                shape: {
                  value: 'circle',
                },
                x: {
                  scale: 'xrandom',
                  field: 'x',
                  // mult: { signal: 'plotWidth' },
                  offset: { signal: 'plotWidth / 2' },
                },
                y: {
                  scale: 'yscale',
                  field: 'y',
                },
                size: {
                  value: 5,
                },
                strokeWidth: {
                  value: 0,
                },
                opacity: {
                  value: 1,
                },
                fill: {
                  value: 'black',
                },
              },
            },
          },
          /*
          {
            type: 'symbol',
            from: {
              data: 'density',
            },
            encode: {
              update: {
                x: {
                  scale: 'xdensity',
                  field: 'density',
                },
                y: {
                  scale: 'yscale',
                  field: 'value',
                },
                shape: {
                  value: 'circle',
                },
                strokeWidth: {
                  value: 2,
                },
                opacity: {
                  value: 0.5,
                },
                stroke: {
                  value: 'blue',
                },
                fill: {
                  value: 'transparent',
                },
              },
            },
          },
          */
        ],
      },
    ],
    title:
    {
      text: { value: config.shownGene },
      color: { value: config.colour.masterColour },
      anchor: { value: config.title.anchor },
      font: { value: config.fontStyle.font },
      dx: { value: config.title.dx },
      fontSize: { value: config.title.fontSize },
    },
  };
};

const generateData = (
  cellSets,
  selectedExpression,
  groupingHierarchyId,
  displayId,
) => {
  /*
   groups: {
      group_id_1: {
        name: cellSet.properties[group_id_1].name,
        color: cellSet.properties[group_id_1].color,
      },
      ...
    },
    cells: [
      {
        group: group_id_1,
        y: selectedExpression[cellId],
        x: Math.random() // only if cell has to be displayed
      },
      ...
    ]
  */
  const groupIds = cellSets.hierarchy.find(
    (hierarchy) => hierarchy.key === groupingHierarchyId,
  ).children.map((child) => child.key);
  const properties = _.pick(cellSets.properties, groupIds);
  const groups = _.mapValues(properties, (prop) => ({ name: prop.name, color: prop.color }));

  const cells = [];
  if (displayId && displayId.includes('/')) {
    // eslint-disable-next-line prefer-destructuring
    displayId = displayId.split('/')[1];
  }
  const toDisplay = displayId && displayId !== 'All' ? cellSets.properties[displayId].cellIds : null;
  groupIds.forEach((groupId) => {
    properties[groupId].cellIds.forEach((cellId) => {
      const cell = {
        group: groupId,
        y: selectedExpression[cellId],
      };
      if (displayId) {
        if (displayId === 'All' || toDisplay.has(cellId)) {
          cell.x = Math.random();
        }
      }
      cells.push(cell);
    });
  });

  const plotData = {
    groups,
    cells,
  };
  return plotData;
};

export {
  generateSpec,
  generateData,
};
