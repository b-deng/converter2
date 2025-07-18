import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

interface SuccessAnimationProps {
  className?: string
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ className = '' }) => {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15,
        delay: 0.1 
      }}
    >
      {/* 背景圆圈动画 */}
      <motion.div
        className="absolute inset-0 bg-green-100 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* 成功图标 */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 10,
          delay: 0.2 
        }}
      >
        <CheckCircle className="w-6 h-6 text-green-500" />
      </motion.div>
      
      {/* 粒子效果 */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-green-400 rounded-full"
          style={{
            top: '50%',
            left: '50%',
          }}
          initial={{ 
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{ 
            scale: [0, 1, 0],
            x: Math.cos((i * 60) * Math.PI / 180) * 20,
            y: Math.sin((i * 60) * Math.PI / 180) * 20,
          }}
          transition={{ 
            duration: 0.6,
            delay: 0.3 + i * 0.05,
            ease: "easeOut"
          }}
        />
      ))}
    </motion.div>
  )
}
