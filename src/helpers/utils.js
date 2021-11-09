function isString(object) {
  return typeof object === "string";
}

function isArray(object) {
  return Array.isArray(object);
}

module.exports = {
  isString,
  isArray,
};
