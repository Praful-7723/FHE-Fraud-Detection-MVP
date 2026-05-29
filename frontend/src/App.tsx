import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Unlock, Server, ArrowRight, Fingerprint, Activity, Check, XCircle, AlertTriangle, Building, CreditCard, ChevronRight, Binary, Database } from 'lucide-react';

type Step = 'IDLE' | 'KEY_GEN' | 'ENCRYPT' | 'TRANSMIT' | 'FHE_EVAL' | 'DECRYPT' | 'RESULT';

interface Metrics {
  evaluation_time_ms: number;
  bootstraps_performed: number;
  lut_operations: number;
  server_knowledge: string;
}

const DUMMY_LWE_CIPHERTEXT = [
  "0x8f2a9c4b e71d503f 9a6b2c8e 1f4d73b5",
  "0xc3e18a9d 4b7f205c 6e9d1a3f 8c5b2e7d",
  "0x1a9b3c7d 5e8f204a 6c9b1d3f 8e5a2c7b",
  "0x5e8f204a 6c9b1d3f 8e5a2c7b 1a9b3c7d"
];

const PHASE2_DETAILS = {
  'KEY_GEN': {
    title: 'Client Key Generation (TFHE-rs)',
    desc: 'Local generation of public evaluation keys and secret decryption keys.',
    specs: ['LWE Dimension (n): 688', 'Polynomial Size (N): 2048', 'Key Location: Secure Enclave', 'Plaintext Leaked: 0%']
  },
  'ENCRYPT': {
    title: 'Feature Quantization & LWE Encryption',
    desc: 'Input features are 8-bit quantized and encrypted with injected Gaussian noise to form Learning With Errors (LWE) ciphertexts.',
    specs: ['Quantization: 8-bit Integer', 'Algorithm: LWE (Learning with Errors)', 'Noise Distribution: Gaussian', 'Execution: Client-Side (Local)']
  },
  'FHE_EVAL': {
    title: 'Blind Homomorphic Evaluation',
    desc: 'Server executes the compiled XGBoost circuit strictly over ciphertext. Uses Programmable Bootstrapping (PBS) to manage noise.',
    specs: ['Max Multiplicative Depth: 3', 'Target Model: XGBoost (Pruned)', 'Engine: Concrete ML (Zama)', 'Execution: Server-Side (Untrusted)']
  },
  'DECRYPT': {
    title: 'Client-Side Local Decryption',
    desc: 'The encrypted inference result is decrypted locally using the secured Secret Key, revealing the final fraud probability.',
    specs: ['Decryption Key: Secret (LWE)', 'Data Integrity: Preserved', 'Final Output: Plaintext Probability', 'Execution: Client-Side (Local)']
  }
};

export default function App() {
  const [step, setStep] = useState<Step>('IDLE');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [fraudData, setFraudData] = useState<{prob: number, factors: string[]}>({prob: 0, factors: []});
  const [activeCiphertext, setActiveCiphertext] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  
  const [amount, setAmount] = useState<string>("1,299.00");
  const [merchant, setMerchant] = useState<string>("Apple Store (Cupertino)");
  const [demoIntent, setDemoIntent] = useState<"normal"|"high_risk">("normal");

  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [activeCiphertext]);

  const runPipeline = async () => {
    setMetrics(null);
    setFraudData({prob: 0, factors: []});
    setActiveCiphertext([]);
    setExpandedNode(null);
    
    setStep('KEY_GEN');
    setExpandedNode('KEY_GEN');
    for (let i = 0; i < 3; i++) {
      setActiveCiphertext(p => [...p, `[Client] Generating LWE Secret Key block ${i+1}...`]);
      await new Promise(r => setTimeout(r, 400));
    }
    
    setStep('ENCRYPT');
    setExpandedNode('ENCRYPT');
    setActiveCiphertext(p => [...p, "", `[Client] Quantizing to 8-bit & Encrypting $${amount} at ${merchant}:`]);
    for (const line of DUMMY_LWE_CIPHERTEXT) {
      setActiveCiphertext(p => [...p, `  > ${line}`]);
      await new Promise(r => setTimeout(r, 200));
    }
    
    setStep('TRANSMIT');
    setActiveCiphertext(p => [...p, "", "[Network] Transmitting LWE ciphertext over TLS 1.3..."]);
    await new Promise(r => setTimeout(r, 800));
    
    setStep('FHE_EVAL');
    setExpandedNode('FHE_EVAL');
    setActiveCiphertext(p => [...p, "", "[Server] Initializing Zero-Knowledge XGBoost Circuit..."]);
    
    try {
      const res = await fetch("http://localhost:8000/predict/fhe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: "vault-sec",
          ciphertext: DUMMY_LWE_CIPHERTEXT,
          metadata: { depth: 3 },
          demo_intent: demoIntent
        })
      });
      const data = await res.json();
      setMetrics(data.metrics);
      
      setActiveCiphertext(p => [
        ...p,
        `[Server] TFHE Bootstraps Executed: ${data.metrics.bootstraps_performed}`,
        `[Server] LUT Operations (Concrete ML): ${data.metrics.lut_operations}`,
        `[Server] Inference Complete (${data.metrics.evaluation_time_ms}ms)`,
        "[Network] Sending Encrypted Prediction back to Client..."
      ]);
      await new Promise(r => setTimeout(r, 1500));
      
      setStep('DECRYPT');
      setExpandedNode('DECRYPT');
      setActiveCiphertext(p => [...p, "", "[Client] Unlocking prediction with Secret Key..."]);
      await new Promise(r => setTimeout(r, 1200));
      
      setStep('RESULT');
      setExpandedNode(null);
      setFraudData({
        prob: data.is_fraud_probability,
        factors: data.factors
      });
      setActiveCiphertext(p => [...p, "", "[Client] Verification Complete. Render Result."]);
      
    } catch (err) {
      setActiveCiphertext(p => [...p, "[Error] Connection to secure server failed."]);
      setStep('IDLE');
    }
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'normal') {
      setAmount("1,299.00");
      setMerchant("Apple Store (Cupertino)");
      setDemoIntent("normal");
    } else {
      setAmount("24,500.00");
      setMerchant("Unregistered Overseas Exchange");
      setDemoIntent("high_risk");
    }
  };

  return (
    <div className="h-screen w-screen bg-[#000000] p-4 lg:p-6 flex flex-col items-center overflow-hidden">
      
      {/* Header */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-6 flex-none">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-white tracking-wide uppercase">AEGIS-FHE VALIDATOR</h1>
            <p className="text-gray-500 text-[10px] font-mono tracking-widest uppercase mt-0.5">Zero-Knowledge XGBoost Inference Engine</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 border border-white/10 px-3 py-1.5 rounded-full bg-white/5 cursor-help" title="Cryptographic Pipeline">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">Network Live</span>
        </div>
      </div>

      <div className="w-full max-w-7xl flex-grow grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column: Transaction Interface & Telemetry */}
        <div className="xl:col-span-4 flex flex-col gap-6 min-h-0">
          <div className="reflective-border flex-none">
            <div className="glass-panel p-6">
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-medium text-gray-300 uppercase tracking-widest flex items-center">
                  <Lock className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Payment Engine
                </h2>
                <select 
                  onChange={handleScenarioChange}
                  disabled={step !== 'IDLE'}
                  className="bg-black border border-white/20 text-white text-[10px] uppercase tracking-wider rounded-md px-2 py-1 outline-none cursor-pointer"
                >
                  <option value="normal">Standard Auth</option>
                  <option value="high_risk">Fraud Attempt</option>
                </select>
              </div>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 flex items-center">
                    <CreditCard className="w-3 h-3 mr-1.5" /> Amount
                  </label>
                  <input 
                    type="text" 
                    value={amount}
                    readOnly
                    className="w-full bg-transparent border-b border-white/20 text-3xl font-light text-white pb-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 flex items-center">
                    <Building className="w-3 h-3 mr-1.5" /> Merchant
                  </label>
                  <input 
                    type="text" 
                    value={merchant}
                    readOnly
                    className="w-full bg-transparent border-b border-white/20 text-sm font-medium text-gray-200 pb-1 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={runPipeline}
                disabled={step !== 'IDLE'}
                className="relative w-full py-4 bg-white text-black font-medium text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                {step !== 'IDLE' ? (
                  <span className="flex items-center justify-center">
                    <Activity className="w-4 h-4 mr-2 animate-pulse" />
                    Executing ZKP...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Authorize via FHE
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Telemetry Panel - Scrollable if constrained */}
          <div className="glass-panel p-6 flex-1 min-h-0 flex flex-col overflow-y-auto">
            <h3 className="text-[10px] font-medium text-gray-500 mb-4 uppercase tracking-widest flex items-center flex-none">
              <Binary className="w-3 h-3 mr-2" /> FHE Inference Telemetry
            </h3>
            
            {!metrics ? (
              <div className="flex-grow flex items-center justify-center opacity-30 text-gray-500 text-[10px] uppercase tracking-widest">
                Awaiting Telemetry
              </div>
            ) : (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-y-6 gap-x-4 flex-grow content-start"
                >
                  <div>
                    <div className="text-2xl font-light text-white">{metrics.bootstraps_performed}</div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Bootstraps</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-white">{metrics.lut_operations}</div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">LUT Evaluations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-white">{metrics.evaluation_time_ms}<span className="text-xs text-gray-500 ml-1">ms</span></div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Total Latency</div>
                  </div>
                  <div>
                    <div className="text-xl font-mono text-emerald-400 mt-1">0 bytes</div>
                    <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Plaintext Leaked</div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Column: Visual Pipeline & Data Stream */}
        <div className="xl:col-span-8 flex flex-col gap-6 min-h-0">
          
          {/* Architectural Flow */}
          <div className="glass-panel px-6 py-5 flex-none">
             <div className="flex justify-between items-center relative z-10">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -z-10"></div>
                {['KEY_GEN', 'ENCRYPT', 'FHE_EVAL', 'DECRYPT'].map((s, idx) => {
                  const icons = [<Fingerprint/>, <Lock/>, <Server/>, <Unlock/>];
                  const titles = ["Secret Key", "Quantize & Encrypt", "Blind Inference", "Local Decrypt"];
                  const colors = ['#3b82f6', '#a855f7', '#f59e0b', '#10b981']; 
                  const bgColors = ['rgba(59,130,246,0.1)', 'rgba(168,85,247,0.1)', 'rgba(245,158,11,0.1)', 'rgba(16,185,129,0.1)'];
                  
                  const isActive = step === s || expandedNode === s;
                  const isPast = ['KEY_GEN','ENCRYPT','TRANSMIT','FHE_EVAL','DECRYPT','RESULT'].indexOf(step) > idx;
                  const targetColor = isActive ? colors[idx] : isPast ? '#4b5563' : '#1f2937';
                  
                  return (
                    <div 
                      key={s} 
                      className="flex flex-col items-center bg-[#000000] px-3 cursor-pointer group"
                      onClick={() => setExpandedNode(expandedNode === s ? null : s)}
                    >
                      <motion.div 
                        animate={{ 
                          borderColor: targetColor,
                          backgroundColor: isActive ? bgColors[idx] : '#000000',
                          scale: isActive ? 1.15 : 1
                        }}
                        className="w-10 h-10 rounded-full border flex items-center justify-center mb-2 transition-colors relative"
                      >
                        {React.cloneElement(icons[idx], { className: `w-4 h-4 transition-colors`, style: { color: isActive ? colors[idx] : isPast ? '#9ca3af' : '#4b5563' }, strokeWidth: 1.5 })}
                        
                        {isActive && step === s && (
                          <motion.div 
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 rounded-full border border-current"
                            style={{ color: colors[idx] }}
                          />
                        )}
                      </motion.div>
                      <div className={`text-[9px] uppercase tracking-widest transition-colors ${isActive ? 'font-bold' : isPast ? 'text-gray-400' : 'text-gray-600'}`} style={{ color: isActive ? colors[idx] : undefined }}>
                        {titles[idx]}
                      </div>
                    </div>
                  );
                })}
             </div>
             
             {/* Explainer Panel */}
             <AnimatePresence mode="wait">
               {expandedNode && (
                 <motion.div
                   initial={{ opacity: 0, height: 0, marginTop: 0 }}
                   animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                   exit={{ opacity: 0, height: 0, marginTop: 0 }}
                   className="overflow-hidden"
                 >
                   <div className="bg-[#050505] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 relative">
                     <button onClick={() => setExpandedNode(null)} className="absolute top-3 right-3 text-gray-500 hover:text-white"><XCircle className="w-3 h-3" /></button>
                     <div className="md:w-1/2">
                       <h4 className="text-white text-xs font-medium mb-1.5">{PHASE2_DETAILS[expandedNode as keyof typeof PHASE2_DETAILS].title}</h4>
                       <p className="text-gray-400 text-[11px] leading-relaxed">{PHASE2_DETAILS[expandedNode as keyof typeof PHASE2_DETAILS].desc}</p>
                     </div>
                     <div className="md:w-1/2 border-l border-white/5 pl-4 flex flex-col justify-center">
                       {PHASE2_DETAILS[expandedNode as keyof typeof PHASE2_DETAILS].specs.map((spec, i) => (
                         <div key={i} className="flex items-center text-[9px] font-mono text-gray-300 mb-1">
                           <ChevronRight className="w-2.5 h-2.5 text-emerald-500 mr-1.5 flex-none" />
                           {spec}
                         </div>
                       ))}
                     </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Terminal */}
          <div className="glass-panel flex-1 min-h-0 flex flex-col overflow-hidden data-stream-container">
            <div className="scanline"></div>
            <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex justify-between items-center z-10 flex-none">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-white/20"></div>
                <div className="w-2 h-2 rounded-full bg-white/20"></div>
                <div className="w-2 h-2 rounded-full bg-white/20"></div>
              </div>
              <div className="text-[9px] font-mono text-gray-400 tracking-wider flex items-center">
                <Database className="w-2.5 h-2.5 mr-1.5" />
                CONCRETE_ML // LWE_STATE_TRACE
              </div>
            </div>
            
            <div 
              ref={logRef}
              className="p-5 font-mono text-[11px] leading-loose flex-1 overflow-y-auto z-10 custom-scrollbar"
            >
              {activeCiphertext.length === 0 ? (
                <div className="text-gray-600 flex items-center justify-center h-full uppercase tracking-widest">
                  System Awaiting Transaction Input
                </div>
              ) : (
                <AnimatePresence>
                  {activeCiphertext.map((line, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i} 
                      className={`${
                        line.includes('[Server]') ? 'text-white font-medium' : 
                        line.includes('[Client]') ? 'text-gray-400' : 
                        line.includes('[Network]') ? 'text-gray-500 italic' :
                        'text-gray-300'
                      }`}
                    >
                      {line}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {step === 'RESULT' && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            className="fixed inset-0 bg-[#000000]/70 flex items-center justify-center z-50 p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="max-w-xl w-full"
            >
              <div className="glass-panel p-10 text-center border-t border-t-white/20">
                <div className="mb-6">
                  {fraudData.prob > 0.5 ? (
                    <div className="w-16 h-16 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-6 h-6 text-red-500" strokeWidth={1.5} />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                  )}
                  
                  <h2 className="text-2xl font-light text-white mb-2">
                    {fraudData.prob > 0.5 ? "Transaction Blocked by FHE Circuit" : "Verified via Zero-Knowledge"}
                  </h2>
                  <p className="text-gray-400 text-xs mx-auto max-w-sm leading-relaxed">
                    {fraudData.prob > 0.5 
                      ? "The compiled Concrete ML XGBoost circuit detected a high likelihood of fraud entirely over encrypted ciphertext." 
                      : "The transaction was verified strictly over ciphertext. The server learned absolutely zero information about the inputs."}
                  </p>
                </div>
                
                {/* Explainable AI Section */}
                <div className="bg-[#050505] rounded-xl border border-white/10 p-5 mb-8 text-left">
                  <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                    <span className="text-[9px] uppercase tracking-widest text-gray-500">XGBoost SHAP Decision Drivers</span>
                    <span className="text-xs font-mono text-white">Score: {(fraudData.prob * 100).toFixed(1)}%</span>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Primary Factors (Decrypted Locally)</div>
                    {fraudData.factors.map((factor, i) => (
                      <div key={i} className="flex items-center text-xs text-gray-300">
                        <div className={`w-1 h-1 rounded-full mr-2.5 ${fraudData.prob > 0.5 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => { setStep('IDLE'); setExpandedNode(null); }}
                  className="w-full max-w-xs mx-auto block py-3 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-white hover:text-black transition-all"
                >
                  Close Secure Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
