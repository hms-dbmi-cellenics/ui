import _ from 'lodash';

/* eslint-disable no-param-reassign */
const generateSpec = (config, plotData) => {
  const numGroups = _.keys(plotData.groups).length;
  let plotWidth = Math.round(Math.min(100, 0.9 * (config.dimensions.width / numGroups)));
  plotWidth += (plotWidth % 2);

  const yScaleDomain = config.axesRanges.yAxisAuto
    ? { data: 'cells', field: 'y' }
    : [config.axesRanges.yMin, config.axesRanges.yMax];

  const spec = {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'Violin plot',
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
        // Vega internally modifies objects during data transforms. If the plot data is frozen,
        // Vega is not able to carry out the transform and will throw an error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: {
          type: 'json',
          copy: true,
        },
      },
      {
        name: 'cells',
        values: plotData.cells,
        // Vega internally modifies objects during data transforms. If the plot data is frozen,
        // Vega is not able to carry out the transform and will throw an error.
        // https://github.com/vega/vega/issues/2453#issuecomment-604516777
        format: {
          type: 'json',
          copy: true,
        },
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
        domain: yScaleDomain,
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
        clip: true,
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
    const groups = _.keys(plotData.groups);
    const groupNames = groups.map((id) => plotData.groups[id].name);
    const groupColors = groups.map((id) => plotData.groups[id].color);

    const positionIsRight = config.legend.position === 'right';

    const legendColumns = positionIsRight
      ? Math.ceil(groups.length / 20)
      : Math.floor(config.dimensions.width / 85);
    const labelLimit = positionIsRight ? 0 : 85;
    if (positionIsRight) {
      const plotWidthIndex = spec.signals.findIndex((item) => item.name === 'plotWidth');
      spec.signals[plotWidthIndex].value = plotWidth * 0.85;
    }

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
        symbolType: 'circle',
        symbolSize: 100,
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
  rootNodeKey,
  cellSetToDisplayId,
) => {
  const shouldBeDisplayed = (
    (cellId) => (
      cellSets.properties[cellSetToDisplayId]?.cellIds.has(cellId))
      || cellSetToDisplayId === 'All'
  );

  // Format of the generated plotData:
  // {
  //   groups: {
  //     group_id_1: {
  //       name: cellSet.properties[group_id_1].name,
  //       color: cellSet.properties[group_id_1].color,
  //     },
  //     ...
  //   },
  //   cells: [
  //     {
  //       group: group_id_1,
  //       y: selectedExpression[cellId],
  //       x: Math.random() // only if cell has to be displayed
  //     },
  //     ...
  //   ],
  //   settings: {
  //     groupingName: Name of the category used for grouping
  //   }
  // }

  const cellSetsIds = cellSets.hierarchy.find(
    (hierarchy) => hierarchy.key === rootNodeKey,
  ).children.map((child) => child.key);

  const properties = _.pick(cellSets.properties, cellSetsIds);
  const groups = _.mapValues(properties, (prop) => ({ name: prop.name, color: prop.color }));

  const cells = [];
  if (cellSetToDisplayId && cellSetToDisplayId.includes('/')) {
    // eslint-disable-next-line prefer-destructuring
    cellSetToDisplayId = cellSetToDisplayId.split('/')[1];
  }

  cellSetsIds.forEach((cellSetId) => {
    const currentCellIds = Array.from(properties[cellSetId].cellIds);

    currentCellIds
      .filter(shouldBeDisplayed)
      .forEach((cellId) => {
        const cell = {
          group: cellSetId,
          y: selectedExpression[cellId],
        };

        cell.x = 0.25 + Math.random() / 2;

        if (cell.y !== null) {
          cells.push(cell);
        }
      });
  });

  const plotData = {
    groups,
    cells,
    settings: { groupingName: cellSets.properties[rootNodeKey].name },
  };
  return plotData;
};

export {
  generateSpec,
  generateData,
};
