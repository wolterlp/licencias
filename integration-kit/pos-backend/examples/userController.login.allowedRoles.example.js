const createHttpError = require("http-errors");
const { checkLoginAllowedByLicense } = require("../helpers/checkLoginAllowedByLicense");

async function loginWithLicenseCheck(req, res, next) {
  try {
    const { email, password } = req.body;
    const User = require("../models/userModel");
    const Role = require("../models/roleModel");
    if (!email || !password) return next(createHttpError(400, "Todos los campos son obligatorios"));
    const user = await User.findOne({ email });
    if (!user) return next(createHttpError(401, "Credenciales inválidas"));
    if (user.status === "Inactive") return next(createHttpError(403, "Su cuenta está pendiente de validación."));
    const bcrypt = require("bcrypt");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(createHttpError(401, "Credenciales inválidas"));
    const allowed = await checkLoginAllowedByLicense(user.role);
    if (!allowed) return next(createHttpError(403, "Perfil no habilitado por la licencia"));
    const jwt = require("jsonwebtoken");
    const config = require("../config/config");
    const accessToken = jwt.sign({ _id: user._id }, config.accessTokenSecret, { expiresIn: "1d" });
    res.cookie("accessToken", accessToken, { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true, sameSite: "none", secure: true });
    const roleDoc = await Role.findOne({ name: user.role });
    const userData = user.toObject();
    userData.permissions = roleDoc ? roleDoc.permissions : [];
    res.status(200).json({ success: true, data: userData });
  } catch (error) {
    next(error);
  }
}

module.exports = { loginWithLicenseCheck }
