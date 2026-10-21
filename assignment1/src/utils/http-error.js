// TODO: class HttpError extends Error
// - constructor(status, message): call super(message), store `this.status = status`
// - services throw this (e.g. new HttpError(404, "book not found"))
//   so middleware/error-handler.js knows what status code to respond with

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
