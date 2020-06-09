const spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  description: 'A heatmap showing average daily temperatures in Seattle for each hour of the day.',
  width: 500,
  height: 500,
  data: [
    {
      name: 'cellNames',
      values: ['TAGACCAGTCGTCTTC-1-control', 'TTTGTCAGTGATAAGT-1-control', 'TGACTAGGTCCAACTA-1-control', 'TGGCCAGGTAAGGATT-1-control', 'CCGTGGAGTCGCGGTT-1-control', 'CCTATTAGTCCTGCTT-1-control', 'TGGCGCACAAACGCGA-1-control', 'GTAGTCACAGATCGGA-1-control', 'TCGTACCCATCATCCC-1-control', 'GCCTCTACAATCTACG-1-control', 'CGCGTTTTCGAGCCCA-1-control', 'ACGCCAGGTCTCCCTA-1-control', 'AGCTCTCGTACATGTC-1-control', 'GACCAATTCGGTGTCG-1-control', 'GCATGTAGTTGTACAC-1-control', 'TGCACCTCACGGATAG-1-control', 'GCGGGTTTCAGTGTTG-1-control', 'CTTAGGAGTAGAGTGC-1-control', 'CGGACTGAGCCGTCGT-1-control', 'CGTAGGCAGATGTGTA-1-control', 'TGAGGGACAAGTTGTC-1-control', 'GTTACAGTCGCTTGTC-1-control', 'CGATCGGCAAACTGTC-1-control', 'GCGCAGTGTAAGTAGT-1-control', 'CGTGTAAGTATCACCA-1-control', 'TAGCCGGAGACTCGGA-1-control', 'CCTCTGACAAAGCGGT-1-control', 'CAGTCCTCAAACCCAT-1-control', 'ACAGCCGTCAACGGCC-1-control', 'ATCATCTTCACCAGGC-1-control', 'ACTTTCAGTCAAACTC-1-control', 'TTGGAACCATTGTGCA-1-control', 'CAACCAATCTGCTGTC-1-control', 'CAAGAAATCAACGCTA-1-control', 'TTAGTTCAGTACGACG-1-control', 'CTACACCCATGAACCT-1-control', 'CGTTGGGTCGAGGTAG-1-control', 'CACACCTCACGGTAAG-1-control', 'GCAAACTAGCTCAACT-1-control', 'ACAGCCGGTCGCTTTC-1-control', 'TATCTCAGTACAAGTA-1-control', 'CATGCCTAGGAGTTGC-1-control', 'ACGGGTCGTGTCTGAT-1-control', 'CGTCACTTCTAACGGT-1-control', 'GGACGTCGTGTTTGTG-1-control', 'GTGCTTCTCATGTAGC-1-control', 'TTGCCGTCATCCGCGA-1-control', 'CGTTGGGTCTTGAGGT-1-control', 'CTCGTACGTGAAATCA-1-control', 'GCGGGTTGTTGTCGCG-1-control', 'TGACTTTAGCCAACAG-1-control', 'AGCGTCGCATCGGACC-1-control', 'AGCGTCGGTGTGCCTG-1-control', 'CGGAGTCGTCGACTGC-1-control', 'CGATGTAAGCGATAGC-1-control', 'TTGCGTCAGGGAGTAA-1-control', 'CGTGTAAGTCGCGGTT-1-control', 'TGGACGCAGAACTGTA-1-control', 'TCCCGATGTGAGTATA-1-control', 'TTCCCAGGTTACTGAC-1-control', 'ATCCACCCACATGGGA-1-control', 'TACGGGCTCAGTTTGG-1-control', 'CGATCGGCACCATGTA-1-control', 'GTGCGGTCAAGTTGTC-1-control', 'GAATGAAGTTCACCTC-1-control', 'TGGGAAGAGCCGCCTA-1-control', 'AGTGAGGGTCTTGTCC-1-control', 'AACGTTGAGTACTTGC-1-control', 'CGTGTAAAGCTCCTCT-1-control', 'CGTGTAAAGCGATTCT-1-control', 'GCTTCCAAGGCCCGTT-1-control', 'GCTTCCAAGGAGCGAG-1-control', 'AATCGGTTCTAAGCCA-1-control', 'CATGCCTCAGGGTACA-1-control', 'ACGCAGCGTTTCCACC-1-control', 'TTCTCCTGTTCGAATC-1-control', 'CACATTTGTAGGAGTC-1-control', 'AATCGGTCATCATCCC-1-control', 'CGGACTGAGCCACGCT-1-control', 'CGGACTGAGAAGGGTA-1-control', 'TCGTACCAGGATATAC-1-control', 'ATTTCTGGTCTCCACT-1-control', 'GTGGGTCAGCTAGGCA-1-control', 'TTCTACATCACCCGAG-1-control', 'CAGATCAGTCAATGTC-1-control', 'CGTGTCTTCCAAGTAC-1-control', 'CTGAAGTCAGGGATTG-1-control', 'TACGGATGTAGTACCT-1-control', 'GTCGGGTAGGATATAC-1-control', 'TCGGGACCATATACCG-1-control', 'GAAACTCGTTTGGCGC-1-control', 'CACCACTAGTGTACCT-1-control', 'CAGAATCCAGGCTGAA-1-control', 'AGGCCGTAGTGTGAAT-1-control', 'GGCTCGACACCTGGTG-1-control', 'ACACCGGTCCGTTGCT-1-control', 'CAGAGAGTCGTGACAT-1-control', 'TAAGAGAAGTGTTTGC-1-control', 'GCTCTGTGTTACGACT-1-control', 'CTCGTCACAGCTGTTA-1-control'],
      type: 'json',
      copy: true,
      transform: [
        {
          type: 'identifier',
          as: 'cellIndex',
        },
        {
          type: 'formula',
          as: 'cellIndex',
          expr: 'datum.cellIndex-1',
        },
      ],
    },
    {
      name: 'heatmapData',
      values: [{ geneName: 'BLOC1S3', expression: [0, 2, 1, 9, 4, 8, 8, 2, 7, 7, 9, 7, 1, 3, 1, 1, 0, 2, 7, 7, 5, 5, 7, 1, 7, 5, 7, 2, 8, 1, 1, 9, 1, 1, 5, 0, 9, 7, 6, 9, 6, 0, 2, 0, 5, 5, 4, 8, 6, 4, 9, 0, 8, 6, 2, 4, 5, 4, 5, 9, 5, 6, 7, 0, 2, 9, 1, 2, 8, 4, 1, 9, 1, 9, 1, 6, 3, 2, 8, 6, 3, 1, 5, 0, 8, 1, 6, 8, 0, 6, 5, 9, 1, 8, 6, 1, 9, 0, 3, 0] }, { geneName: 'AL157938.3', expression: [5, 2, 2, 3, 1, 1, 0, 8, 1, 0, 8, 3, 3, 9, 6, 5, 7, 9, 3, 9, 8, 4, 2, 7, 5, 9, 8, 7, 6, 6, 5, 3, 1, 9, 0, 4, 2, 6, 0, 3, 4, 4, 1, 4, 1, 7, 2, 8, 9, 5, 2, 3, 3, 7, 4, 7, 1, 2, 8, 2, 8, 0, 4, 4, 0, 1, 3, 1, 2, 7, 0, 5, 4, 0, 7, 5, 4, 4, 5, 6, 2, 1, 3, 8, 5, 6, 6, 9, 5, 4, 5, 7, 5, 6, 5, 7, 2, 4, 5, 1] }, { geneName: 'PKD1L3', expression: [0, 0, 7, 4, 0, 5, 8, 3, 5, 4, 2, 7, 4, 5, 3, 0, 1, 8, 3, 9, 1, 0, 1, 0, 8, 6, 8, 5, 6, 8, 3, 1, 1, 2, 1, 4, 9, 8, 7, 0, 5, 1, 4, 9, 3, 7, 3, 1, 6, 7, 5, 9, 3, 4, 6, 5, 6, 6, 0, 1, 1, 9, 6, 8, 5, 9, 3, 3, 9, 6, 9, 7, 4, 0, 9, 1, 8, 5, 3, 6, 8, 4, 9, 9, 8, 5, 3, 1, 2, 5, 6, 8, 4, 3, 6, 7, 0, 6, 3, 6] }, { geneName: 'SMAD7', expression: [7, 6, 1, 4, 4, 0, 8, 8, 0, 7, 3, 5, 3, 6, 4, 0, 2, 4, 9, 0, 4, 5, 5, 9, 8, 6, 6, 9, 1, 1, 7, 9, 3, 0, 7, 6, 3, 0, 6, 7, 0, 4, 3, 6, 4, 0, 0, 7, 9, 7, 6, 9, 8, 3, 5, 3, 3, 9, 5, 1, 2, 5, 7, 3, 5, 1, 5, 1, 4, 1, 0, 4, 2, 3, 0, 5, 8, 3, 4, 3, 1, 5, 7, 1, 8, 0, 4, 5, 7, 5, 1, 6, 6, 9, 0, 7, 8, 2, 1, 8] }, { geneName: 'SRGAP2B', expression: [7, 4, 0, 3, 5, 3, 0, 4, 1, 8, 8, 5, 2, 8, 4, 8, 4, 3, 6, 6, 7, 6, 0, 1, 8, 0, 4, 2, 8, 4, 4, 7, 7, 9, 9, 7, 2, 1, 9, 7, 5, 8, 4, 3, 5, 6, 9, 6, 9, 5, 1, 4, 0, 6, 3, 3, 4, 7, 0, 7, 9, 4, 8, 5, 2, 9, 0, 2, 9, 2, 9, 5, 3, 5, 4, 1, 9, 8, 2, 8, 1, 0, 9, 9, 6, 0, 0, 1, 4, 9, 4, 3, 4, 0, 4, 0, 2, 1, 7, 1] }, { geneName: 'ZNF823', expression: [6, 8, 8, 4, 4, 7, 1, 3, 0, 2, 5, 0, 4, 8, 8, 4, 9, 8, 6, 8, 9, 0, 6, 0, 9, 5, 0, 8, 9, 3, 0, 7, 4, 8, 4, 4, 6, 9, 9, 5, 1, 1, 6, 9, 2, 2, 8, 2, 7, 5, 4, 0, 8, 7, 1, 7, 1, 9, 8, 8, 0, 3, 6, 9, 0, 6, 7, 3, 2, 5, 7, 1, 3, 1, 6, 8, 9, 5, 4, 4, 3, 1, 8, 5, 8, 6, 7, 5, 9, 2, 6, 0, 5, 5, 8, 0, 7, 1, 9, 2] }, { geneName: 'AC007389.3', expression: [8, 3, 9, 5, 2, 0, 6, 2, 5, 1, 3, 3, 4, 5, 7, 3, 4, 9, 8, 6, 7, 8, 9, 7, 5, 2, 9, 9, 5, 3, 7, 5, 4, 8, 2, 1, 1, 9, 6, 8, 0, 3, 8, 8, 8, 1, 8, 9, 0, 6, 7, 4, 4, 5, 4, 2, 0, 2, 1, 6, 6, 2, 7, 9, 6, 4, 3, 9, 7, 6, 4, 4, 7, 4, 7, 6, 7, 7, 7, 5, 2, 4, 0, 1, 5, 6, 1, 5, 5, 1, 6, 9, 7, 0, 6, 1, 0, 8, 7, 8] }, { geneName: 'BHLHE40-AS1', expression: [7, 2, 7, 4, 2, 1, 4, 0, 2, 1, 6, 3, 6, 0, 5, 6, 7, 1, 8, 9, 4, 1, 4, 4, 7, 8, 2, 6, 0, 4, 8, 6, 3, 0, 1, 1, 7, 6, 6, 3, 0, 2, 1, 6, 9, 8, 8, 3, 9, 4, 7, 2, 3, 3, 8, 7, 5, 1, 6, 6, 5, 4, 2, 4, 7, 5, 6, 2, 1, 3, 4, 4, 2, 2, 3, 6, 2, 8, 3, 9, 1, 4, 9, 0, 9, 4, 0, 1, 1, 2, 4, 1, 9, 5, 3, 4, 2, 2, 7, 5] }, { geneName: 'KCNAB1', expression: [1, 3, 3, 8, 9, 9, 5, 7, 1, 7, 3, 0, 4, 6, 6, 8, 4, 2, 2, 7, 5, 6, 2, 5, 6, 5, 4, 9, 4, 6, 1, 1, 0, 6, 3, 5, 8, 6, 0, 1, 6, 2, 6, 2, 8, 6, 4, 6, 6, 7, 3, 5, 2, 9, 0, 3, 9, 1, 5, 1, 6, 7, 2, 4, 7, 0, 1, 4, 7, 0, 3, 0, 1, 2, 8, 7, 3, 0, 9, 4, 1, 0, 2, 5, 7, 4, 4, 4, 1, 7, 6, 7, 1, 0, 1, 0, 5, 9, 9, 5] }, { geneName: 'PLBD1', expression: [3, 5, 9, 7, 9, 8, 7, 5, 9, 0, 8, 1, 9, 6, 5, 1, 9, 2, 4, 5, 2, 3, 0, 9, 2, 5, 4, 7, 0, 8, 7, 0, 2, 7, 5, 0, 5, 5, 5, 5, 1, 8, 3, 7, 0, 5, 7, 9, 3, 0, 2, 0, 1, 8, 7, 6, 9, 2, 8, 4, 1, 8, 1, 4, 2, 8, 9, 8, 8, 8, 1, 5, 5, 7, 2, 7, 7, 9, 1, 6, 8, 5, 0, 6, 5, 8, 9, 4, 5, 7, 7, 5, 7, 7, 9, 7, 7, 7, 8, 4] }, { geneName: 'TEX14', expression: [6, 9, 5, 7, 0, 9, 6, 6, 4, 8, 7, 1, 1, 8, 3, 0, 2, 1, 9, 9, 9, 6, 6, 4, 6, 4, 0, 9, 8, 0, 2, 3, 6, 9, 7, 7, 8, 8, 0, 1, 5, 0, 1, 0, 8, 0, 0, 1, 8, 7, 7, 2, 7, 8, 2, 9, 0, 8, 1, 2, 8, 2, 0, 9, 0, 0, 7, 5, 1, 4, 0, 6, 2, 6, 2, 9, 3, 1, 3, 8, 9, 6, 9, 8, 2, 5, 1, 1, 3, 3, 0, 8, 4, 6, 9, 7, 3, 6, 3, 0] }, { geneName: 'AC011603.2', expression: [6, 1, 9, 1, 0, 0, 3, 5, 9, 7, 7, 6, 4, 2, 5, 3, 3, 3, 6, 3, 9, 1, 9, 2, 9, 2, 8, 1, 6, 1, 4, 6, 9, 6, 8, 5, 5, 3, 5, 9, 0, 2, 6, 5, 1, 3, 3, 3, 5, 5, 5, 7, 9, 2, 4, 3, 5, 3, 2, 1, 7, 6, 9, 9, 2, 7, 5, 6, 4, 3, 3, 3, 1, 0, 2, 7, 8, 2, 6, 9, 0, 6, 5, 5, 8, 2, 8, 5, 1, 7, 9, 5, 8, 0, 9, 9, 2, 9, 7, 6] }, { geneName: 'SLC38A2', expression: [0, 0, 5, 3, 3, 6, 3, 1, 1, 6, 2, 1, 1, 2, 4, 9, 9, 1, 8, 5, 8, 8, 6, 2, 6, 8, 8, 7, 1, 0, 4, 1, 9, 8, 2, 9, 4, 2, 5, 4, 5, 4, 1, 3, 7, 5, 3, 0, 4, 7, 2, 9, 3, 9, 6, 9, 7, 4, 3, 4, 5, 1, 4, 7, 9, 4, 4, 6, 4, 0, 0, 4, 5, 7, 2, 0, 6, 7, 2, 3, 6, 7, 8, 5, 1, 5, 4, 8, 0, 0, 3, 3, 0, 9, 9, 8, 4, 0, 0, 2] }, { geneName: 'C16orf95', expression: [1, 2, 0, 5, 2, 6, 3, 0, 0, 6, 0, 6, 1, 7, 4, 0, 5, 2, 1, 0, 6, 9, 6, 0, 4, 9, 1, 3, 5, 5, 0, 0, 9, 2, 2, 7, 5, 9, 8, 4, 8, 2, 4, 0, 2, 1, 1, 3, 6, 0, 9, 0, 7, 0, 9, 6, 4, 1, 8, 1, 4, 8, 6, 4, 7, 0, 6, 8, 2, 3, 9, 1, 9, 7, 2, 4, 4, 7, 7, 7, 9, 8, 4, 8, 7, 7, 0, 7, 9, 2, 1, 9, 5, 8, 8, 0, 0, 2, 4, 1] }, { geneName: 'SDF2L1', expression: [3, 4, 0, 0, 2, 4, 0, 9, 6, 0, 6, 0, 4, 0, 2, 1, 0, 9, 9, 2, 3, 5, 6, 5, 6, 8, 3, 9, 6, 1, 2, 5, 5, 1, 5, 8, 7, 9, 0, 9, 0, 5, 6, 0, 8, 6, 8, 2, 9, 3, 2, 7, 9, 0, 8, 5, 2, 2, 4, 5, 8, 4, 6, 7, 4, 2, 6, 0, 7, 5, 3, 9, 5, 7, 1, 0, 0, 7, 2, 6, 4, 6, 7, 7, 6, 4, 4, 5, 7, 8, 3, 6, 8, 8, 1, 3, 5, 9, 3, 2] }, { geneName: 'BMF', expression: [7, 1, 3, 3, 3, 4, 9, 9, 3, 7, 5, 7, 8, 2, 1, 6, 8, 4, 6, 5, 6, 7, 2, 6, 4, 3, 4, 3, 6, 0, 6, 6, 9, 0, 9, 4, 0, 4, 3, 2, 1, 4, 8, 4, 8, 9, 6, 6, 9, 2, 0, 5, 2, 3, 1, 2, 6, 0, 1, 7, 4, 5, 4, 0, 7, 8, 5, 2, 4, 9, 9, 5, 6, 9, 2, 7, 2, 4, 9, 3, 8, 5, 2, 1, 1, 0, 0, 4, 6, 6, 1, 7, 4, 0, 4, 2, 5, 8, 6, 3] }, { geneName: 'UIMC1', expression: [1, 8, 2, 2, 1, 9, 4, 9, 0, 8, 8, 7, 2, 1, 9, 2, 5, 8, 0, 0, 6, 7, 8, 9, 4, 9, 4, 3, 3, 8, 3, 7, 3, 3, 1, 3, 6, 1, 2, 0, 2, 7, 5, 8, 9, 8, 2, 3, 4, 5, 1, 6, 2, 7, 7, 4, 8, 3, 2, 9, 7, 5, 1, 7, 4, 4, 7, 2, 0, 9, 1, 2, 7, 2, 6, 9, 5, 8, 9, 3, 2, 2, 8, 8, 8, 4, 9, 2, 7, 7, 6, 2, 4, 8, 0, 8, 6, 4, 6, 6] }, { geneName: 'RGS2', expression: [5, 6, 9, 5, 6, 0, 9, 0, 2, 6, 0, 2, 7, 8, 6, 2, 2, 5, 2, 9, 9, 1, 9, 4, 7, 2, 4, 2, 1, 8, 6, 8, 2, 3, 8, 7, 3, 3, 4, 0, 3, 7, 5, 1, 0, 7, 5, 9, 1, 3, 0, 5, 8, 4, 6, 1, 1, 8, 3, 3, 9, 9, 9, 4, 2, 7, 6, 0, 7, 4, 2, 0, 4, 0, 4, 2, 6, 0, 0, 9, 4, 1, 7, 3, 6, 8, 1, 6, 1, 7, 5, 4, 6, 5, 7, 3, 0, 4, 5, 3] }, { geneName: 'MINDY2', expression: [1, 2, 3, 7, 3, 8, 1, 7, 8, 5, 5, 4, 7, 2, 5, 4, 8, 4, 9, 3, 8, 2, 7, 5, 3, 8, 1, 4, 7, 0, 2, 5, 6, 6, 3, 7, 6, 6, 2, 4, 2, 3, 7, 2, 8, 8, 4, 7, 9, 3, 9, 3, 7, 4, 2, 9, 5, 4, 0, 3, 1, 0, 7, 5, 9, 4, 4, 7, 1, 5, 3, 2, 9, 8, 1, 6, 4, 8, 4, 5, 9, 9, 9, 3, 6, 8, 4, 2, 5, 3, 6, 4, 8, 1, 0, 8, 6, 5, 9, 7] }, { geneName: 'BHLHE40', expression: [0, 7, 3, 5, 0, 8, 7, 1, 0, 7, 8, 1, 1, 3, 3, 6, 8, 7, 0, 3, 2, 8, 3, 8, 2, 7, 8, 0, 3, 3, 0, 6, 5, 9, 1, 2, 2, 6, 7, 6, 5, 7, 6, 0, 4, 1, 0, 8, 7, 4, 2, 2, 0, 5, 0, 4, 1, 0, 0, 6, 2, 9, 4, 3, 1, 4, 5, 5, 9, 1, 8, 5, 3, 1, 7, 8, 4, 5, 7, 2, 0, 5, 8, 1, 2, 4, 1, 0, 6, 3, 7, 8, 4, 1, 5, 3, 3, 0, 4, 1] }],
      copy: true,
      transform: [
        {
          type: 'flatten',
          fields: ['expression'],
          index: 'cellIndex',
        },
        {
          type: 'lookup',
          from: 'cellNames',
          key: 'cellIndex',
          fields: ['cellIndex'],
          values: ['data'],
          as: ['cellName'],
        },
      ],
    },
  ],
  signals: [
    {
      name: 'mouseover',
      on: [
        { events: '*:mouseover', encode: 'select' },
      ],
    },
  ],
  scales: [
    {
      name: 'x',
      type: 'band',
      domain: {
        data: 'cellNames',
        field: 'data',
      },
      range: 'width',
    },
    {
      name: 'y',
      type: 'band',
      domain: {
        data: 'heatmapData',
        field: 'geneName',
      },
      range: 'height',
    },
    {
      name: 'color',
      type: 'linear',
      range: {
        scheme: 'Viridis',
      },
      domain: {
        data: 'heatmapData',
        field: 'expression',
      },
      zero: false,
      nice: true,
    },
  ],
  // axes: [
  //   {
  //     orient: 'bottom',
  //     scale: 'x',
  //     domain: false,
  //     title: 'Cells',
  //   },
  //   {
  //     orient: 'left',
  //     scale: 'y',
  //     domain: false,
  //     title: 'Gene names',
  //   },
  // ],
  legends: [
    {
      fill: 'color',
      type: 'gradient',
      gradientLength: {
        signal: 'height',
      },
    },
  ],
  marks: [
    {
      type: 'rect',
      from: {
        data: 'heatmapData',
      },
      encode: {
        enter: {
          x: {
            scale: 'x',
            field: 'cellName',
          },
          y: {
            scale: 'y',
            field: 'geneName',
          },
          width: {
            scale: 'x',
            band: 1,
          },
          height: {
            scale: 'y',
            band: 1,
          },
        },
        update: {
          fill: {
            scale: 'color',
            field: 'expression',
          },
        },
        hover: {
          cursor: {
            value: 'pointer',
          },
        },
      },
    },
  ],
};

export default spec;
