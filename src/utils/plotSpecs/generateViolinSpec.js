import _ from 'lodash';

/* eslint-disable no-param-reassign */
const generateSpec = (config, plotData) => {
  const numGroups = _.keys(plotData.groups).length;
  let plotWidth = Math.round(Math.min(100, 0.9 * (config.dimensions.width / numGroups)));
  plotWidth += (plotWidth % 2);

  const spec = {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A set of violin plot depicting gene expression accross groupings.',
    width: config.dimensions.width,
    height: config.dimensions.height,
    autosize: { type: 'fit', resize: true },
    background: config.colour.toggleInvert,
    padding: 5,
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
        title: config.axes.yAxisText ? config.axes.yAxisText : (config.normalised === 'normalised' ? 'Normalised Expression' : 'Raw Expression'),
        titlePadding: 5,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.axes.gridWidth / 20),
        tickColor: config.colour.masterColour,
        offset: config.axes.offset,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
      },
      {
        orient: 'bottom',
        scale: 'layout',
        zindex: 1,
        title: config.axes.xAxisText ? config.axes.xAxisText : plotData.settings.groupingName,
        titlePadding: 5,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.axes.gridWidth / 20),
        tickColor: config.colour.masterColour,
        offset: config.axes.offset,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
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
                  offset: { signal: 'plotWidth / 2' },
                },
                y: {
                  scale: 'yscale',
                  field: 'y',
                },
                size: {
                  value: config.marker.size,
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
                fillOpacity: {
                  value: config.marker.opacity / 10,
                },
              },
            },
          },
        ],
      },
    ],
    title:
    {
      text: config.title.text ? config.title.text : config.shownGene,
      color: config.colour.masterColour,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: config.title.dx,
      fontSize: config.title.fontSize,
    },
  };
  // So far, signals cannot be used to hide stuff
  //   https://github.com/vega/vega/issues/1153
  // so we remove the stuff to be hidden by changing the spec

  if (!config.selectedPointsVisible) {
    spec.marks[0].marks = spec.marks[0].marks.filter((mark) => mark.from.data !== 'cellsInGroup');
  }
  if (!config.statisticsVisible) {
    spec.marks[0].marks = spec.marks[0].marks.filter((mark) => mark.from.data !== 'summaryOfGroup');
  }

  if (config?.legend.enabled) {
    const positionIsRight = config.legend.position === 'right';

    const legendColumns = positionIsRight ? 1 : Math.floor(config.dimensions.width / 85);
    const labelLimit = positionIsRight ? 0 : 85;
    if (positionIsRight) {
      const plotWidthIndex = spec.signals.findIndex((item) => item.name === 'plotWidth');
      spec.signals[plotWidthIndex].value = plotWidth * 0.85;
    }

    const groups = _.keys(plotData.groups);
    const groupNames = groups.map((id) => plotData.groups[id].name);
    const groupColors = groups.map((id) => plotData.groups[id].color);
    spec.scales.push({
      name: 'legend',
      type: 'ordinal',
      range: groupColors,
      domain: groupNames,
    });
    spec.legends = [
      {
        fill: 'legend',
        type: 'symbol',
        symbolType: 'square',
        symbolSize: 200,
        orient: config?.legend.position,
        offset: 40,
        direction: 'horizontal',
        labelFont: config?.fontStyle.font,
        columns: legendColumns,
        labelLimit,
      },
    ];
  }

  return spec;
};

const generateData = (
  cellSets,
  selectedExpression,
  groupingHierarchyId,
  displayId,
) => {
  /*

  Format of the generated plotData:
  {
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
    ],
    settings: {
      groupingName: Name of the category used for grouping
    }
  }
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
      if (cell.y !== null) {
        cells.push(cell);
      }
    });
  });

  const plotData = {
    groups,
    cells,
    settings: { groupingName: cellSets.properties[groupingHierarchyId].name },
  };
  return plotData;
};

export {
  generateSpec,
  generateData,
};
