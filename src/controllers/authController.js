const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no configurado');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Email o contraseña inválidos' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Bloquear registro si está deshabilitado por configuración
    if (process.env.ALLOW_USER_REGISTRATION !== 'true') {
      return res.status(403).json({ success: false, message: 'Registro de usuarios deshabilitado' });
    }

    const totalUsers = await User.countDocuments();
    // Si ya existen usuarios, exigir admin mediante token
    if (totalUsers > 0) {
      try {
        const authHeader = req.headers.authorization || '';
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
          return res.status(401).json({ success: false, message: 'No autorizado, falta token' });
        }
        if (!process.env.JWT_SECRET) {
          return res.status(500).json({ success: false, message: 'JWT_SECRET no configurado' });
        }
        const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
        const requester = await User.findById(decoded.id);
        if (!requester || requester.role !== 'admin') {
          return res.status(401).json({ success: false, message: 'No autorizado como administrador' });
        }
      } catch (err) {
        return res.status(401).json({ success: false, message: 'No autorizado, token inválido' });
      }
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'Usuario ya existe' });
    }

    const userData = {
      name,
      email,
      password
    };
    // Primer usuario se crea como admin
    if (totalUsers === 0) {
      userData.role = 'admin';
    }
    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
