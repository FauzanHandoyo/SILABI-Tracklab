const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Try to verify as your own JWT first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await userModel.findById(decoded.id);
      
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Invalid token or inactive user' });
      }
      
      // Attach user to request
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      return next();
    } catch (jwtError) {
      // If your JWT fails, try Supabase JWT
      console.log('JWT verification failed, trying Supabase token...');
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error('Supabase token verification failed:', error);
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      // Check if OAuth user exists in your database
      let dbUser = await userModel.findByEmail(user.email);
      
      if (!dbUser) {
        // Create OAuth user in your database with default 'user' role
        const username = user.email.split('@')[0];
        dbUser = await userModel.create({
          username: username,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          password: 'oauth', // Placeholder password for OAuth users
          oauth_provider: user.app_metadata?.provider || 'supabase',
          is_active: true,
          role: 'user' // Default role
        });
        console.log('Created new OAuth user:', dbUser.email);
      }
      
      // Attach Supabase user to request
      req.user = {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        supabase_user: true,
        is_first_login: dbUser.oauth_provider && !dbUser.last_login // Flag for first-time OAuth users
      };
      
      return next();
    }
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

module.exports = { authenticate, authorize };