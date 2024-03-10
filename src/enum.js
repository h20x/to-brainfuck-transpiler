function createEnum(keys) {
  const enm = Object.create(null);

  for (const key of keys) {
    enm[key] = key;
  }

  return enm;
}

module.exports = { createEnum };
