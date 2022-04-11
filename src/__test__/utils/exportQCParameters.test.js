import {
  exportQCParameters,
  filterQCParameters,
} from '../../utils/data-management/exportQCParameters';
import { qcSteps } from '../../utils/qcSteps';

describe('Export of QC parameters', () => {
  const projectSamples = ['sample1'];

  const samplesStore = {
    sample1: { name: 'WT1' },
  };

  const processingConfig = {
    cellSizeDistribution: {
      sample1: {
        auto: true,
        filterSettings: {
          blah: true,
        },
      },
    },

    dataIntegration: {
      dataIntegration: {
        method: 'harmony',
        methodSettings: {
          harmony: {
            blah: true,
          },
          'unused method': {},
        },
      },
    },

    configureEmbedding: {},
  };

  const filteredConfig = {
    cellSizeDistribution: {
      WT1: {
        blah: true,
      },
    },

    dataIntegration: {
      dataIntegration: {
        method: 'harmony',
        blah: true,
      },
    },

    configureEmbedding: {},
  };

  // eslint-disable-next-line operator-linebreak
  const exportedConfig =
`[${qcSteps.indexOf('cellSizeDistribution') + 1}-cellSizeDistribution.WT1]
blah = true

[${qcSteps.indexOf('dataIntegration') + 1}-dataIntegration.dataIntegration]
method = harmony
blah = true
`;

  it('filterQcParameters works', () => {
    expect(filterQCParameters(processingConfig, projectSamples, samplesStore))
      .toEqual(filteredConfig);
  });

  it('exportQcParameters works', async () => {
    const filtered = filterQCParameters(processingConfig, projectSamples, samplesStore);

    const blob = exportQCParameters(filtered);

    expect(blob)
      .toBeInstanceOf(Blob);

    await new Response(blob).text().then((text) => {
      expect(text)
        .toEqual(exportedConfig);
    });
  });
});
