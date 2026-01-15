// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendEmail } = require("../utils/mailer");


exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const user = await User.create({
      first_name: firstName,
      last_name: lastName,
      email,
      password: hashedPassword,
      email_verified: false,
      verification_token: verificationToken,
    });

    const verifyLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: `
        <h2>Email Verification</h2>
        <p>Hello ${firstName},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyLink}" target="_blank">${verifyLink}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email to verify your account.",
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Signup failed" });
  }
};


// User login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in"
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          emailVerified: user.email_verified
        }
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message
    });
  }
};

// Verify email
// exports.verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.params;

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
//     // Find user by email
//     const user = await User.findOne({ where: { email: decoded.email } });
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     // Update user verification status
//     user.email_verified = true;
//     user.verification_token = null;
//     await user.save();

//     res.json({
//       success: true,
//       message: "Email verified successfully"
//     });

//   } catch (error) {
//     console.error("Email verification error:", error);
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid verification token"
//       });
//     }
//     if (error.name === 'TokenExpiredError') {
//       return res.status(400).json({
//         success: false,
//         message: "Verification token has expired"
//       });
//     }
//     res.status(500).json({
//       success: false,
//       message: "Server error during email verification",
//       error: error.message
//     });
//   }
// };

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by email
    const user = await User.findOne({ where: { email: decoded.email } });
    if (!user) {
      // Return HTML page for browser or JSON for API
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Email Verification Failed</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%); }
              .container { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              .error { color: #dc3545; font-size: 24px; margin-bottom: 1rem; }
              .message { color: #666; margin-bottom: 2rem; }
              .button { background: #4a6cf7; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">❌ Verification Failed</div>
              <div class="message">User not found. The verification link may be invalid.</div>
              <a href="http://localhost:3000/login" class="button">Go to Login</a>
            </div>
          </body>
          </html>
        `);
      }
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already verified
    if (user.email_verified) {
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Already Verified</title>
            <style>
              body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%); }
              .container { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
              .success { color: #28a745; font-size: 24px; margin-bottom: 1rem; }
              .message { color: #666; margin-bottom: 2rem; }
              .button { background: #4a6cf7; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">✅ Already Verified</div>
              <div class="message">Your email is already verified. You can log in now.</div>
              <a href="http://localhost:3000/login" class="button">Go to Login</a>
            </div>
          </body>
          </html>
        `);
      }
      return res.json({
        success: true,
        message: "Email is already verified"
      });
    }

    // Update user verification status
    user.email_verified = true;
    user.verification_token = null;
    await user.save();

    // Return HTML page for browser or JSON for API
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verified Successfully</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%); }
            .container { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .success { color: #28a745; font-size: 24px; margin-bottom: 1rem; }
            .message { color: #666; margin-bottom: 2rem; }
            .button { background: #4a6cf7; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
          </style>
          <script>
            setTimeout(function() {
              window.location.href = 'http://localhost:3000/login';
            }, 3000);
          </script>
        </head>
        <body>
          <div class="container">
            <div class="success">✅ Email Verified!</div>
            <div class="message">Your email has been verified successfully. You will be redirected to login page in 3 seconds.</div>
            <a href="http://localhost:3000/login" class="button">Go to Login Now</a>
          </div>
        </body>
        </html>
      `);
    }

    res.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error("Email verification error:", error);
    
    let errorMessage = "Server error during email verification";
    if (error.name === 'JsonWebTokenError') {
      errorMessage = "Invalid verification token";
    } else if (error.name === 'TokenExpiredError') {
      errorMessage = "Verification token has expired";
    }

    // Return HTML page for browser or JSON for API
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%); }
            .container { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .error { color: #dc3545; font-size: 24px; margin-bottom: 1rem; }
            .message { color: #666; margin-bottom: 2rem; }
            .button { background: #4a6cf7; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌ ${errorMessage}</div>
            <div class="message">Please try registering again or contact support.</div>
            <div style="display: flex; gap: 10px; justify-content: center;">
              <a href="http://localhost:3000/login" class="button">Login</a>
              <a href="http://localhost:3000/signup" class="button" style="background: #6c757d;">Sign Up</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token"
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: "Verification token has expired"
      });
    }
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};


// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    user.reset_token = resetToken;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: email,
      subject: "Reset your password",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    res.json({ success: true, message: "Password reset email sent" });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Error sending reset email" });
  }
};


// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findOne({
      where: {
        id: decoded.id,
        reset_token: token
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.reset_token = null;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token"
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired"
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
      error: error.message
    });
  }
};