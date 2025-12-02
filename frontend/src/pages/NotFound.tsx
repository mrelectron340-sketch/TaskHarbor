import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card space-y-4"
      >
        <div className="flex justify-center">
          <div className="inline-flex p-4 bg-red-500/20 rounded-full">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Page not found</h1>
        <p className="text-slate-400">
          The page you are looking for does not exist, or the link is invalid.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center space-x-2 mt-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;



