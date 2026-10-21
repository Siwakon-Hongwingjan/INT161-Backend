const HttpError = require("./http-error");

function toId(value, name = "id") {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new HttpError(400, `${name} must be a positive integer`);
  }
  return n;
}
function requireString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${name} is required`);
  }
  return value.trim();
}

module.exports = { toId, requireString };
