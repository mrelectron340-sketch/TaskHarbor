import React from 'react';
import { motion } from 'framer-motion';
import { Database, HardDrive, Shield, Info, CheckCircle2 } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card space-y-4"
      >
        <div className="flex items-center space-x-3">
          <Info className="w-6 h-6 text-primary-400" />
          <h1 className="text-4xl font-bold">How TaskHarbor Stores Your Data</h1>
        </div>
        <p className="text-slate-300">
          TaskHarbor is a fully on-chain job marketplace on the Massa buildnet. Jobs, escrow and
          profiles live in smart contracts, while large content (descriptions, avatars, submissions)
          lives on IPFS — <span className="font-semibold">no centralized database or web2 backend.</span>
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-200">
          <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-600/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>On-chain storage</span>
          </span>
          <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-600/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>IPFS content (no DB)</span>
          </span>
          <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-600/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Wallet-based identity</span>
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-3 gap-6"
      >
        <div className="card space-y-3">
          <div className="inline-flex p-3 bg-primary-600/20 rounded-full">
            <Database className="w-6 h-6 text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold">On-Chain Contracts</h2>
          <p className="text-slate-400 text-sm">
            Job state, escrow balances, disputes, and profile references are stored inside Massa
            smart contracts ({'JobContract'}, {'EscrowContract'}, {'VotingContract'},
            {'ProfileContract'}).
          </p>
        </div>

        <div className="card space-y-3">
          <div className="inline-flex p-3 bg-primary-600/20 rounded-full">
            <HardDrive className="w-6 h-6 text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold">IPFS Storage</h2>
          <p className="text-slate-400 text-sm">
            Large content like job descriptions, profile JSON, avatars, and work submissions live
            on IPFS. Only the corresponding CIDs are stored on-chain for permanence.
          </p>
        </div>

        <div className="card space-y-3">
          <div className="inline-flex p-3 bg-primary-600/20 rounded-full">
            <Shield className="w-6 h-6 text-primary-400" />
          </div>
          <h2 className="text-xl font-semibold">Wallet Based Identity</h2>
          <p className="text-slate-400 text-sm">
            Your Massa account address is your identity. Profiles are keyed by address, and escrow
            payouts go directly to your wallet using a pull-based withdraw model.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card space-y-4"
      >
        <h2 className="text-2xl font-bold">Where things are stored</h2>
        <ul className="list-disc list-inside space-y-2 text-slate-300">
          <li>
            <span className="font-semibold">Job details:</span> on-chain in {'JobContract'} with
            title, client, freelancer, payment, status, deadlines. Description text is in IPFS,
            referenced by a CID.
          </li>
          <li>
            <span className="font-semibold">Escrow balances:</span> on-chain in {'EscrowContract'},
            mapped by job id and address.
          </li>
          <li>
            <span className="font-semibold">Profiles:</span> on-chain in {'ProfileContract'} with
            name, role, reputation, jobs completed, and a CID to your profile JSON (bio, skills,
            avatarCid, portfolio).
          </li>
          <li>
            <span className="font-semibold">Avatars and submissions:</span> IPFS CIDs stored in
            profile JSON and job submissions; the frontend resolves them via the configured gateway.
          </li>
        </ul>
      </motion.div>
    </div>
  );
};

export default About;


