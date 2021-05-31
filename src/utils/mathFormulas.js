const stdev = (array) => {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  return Math.sqrt(array.map((x) => (x - mean) ** 2).reduce((a, b) => a + b) / n);
};

export default stdev;
