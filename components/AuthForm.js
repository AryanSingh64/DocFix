'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export default function AuthForm({ isSignUp, onSubmit, loading, error }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password validation states
    const validation = {
        hasMinLength: formData.password.length >= 8,
        hasNumber: /[0-9]/.test(formData.password),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
        hasLowerUpper: /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password),
        passwordsMatch: formData.password === formData.confirmPassword && formData.confirmPassword !== ''
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const inputClasses = "w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all duration-200";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-gray-900">
                        {isSignUp ? 'Sign Up' : 'Sign In'}
                    </h1>
                    <motion.span
                        initial={{ rotate: -45 }}
                        animate={{ rotate: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl"
                    >
                        ✎
                    </motion.span>
                </div>
                <p className="text-gray-500">Secure Your Documents with DocFix</p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-600"
                >
                    <AlertCircle size={20} />
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name - Only for signup */}
                {isSignUp && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative"
                    >
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                            required={isSignUp}
                            className={inputClasses}
                        />
                        {formData.fullName && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                            >
                                <Check className="text-green-500" size={20} />
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* Email */}
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className={inputClasses}
                    />
                    {formData.email && formData.email.includes('@') && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                            <Check className="text-green-500" size={20} />
                        </motion.div>
                    )}
                </div>

                {/* Password */}
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        minLength={6}
                        className={inputClasses}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                {/* Password Requirements - Only for signup */}
                {isSignUp && formData.password && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm space-y-1.5 pl-2"
                    >
                        <p className={validation.hasMinLength ? 'text-green-600' : 'text-gray-400'}>
                            <span className="mr-2">{validation.hasMinLength ? '✓' : '○'}</span>
                            Least 8 characters
                        </p>
                        <p className={validation.hasNumber || validation.hasSymbol ? 'text-green-600' : 'text-red-400'}>
                            <span className="mr-2">{validation.hasNumber || validation.hasSymbol ? '✓' : '○'}</span>
                            Least one number (0-9) or a symbol
                        </p>
                        <p className={validation.hasLowerUpper ? 'text-green-600' : 'text-red-400'}>
                            <span className="mr-2">{validation.hasLowerUpper ? '✓' : '○'}</span>
                            Lowercase (a-z) and uppercase (A-Z)
                        </p>
                    </motion.div>
                )}

                {/* Confirm Password - Only for signup */}
                {isSignUp && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="relative"
                    >
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Re-Type Password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required={isSignUp}
                            className={inputClasses}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </motion.div>
                )}

                {/* Submit & Social Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-semibold flex items-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                {isSignUp ? 'Sign Up' : 'Sign In'}
                                <span className="ml-1">→</span>
                            </>
                        )}
                    </motion.button>

                    <span className="text-gray-400">Or</span>

                    {/* Social Login Buttons */}
                    {/* <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-600">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </motion.button> */}

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </motion.button>
                </div>
            </form>
        </motion.div>
    );
}
