// module.exports = function(permission) {
//   return (req, res, next) => {
//     const { isSuperAdmin, permissions } = req;
//     if (isSuperAdmin || permissions.includes("*") || permissions.includes(permission)) {
//       return next();
//     }
//     return res.status(403).json({ status: 403, message: "Access denied" });
//   };
// };

module.exports = function (requiredPermission) {
  return (req, res, next) => {
    const { isSuperAdmin, permissions } = req;

    if (isSuperAdmin) return next();

    const normalize = (str) =>
      str.toLowerCase().replace(/\s+/g, "_");

    const [moduleName, actionName] = requiredPermission.split("_");

    const hasAccess = permissions.some((perm) => {
      const normalizedModule = normalize(perm.module);

      return (
        normalizedModule === moduleName &&
        perm.actions.includes(actionName)
      );
    });

    if (hasAccess) return next();

    return res.status(403).json({
      status: 403,
      message: "Access denied",
    });
  };
};