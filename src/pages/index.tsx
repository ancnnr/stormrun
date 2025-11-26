import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  MapPin, 
  Zap, 
  Users, 
  Radio, 
  Package, 
  Shield,
  TrendingUp,
  Globe,
  ChevronRight,
  Facebook,
  Instagram,
  Twitter,
  MessageCircle,
  X
} from "lucide-react";
import MailerLiteInlineBanner from "@/components/MailerLiteBanner";

declare global {
  interface Window {
    ml: any;
  }
}

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
        // 1. Setup the MailerLite queue function
        // This mirrors the inline script provided by MailerLite
        if (typeof window !== 'undefined') {
        window.ml = window.ml || function() {
            (window.ml.q = window.ml.q || []).push(arguments);
        };
        
        // 2. Set the account
        window.ml('account', '1933719');
        
        // 3. Load the external script manually (Standard React approach)
        // In a real Next.js app, you could swap this block for <Script src="..." />
        const scriptId = 'mailerlite-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://assets.mailerlite.com/js/universal.js';
            script.async = true;
            document.body.appendChild(script);
        }
        }
    }, []);

  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <>
      <Head>
        <title>StormRun - Outrun the Storm</title>
        <meta name="description" content="A post-apocalyptic running game where every step expands your safe zone." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-[#0b0f17] text-[#eaf0ff] overflow-x-hidden">
        {/* Hero Section */}

        <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Video Background */}
            <div className="absolute inset-0">
              <video
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{
                  width: '100vw',
                  height: '100vh',
                  filter: 'grayscale(70%) contrast(1.1) brightness(0.6)',
                }}
                src="/videos/stormrun_bgvideo.mp4"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/60 via-[#0b0f17]/40 to-[#0b0f17]" />
            </div>

          {/* Hero Content */}
          <div className="relative z-10 text-center px-6 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <div className="inline-block px-4 py-2 bg-[#121626]/80 border border-[#b18cff]/30 rounded-sm mb-6">
                <span className="text-[#b18cff] text-sm font-semibold tracking-wider">MISSION INCOMING</span>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-2 flex justify-center"
            >
              <Image
                src="https://assets.co.dev/2e3046f2-4707-4d97-af0a-c91172d86d90/stormrunlogoglow-67a324b.png"
                alt="StormRun Logo"
                width={600}
                height={200}
                className="w-full max-w-2xl h-auto"
                priority
              />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold mb-6 tracking-tight"
              style={{
                background: 'linear-gradient(to bottom, #eaf0ff, #1dffee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              OUTRUN THE STORM
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-2xl text-[#1dffee] mb-8 max-w-3xl mx-auto font-light tracking-wide"
            >
              A post-apocalyptic running game where every step expands your safe zone.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
            >
              <Button 
                size="lg" 
                className="bg-[#b18cff] hover:bg-[#9d75e6] text-[#0b0f17] font-bold text-lg px-8 py-6 group"
                onClick={()=>setIsModalOpen(true)}
              >
                Stay Informed
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>          

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>            
            <div className="ml-embedded" data-form="533xS0"></div>
          </Modal>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="absolute bottom-12 left-0 right-0 flex justify-center py-8"
          >
            <div className="grid grid-cols-3 gap-8 max-w-2xl w-full px-6">
              {[
                { value: "2.4M", label: "RUNNERS ACTIVE" },
                { value: "847K", label: "KM CONQUERED" },
                { value: "12", label: "FACTIONS" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-[#86efac] mb-1">{stat.value}</div>
                  <div className="text-xs text-[#1dffee] tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* How It Works - Narrative Scroll */}
        <NarrativeSection />

        {/* Core Features */}
        <FeaturesSection />

        {/* Footer */}
        <footer className="border-t border-[#1a1f2e] bg-[#0b0f17] py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#b18cff] to-[#1dffee] rounded-sm" />
                <div>
                  <div className="text-xl font-bold">STORMRUN</div>
                  <div className="text-sm text-[#1dffee]">Run for survival. Build the future.</div>
                </div>
              </div>
              {/* <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  className="border-[#1a1f2e] hover:border-[#b18cff]"
                  onClick={() => window.open('https://www.apple.com/app-store/', '_blank')}
                >
                  App Store
                </Button>
                <Button 
                  variant="outline" 
                  className="border-[#1a1f2e] hover:border-[#b18cff]"
                  onClick={() => window.open('https://play.google.com/store/apps?hl=en', '_blank')}
                >
                  Google Play
                </Button>
              </div> */}
            </div>
            
            {/* Social Media Icons */}
            <div className="flex justify-center gap-6 mb-8">
              <button
                onClick={()=>{}}
                className="w-10 h-10 rounded-sm border border-[#1a1f2e] hover:border-[#b18cff] flex items-center justify-center transition-colors group"
                aria-label="Discord"
              >
                <MessageCircle size={20} className="text-[#1dffee] group-hover:text-[#b18cff] transition-colors" />
              </button>
              <button
                onClick={()=>{}}
                className="w-10 h-10 rounded-sm border border-[#1a1f2e] hover:border-[#b18cff] flex items-center justify-center transition-colors group"
                aria-label="X (Twitter)"
              >
                <Twitter size={20} className="text-[#1dffee] group-hover:text-[#b18cff] transition-colors" />
              </button>
              <button
                onClick={()=>{}}
                className="w-10 h-10 rounded-sm border border-[#1a1f2e] hover:border-[#b18cff] flex items-center justify-center transition-colors group"
                aria-label="Facebook"
              >
                <Facebook size={20} className="text-[#1dffee] group-hover:text-[#b18cff] transition-colors" />
              </button>
              <button
                onClick={()=>{}}
                className="w-10 h-10 rounded-sm border border-[#1a1f2e] hover:border-[#b18cff] flex items-center justify-center transition-colors group"
                aria-label="Instagram"
              >
                <Instagram size={20} className="text-[#1dffee] group-hover:text-[#b18cff] transition-colors" />
              </button>
            </div>
            
            <div className="pt-8 border-t border-[#1a1f2e] text-center text-sm text-[#1dffee]/60">
              © 2025 StormRun. All rights reserved. | Audrey AI System Active
            </div>
          </div>
        </footer>

        {/* MailerLite Footer Bar */}
        {/* <div className="ml-bar" data-form="FMwXwl"></div> */}
        <MailerLiteInlineBanner initiallyVisible={true} />

      </div>
    </>
  );
}

function NarrativeSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  const stages = [
    {
      title: "RUN IN THE REAL WORLD",
      description: "Your routes become missions. Every street, every landmark transforms into contested territory in a dying world.",
      icon: MapPin,
      color: "#1dffee",
      image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
    },
    {
      title: "SURVIVE THE HAZARDS",
      description: "Radiation zones. Acid rain. Sandstorms. Dynamic environmental threats test your endurance and strategy.",
      icon: Zap,
      color: "#facc15",
      image: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&q=80",
    },
    {
      title: "EXPAND YOUR SAFE ZONE",
      description: "Connect outposts. Build territory. Every kilometer conquered pushes back the storm and strengthens your faction.",
      icon: Shield,
      color: "#86efac",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    },
  ];

  return (
    <section ref={ref} className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-block px-4 py-2 bg-[#121626]/80 border border-[#1dffee]/30 rounded-sm mb-6">
            <span className="text-[#1dffee] text-sm font-semibold tracking-wider">MISSION BRIEFING</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
            How It Works
          </h2>
        </motion.div>

        <div className="space-y-32">
          {stages.map((stage, index) => (
            <StageCard key={index} stage={stage} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StageCard({ stage, index }: { stage: any; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  const Icon = stage.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      className={`grid md:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
    >
      <div className={`${index % 2 === 1 ? 'md:order-2' : ''}`}>
        <div className="relative aspect-video rounded-sm overflow-hidden border border-[#1a1f2e]">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${stage.image})`,
              filter: 'grayscale(80%) contrast(1.1)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-transparent" />
          <div 
            className="absolute inset-0 border-2 opacity-50"
            style={{ borderColor: stage.color }}
          />
        </div>
      </div>
      <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-12 h-12 rounded-sm flex items-center justify-center"
            style={{ backgroundColor: `${stage.color}20`, border: `1px solid ${stage.color}` }}
          >
            <Icon size={24} style={{ color: stage.color }} />
          </div>
          <div className="text-sm font-semibold tracking-widest" style={{ color: stage.color }}>
            STAGE {index + 1}
          </div>
        </div>
        <h3 className="text-4xl font-bold mb-4 tracking-tight">{stage.title}</h3>
        <p className="text-lg text-[#1dffee] leading-relaxed">{stage.description}</p>
      </div>
    </motion.div>
  );
}

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  const features = [
    {
      icon: Activity,
      title: "Dynamic Route Generation",
      description: "AI-powered mission paths adapt to your location and fitness level.",
      color: "#b18cff",
    },
    {
      icon: Zap,
      title: "Hazard Events",
      description: "Real-time environmental threats that change your strategy mid-run.",
      color: "#facc15",
    },
    {
      icon: Shield,
      title: "Safe Zone Expansion",
      description: "Every run pushes back the storm and claims new territory.",
      color: "#86efac",
    },
    {
      icon: Users,
      title: "Avatar & Stats",
      description: "Track your survival metrics and customize your runner profile.",
      color: "#1dffee",
    },
    {
      icon: Globe,
      title: "Factions & Territory",
      description: "Join a faction and compete for global dominance.",
      color: "#fb923c",
    },
    {
      icon: Radio,
      title: "Audrey AI Narrator",
      description: "Your tactical companion guides you through every mission.",
      color: "#b18cff",
    },
    {
      icon: Package,
      title: "Supplies & Loot",
      description: "Discover gear and resources to enhance your capabilities.",
      color: "#86efac",
    },
    {
      icon: TrendingUp,
      title: "Progressive Difficulty",
      description: "Missions scale with your performance and faction rank.",
      color: "#1dffee",
    },
  ];

  return (
    <section ref={ref} className="py-32 px-6 relative bg-[#121626]/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-block px-4 py-2 bg-[#121626]/80 border border-[#b18cff]/30 rounded-sm mb-6">
            <span className="text-[#b18cff] text-sm font-semibold tracking-wider">TACTICAL SYSTEMS</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
            Core Features
          </h2>
          <p className="text-xl text-[#1dffee] max-w-2xl mx-auto">
            Advanced survival systems designed for the post-apocalyptic runner.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });
  const Icon = feature.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative bg-[#121626] border border-[#1a1f2e] p-6 rounded-sm group cursor-pointer overflow-hidden"
    >
      <motion.div
        animate={{ opacity: isHovered ? 0.1 : 0 }}
        className="absolute inset-0"
        style={{ backgroundColor: feature.color }}
      />
      <div className="relative z-10">
        <div 
          className="w-12 h-12 rounded-sm flex items-center justify-center mb-4 transition-all"
          style={{ 
            backgroundColor: `${feature.color}20`, 
            border: `1px solid ${isHovered ? feature.color : '#1a1f2e'}` 
          }}
        >
          <Icon size={24} style={{ color: feature.color }} />
        </div>
        <h3 className="text-xl font-bold mb-2 tracking-tight">{feature.title}</h3>
        <p className="text-sm text-[#1dffee]/80 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
}


function Modal({ isOpen, onClose, children }: {isOpen: boolean; onClose: () => void; children: React.ReactNode}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative rounded-lg shadow-xl w-full max-w-lg mx-4 transform transition-all duration-300 ${
        isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-100 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Form Container */}
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  );
};