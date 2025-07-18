import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

interface ErrorAnimationProps {
  className?: string
}

export const ErrorAnimation: React.FC<ErrorAnimationProps> = ({ className = '' }) => {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15 
      }}
    >
      {/* 背景圆圈动画 */}
      <motion.div
        className="absolute inset-0 bg-red-100 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* 错误图标 */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 10,
          delay: 0.1 
        }}
      >
        <motion.div
          animate={{ 
            x: [0, -2, 2, -2, 2, 0],
          }}
          transition={{ 
            duration: 0.5,
            delay: 0.2,
            ease: "easeInOut"
          }}
        >
          <AlertCircle className="w-6 h-6 text-red-500" />
        </motion.div>
      </motion.div>
      
      {/* 震动波纹效果 */}
      <motion.div
        className="absolute inset-0 border-2 border-red-300 rounded-full"
        initial={{ scale: 1, opacity: 0.8 }}
        animate={{ 
          scale: [1, 1.3, 1.6],
          opacity: [0.8, 0.4, 0]
        }}
        transition={{ 
          duration: 0.8,
          delay: 0.3,
          ease: "easeOut"
        }}
      />
    </motion.div>
  )
}
