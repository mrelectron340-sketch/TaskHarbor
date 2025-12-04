import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, DollarSign, X, Plus, Loader } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { createContractService } from '../utils/contracts';
import CONFIG from '../config';

interface Milestone {
  id: string;
  amount: string;
  dueDate: string;
  description: string;
}

const CreateJob: React.FC = () => {
  const { account, isConnected, client, wallet, userProfile } = useWallet();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalPayment: '',
    deadline: '',
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  if (!isConnected || !account || !client || !wallet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please connect your wallet</h2>
        <p className="text-slate-400">You need to be connected to create a job</p>
      </div>
    );
  }

  if (userProfile?.role !== 'client') {
    return (
      <div className="card max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-3">Only clients can create jobs</h2>
        <p className="text-slate-400">
          Switch to the client role in Settings or finish onboarding as a client to post work and fund escrow.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.totalPayment || !formData.deadline) {
      alert('Please fill in all required fields.');
      return;
    }

    const deadlineTimestamp = new Date(formData.deadline).getTime();
    if (Number.isNaN(deadlineTimestamp)) {
      alert('Please provide a valid deadline date.');
      return;
    }

    setLoading(true);

    try {
      if (!CONFIG.CONTRACTS.JOB || !CONFIG.CONTRACTS.ESCROW) {
        throw new Error('Contract addresses are not fully configured. Set JOB and ESCROW in config.ts after deploying.');
      }

      const contractService = createContractService(client);
      if (!contractService) {
        throw new Error('Wallet not connected.');
      }

      // We store the full description string directly on-chain using the descriptionCID field.
      // This avoids forcing IPFS usage while keeping the contract interface unchanged.
      await contractService.createJob(
        formData.title,
        formData.description,
        formData.totalPayment,
        deadlineTimestamp,
      );

      // Fetch client's jobs and fund escrow for the latest one
      const clientJobs = await contractService.getClientJobs(account.address);
      if (clientJobs.length === 0) {
        throw new Error('Failed to locate newly created job to fund escrow.');
      }
      const newJobId = clientJobs[clientJobs.length - 1];

      await contractService.depositEscrow(newJobId, formData.totalPayment);

      alert('Job created and escrow funded successfully!');
      navigate('/dashboard/client');
    } catch (error) {
      console.error('Failed to create job:', error);
      alert(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      {
        id: Date.now().toString(),
        amount: '',
        dueDate: '',
        description: '',
      },
    ]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold">Create a New Job</h1>
        <p className="text-slate-400 mt-2">Post your project and find the perfect freelancer</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Job Title *</label>
          <div className="relative">
            <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Web3 Frontend Developer"
              className="input-field pl-12"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Description *</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the job requirements, deliverables, and expectations..."
            rows={6}
            className="input-field"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Total Payment (MAS) *</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.totalPayment}
                onChange={(e) => setFormData({ ...formData, totalPayment: e.target.value })}
                placeholder="0.00"
                className="input-field pl-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Deadline *</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="input-field pl-12"
              />
            </div>
          </div>
        </div>

        {/* Milestones Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-semibold">Milestones (Optional)</label>
            <button
              type="button"
              onClick={addMilestone}
              className="btn-secondary text-sm py-2 px-4 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Milestone</span>
            </button>
          </div>

          {milestones.length > 0 && (
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Milestone {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(milestone.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={milestone.description}
                    onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                    placeholder="Milestone description"
                    className="input-field"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={milestone.amount}
                      onChange={(e) => updateMilestone(milestone.id, 'amount', e.target.value)}
                      placeholder="Amount (MAS)"
                      className="input-field"
                    />
                    <input
                      type="date"
                      value={milestone.dueDate}
                      onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-primary-600/10 border border-primary-500/50 rounded-lg p-4">
          <p className="text-sm text-slate-300">
            <strong>Note:</strong> You will need to fund the escrow with {formData.totalPayment || '0'} MAS when creating
            this job. Funds will be locked until the job is completed and approved.
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create & Fund Job</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJob;
