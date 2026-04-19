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

    const parts = requiredPermission.split("_");
    const action = parts.pop(); // last = action
    const moduleName = parts.join("_"); // rest = module

    const hasAccess = permissions.some((perm) => {
      return (
        perm.module === moduleName &&
        perm.actions.includes(action)
      );
    });

    if (hasAccess) return next();

    return res.status(403).json({
      status: 403,
      message: "Access denied please contact to super admin",
    });
  };
};