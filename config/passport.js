const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User           = require('../models/User');
const Category       = require('../models/Category');


const createDefaultCategories = (userId) => [
  { user: userId, name: 'Gaji',         icon: '💼', color: '#10b981', type: 'income',  isDefault: true },
  { user: userId, name: 'Freelance',    icon: '💻', color: '#6366f1', type: 'income',  isDefault: true },
  { user: userId, name: 'Makanan',      icon: '🍜', color: '#f59e0b', type: 'expense', isDefault: true },
  { user: userId, name: 'Transportasi', icon: '🚗', color: '#3b82f6', type: 'expense', isDefault: true },
  { user: userId, name: 'Belanja',      icon: '🛍️', color: '#ec4899', type: 'expense', isDefault: true },
  { user: userId, name: 'Kesehatan',    icon: '💊', color: '#ef4444', type: 'expense', isDefault: true },
  { user: userId, name: 'Pendidikan',   icon: '📚', color: '#8b5cf6', type: 'expense', isDefault: true },
  { user: userId, name: 'Hiburan',      icon: '🎮', color: '#06b6d4', type: 'expense', isDefault: true },
  { user: userId, name: 'Tagihan',      icon: '🧾', color: '#64748b', type: 'expense', isDefault: true },
  { user: userId, name: 'Lainnya',      icon: '📦', color: '#9ca3af', type: 'both',    isDefault: true },
];
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
    scope:        ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email     = profile.emails?.[0]?.value?.toLowerCase();
      const googleId  = profile.id;
      const name      = profile.displayName || email.split('@')[0];
      const avatarUrl = profile.photos?.[0]?.value || '';

      let user = await User.findOne({ googleId });

      if (user) {
        
        if (avatarUrl && user.avatar !== avatarUrl) {
          user.avatar = avatarUrl;
          await user.save();
        }
        return done(null, user);
      }

      
      user = await User.findOne({ email });

      if (user) {
        
        user.googleId     = googleId;
        user.authProvider = 'google';
        if (avatarUrl) user.avatar = avatarUrl;
        await user.save();
        return done(null, user);
      }

      
      user = await User.create({
        name,
        email,
        googleId,
        avatar:       avatarUrl,
        authProvider: 'google'
        
      });

      
      await Category.insertMany(createDefaultCategories(user._id));

      return done(null, user);

    } catch (err) {
      return done(err, null);
    }
  }
));


passport.serializeUser((user, done)   => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
