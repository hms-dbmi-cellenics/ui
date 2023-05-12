function getArray(object) {
  return Object.keys(object).reduce((r, k) => {
    object[k].forEach((a, i) => {
      // eslint-disable-next-line no-param-reassign
      r[i] = r[i] || {};
      // eslint-disable-next-line no-param-reassign
      r[i][k] = a;
    });
    return r;
  }, []);
}

export default getArray;
