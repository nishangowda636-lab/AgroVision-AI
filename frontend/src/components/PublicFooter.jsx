import React from 'react';
import { Link } from 'react-router-dom';
import AgroVisionLogo from './AgroVisionLogo';
import { ShieldCheck, Heart, Leaf, ExternalLink } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#1B382D] bg-[#06100C] text-[#8FA59B] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Col 1: Brand Info */}
        <div className="space-y-3 lg:col-span-1">
          <Link to="/" className="inline-block focus:outline-none">
            <AgroVisionLogo
              variant="sidebar"
              className="block"
              imgClassName="max-h-[50px] w-auto max-w-[145px] object-contain"
            />
          </Link>
          <p className="text-xs text-[#8FA59B] leading-relaxed pt-1">
            Commercial Digital Farm Operating System uniting IoT soil telemetry, computer vision plant pathology, and predictive agronomic intelligence.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#10B981] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>Operational • 2026 Production Standard</span>
          </div>
        </div>

        {/* Col 2: Navigation Links */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-[#F3F7F5] uppercase tracking-wider text-[11px] font-mono mb-3">Navigation</h4>
          <ul className="space-y-2 text-[#8FA59B]">
            <li><Link to="/" className="hover:text-[#10B981] transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-[#10B981] transition-colors">About AgroVision</Link></li>
            <li><Link to="/features" className="hover:text-[#10B981] transition-colors">OS Features</Link></li>
            <li><Link to="/ai-farming" className="hover:text-[#10B981] transition-colors">AI Farming Intelligence</Link></li>
          </ul>
        </div>

        {/* Col 3: Core AI Intelligence */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-[#F3F7F5] uppercase tracking-wider text-[11px] font-mono mb-3">AI Intelligence Modules</h4>
          <ul className="space-y-2 text-[#8FA59B]">
            <li><Link to="/features" className="hover:text-[#10B981] transition-colors">Crop Health Scanner</Link></li>
            <li><Link to="/features" className="hover:text-[#10B981] transition-colors">Smart Irrigation Engine</Link></li>
            <li><Link to="/features" className="hover:text-[#10B981] transition-colors">Weather Radar Insights</Link></li>
            <li><Link to="/features" className="hover:text-[#10B981] transition-colors">Crop Viability Classifier</Link></li>
            <li><Link to="/features" className="hover:text-[#10B981] transition-colors">AI Farm Agent Co-Pilot</Link></li>
          </ul>
        </div>

        {/* Col 4: Trust & Compliance */}
        <div className="space-y-2.5 text-xs">
          <h4 className="font-bold text-[#F3F7F5] uppercase tracking-wider text-[11px] font-mono mb-3">Trust & Security</h4>
          <p className="text-[#8FA59B] leading-relaxed text-[11px]">
            Farmer-owned field telemetry • Multi-tenant database isolation • Calibrated ICAR & FAO-56 models.
          </p>
          <div className="pt-1 flex flex-col gap-1.5 text-[#8FA59B] text-[11px]">
            <span className="text-[#8FA59B]">Kisan Toll-Free: 1551</span>
            <Link to="/about" className="hover:text-[#10B981] transition-colors">Farmer Data Ownership Policy</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-5 border-t border-[#1B382D] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#577366]">
        <p>© 2026 AgroVision AI. Digital Farm Operating System. All rights reserved.</p>
        <p className="text-[11px] text-[#10B981]/90 font-mono">Precision Agriculture • High-Yield Sustainability</p>
      </div>
    </footer>
  );
}
