// export const response = (res, data, message, statusCode) => {
//     return res.status(statusCode).json({
//       status: statusCode < 400 ? 'success' : 'error',
//       message: message,
//       data: data || null,
//       code: statusCode, 
//     });
//   };

export const response = (res, data = [], message = 'success', status = 200) => {
  return res.status(status).json({
    success: status === 200,
    message,
    data,
  });
};