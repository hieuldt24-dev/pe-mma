import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, Session } from '../model/index.js';
import { userDto } from './dto.js';
import { fail, credentials } from './validation.js';

export function createAuthService({ jwtSecret }) {
  async function issueSession(user) {
    const session = await Session.create({
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 86400_000),
    });
    const token = jwt.sign({}, jwtSecret, {
      subject: String(user._id),
      jwtid: String(session._id),
      expiresIn: '7d',
      issuer: 'vi-sinh-vien',
      audience: 'vi-sinh-vien-mobile',
      algorithm: 'HS256',
    });
    return { token, user: userDto(user), expiresAt: session.expiresAt.toISOString() };
  }

  return {
    async register(body) {
      const { name, email, password } = credentials(body, true);
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, passwordHash });
      return issueSession(user);
    },
    async login(body) {
      const { email, password } = credentials(body);
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user || !(await bcrypt.compare(password, user.passwordHash)))
        fail('Email hoặc mật khẩu không đúng.', 401);
      return issueSession(user);
    },
    async getCurrentUser(userId) {
      const user = await User.findById(userId);
      if (!user) fail('Tài khoản không tồn tại.', 401);
      return { user: userDto(user) };
    },
    async logout(userId, sessionId) {
      await Session.deleteOne({ _id: sessionId, userId });
    },
    async authenticate(header) {
      if (!header?.startsWith('Bearer ')) fail('Vui lòng đăng nhập.', 401);
      let claims;
      try {
        claims = jwt.verify(header.slice(7), jwtSecret, {
          algorithms: ['HS256'],
          issuer: 'vi-sinh-vien',
          audience: 'vi-sinh-vien-mobile',
        });
      } catch {
        fail('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
      }
      if (
        !mongoose.isObjectIdOrHexString(claims.sub) ||
        !mongoose.isObjectIdOrHexString(claims.jti)
      )
        fail('Phiên đăng nhập không hợp lệ.', 401);
      const session = await Session.findOne({
        _id: claims.jti,
        userId: claims.sub,
        expiresAt: { $gt: new Date() },
      });
      if (!session) fail('Phiên đăng nhập đã kết thúc.', 401);

      return { userId: new mongoose.Types.ObjectId(claims.sub), sessionId: session._id };
    },
  };
}
