module.exports = function(permission) {
  return (req, res, next) => {
    const { isSuperAdmin, permissions } = req;
    if (isSuperAdmin || permissions.includes("*") || permissions.includes(permission)) {
      return next();
    }
    return res.status(403).json({ status: 403, message: "Access denied" });
  };
};
