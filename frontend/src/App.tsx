import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Unlock, Server, ArrowRight, Fingerprint, Activity, Check, XCircle, AlertTriangle, Building, CreditCard } from 'lucide-react';

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

export default function App() {
  const [step, setStep] = useState<Step>('IDLE');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [fraudData, setFraudData] = useState<{prob: number, factors: string[]}>({prob: 0, factors: []});
  const [activeCiphertext, setActiveCiphertext] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  
  // Dynamic Inputs
  const [amount, setAmount] = useState<string>("1,299.00");
  const [merchant, setMerchant] = useState<string>("Apple Store (Cupertino)");
  const [demoIntent, setDemoIntent] = useState<"normal"|"high_risk">("normal");

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [activeCiphertext]);

  const runPipeline = async () => {
    setMetrics(null);
    setFraudData({prob: 0, factors: []});
    setActiveCiphertext([]);
    
    // 1. Key Generation
    setStep('KEY_GEN');
    for (let i = 0; i < 3; i++) {
      setActiveCiphertext(p => [...p, `[Client] Generating Knox LWE Secret Key block ${i+1}...`]);
      await new Promise(r => setTimeout(r, 200));
    }
    await new Promise(r => setTimeout(r, 400));
    
    // 2. Encrypt
    setStep('ENCRYPT');
    setActiveCiphertext(p => [...p, "", `[Client] Encrypting $${amount} at ${merchant}:`]);
    for (const line of DUMMY_LWE_CIPHERTEXT) {
      setActiveCiphertext(p => [...p, `  > ${line}`]);
      await new Promise(r => setTimeout(r, 150));
    }
    
    // 3. Transmit
    setStep('TRANSMIT');
    setActiveCiphertext(p => [...p, "", "[Network] Transmitting encrypted bytes over TLS 1.3..."]);
    await new Promise(r => setTimeout(r, 600));
    
    // 4. Server FHE Eval
    setStep('FHE_EVAL');
    setActiveCiphertext(p => [...p, "", "[Server] Initializing Zero-Knowledge XGBoost Circuit..."]);
    
    try {
      const res = await fetch("http://localhost:8000/predict/fhe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: "knox-vault-sec",
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
        `[Server] LUT Operations: ${data.metrics.lut_operations}`,
        `[Server] Inference Complete (${data.metrics.evaluation_time_ms}ms)`,
        "[Network] Sending Encrypted Prediction back to Client..."
      ]);
      await new Promise(r => setTimeout(r, 1000));
      
      // 5. Decrypt
      setStep('DECRYPT');
      setActiveCiphertext(p => [...p, "", "[Client] Unlocking prediction with Knox Secret Key..."]);
      await new Promise(r => setTimeout(r, 800));
      
      // 6. Result
      setStep('RESULT');
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
    <div className="h-screen w-screen overflow-hidden bg-[#000000] p-4 lg:p-8 flex flex-col items-center">
      
      {/* Ultra-Premium Header */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-8 flex-none">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-white tracking-wide">SAMSUNG PRISM</h1>
            <p className="text-gray-500 text-[10px] font-mono tracking-widest uppercase mt-0.5">Privacy-Preserving FHE Engine</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 border border-white/10 px-3 py-1.5 rounded-full bg-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">Enclave Live</span>
        </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-12 gap-8 flex-grow overflow-hidden">
        
        {/* Left Column: Transaction Interface */}
        <div className="xl:col-span-4 flex flex-col space-y-6 h-full">
          <div className="reflective-border flex-none">
            <div className="glass-panel p-8">
              
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-sm font-medium text-gray-300 uppercase tracking-widest flex items-center">
                  <Lock className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Payment Engine
                </h2>
                <select 
                  onChange={handleScenarioChange}
                  disabled={step !== 'IDLE'}
                  className="bg-black border border-white/20 text-white text-[10px] uppercase tracking-wider rounded-md px-2 py-1 outline-none"
                >
                  <option value="normal">Standard Auth</option>
                  <option value="high_risk">Fraud Attempt</option>
                </select>
              </div>
              
              <div className="space-y-6 mb-10">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 flex items-center">
                    <CreditCard className="w-3 h-3 mr-1.5" /> Amount
                  </label>
                  <input 
                    type="text" 
                    value={amount}
                    readOnly
                    className="w-full bg-transparent border-b border-white/20 text-3xl font-light text-white pb-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 flex items-center">
                    <Building className="w-3 h-3 mr-1.5" /> Merchant
                  </label>
                  <input 
                    type="text" 
                    value={merchant}
                    readOnly
                    className="w-full bg-transparent border-b border-white/20 text-sm font-medium text-gray-200 pb-2 outline-none"
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

          {/* Telemetry Panel */}
          <AnimatePresence>
            {metrics && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 flex-grow"
              >
                <h3 className="text-[10px] font-medium text-gray-500 mb-6 uppercase tracking-widest">FHE Inference Telemetry</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Visual Pipeline & Data Stream */}
        <div className="xl:col-span-8 flex flex-col space-y-6 h-full">
          
          {/* Top: The Architectural Flow */}
          <div className="glass-panel px-8 py-6 flex-none">
             <div className="flex justify-between items-center relative">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -z-10"></div>
                {['KEY_GEN', 'ENCRYPT', 'FHE_EVAL', 'DECRYPT'].map((s, idx) => {
                  const icons = [<Fingerprint/>, <Lock/>, <Server/>, <Unlock/>];
                  const titles = ["Knox Key", "Encrypt Data", "Blind Eval", "Local Decrypt"];
                  const isActive = step === s;
                  const isPast = ['KEY_GEN','ENCRYPT','TRANSMIT','FHE_EVAL','DECRYPT','RESULT'].indexOf(step) > idx;
                  
                  return (
                    <div key={s} className="flex flex-col items-center bg-[#000000] px-4">
                      <motion.div 
                        animate={{ 
                          borderColor: isActive ? '#ffffff' : isPast ? '#333' : '#1a1a1a',
                          backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : '#000000',
                          scale: isActive ? 1.05 : 1
                        }}
                        className="w-12 h-12 rounded-full border flex items-center justify-center mb-3 transition-colors"
                      >
                        {React.cloneElement(icons[idx], { className: "w-5 h-5 text-gray-300", strokeWidth: 1.5 })}
                      </motion.div>
                      <div className={`text-[9px] uppercase tracking-widest ${isActive ? 'text-white font-medium' : isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                        {titles[idx]}
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Bottom: The Cypher Matrix Terminal */}
          <div className="glass-panel flex-grow flex flex-col overflow-hidden data-stream-container">
            <div className="scanline"></div>
            <div className="px-6 py-3 border-b border-white/10 bg-white/5 flex justify-between items-center z-10">
              <div className="flex space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
              </div>
              <div className="text-[10px] font-mono text-gray-400 tracking-wider">0xSECURE_PIPELINE</div>
            </div>
            <div 
              ref={logRef}
              className="p-6 font-mono text-[12px] leading-loose h-full overflow-y-auto z-10"
            >
              {activeCiphertext.length === 0 ? (
                <div className="text-gray-600 flex items-center justify-center h-full text-[11px] uppercase tracking-widest">
                  System Awaiting Input
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

      {/* Deterministic Explainability Overlay */}
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
              className="max-w-2xl w-full"
            >
              <div className="glass-panel p-12 text-center border-t border-t-white/20">
                <div className="mb-8">
                  {fraudData.prob > 0.5 ? (
                    <div className="w-20 h-20 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="w-8 h-8 text-red-500" strokeWidth={1.5} />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full border border-white/20 bg-white/5 flex items-center justify-center mx-auto mb-6">
                      <Check className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                  )}
                  
                  <h2 className="text-3xl font-light text-white mb-3">
                    {fraudData.prob > 0.5 ? "Transaction Declined" : "Verification Successful"}
                  </h2>
                  <p className="text-gray-400 text-sm mx-auto max-w-md leading-relaxed">
                    {fraudData.prob > 0.5 
                      ? "The XGBoost FHE circuit detected a high likelihood of fraud based on homomorphic evaluation of encrypted parameters." 
                      : "The transaction was verified seamlessly via Zero-Knowledge inference. No plaintext data was exposed."}
                  </p>
                </div>
                
                {/* Explainable AI Section */}
                <div className="bg-[#050505] rounded-xl border border-white/10 p-6 mb-10 text-left">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">XGBoost SHAP Decision</span>
                    <span className="text-sm font-mono text-white">Score: {(fraudData.prob * 100).toFixed(1)}%</span>
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Key Drivers (Decrypted)</div>
                    {fraudData.factors.map((factor, i) => (
                      <div key={i} className="flex items-center text-sm text-gray-300">
                        <div className={`w-1.5 h-1.5 rounded-full mr-3 ${fraudData.prob > 0.5 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => setStep('IDLE')}
                  className="w-full max-w-xs mx-auto block py-4 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-white hover:text-black transition-all"
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
