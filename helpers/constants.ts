import { extname } from 'path';

export const handleFileFilter = (req, file, callback) => {
  const ext = extname(file.originalname);
  const allowedExtArr = ['.jpg', '.png', '.jpeg'];
  if (!allowedExtArr.includes(ext)) {
    req.fileValidationError = `wrong file extension type ${allowedExtArr.toString()}`;
    callback(null, false);
  } else {
    const fileSize = parseInt(req.headers['Content-Length']);
    if (fileSize > 5 * 1024 * 1024) {
      req.fileValidationError = `File size is too large. Accepted than 5MB`;
      callback(null, false);
    } else {
      callback(null, true);
    }
  }
};
