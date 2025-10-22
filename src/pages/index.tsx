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
  Crown,
  ChevronRight
} from "lucide-react";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
            <iframe
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                width: '100vw',
                height: '100vh',
                filter: 'grayscale(70%) contrast(1.1) brightness(0.6)',
              }}
              src="https://www.youtube.com/embed/MuS3P9FTyk4?autoplay=1&mute=1&loop=1&playlist=MuS3P9FTyk4&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&disablekb=1&fs=0&iv_load_policy=3"
              title="Background video"
              allow="autoplay; encrypted-media"
              allowFullScreen={false}
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
              className="mb-6 flex justify-center"
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
              className="text-3xl md:text-4xl font-bold mb-4 tracking-tight"
              style={{
                background: 'linear-gradient(to bottom, #eaf0ff, #93c5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Outrun the storm
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-2xl text-[#93c5fd] mb-12 max-w-3xl mx-auto font-light tracking-wide"
            >
              A post-apocalyptic running game where every step expands your safe zone.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                size="lg" 
                className="bg-[#b18cff] hover:bg-[#9d75e6] text-[#0b0f17] font-bold text-lg px-8 py-6 group"
              >
                Download the App
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-[#93c5fd] text-[#93c5fd] hover:bg-[#93c5fd]/10 font-semibold text-lg px-8 py-6"
              >
                Watch Trailer
              </Button>
            </motion.div>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              {[
                { value: "2.4M", label: "RUNNERS ACTIVE" },
                { value: "847K", label: "KM CONQUERED" },
                { value: "12", label: "FACTIONS" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-[#86efac] mb-1">{stat.value}</div>
                  <div className="text-xs text-[#93c5fd] tracking-widest">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-[#b18cff]/50 rounded-full flex items-start justify-center p-2">
              <motion.div 
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-[#b18cff] rounded-full"
              />
            </div>
          </motion.div>
        </section>

        {/* How It Works - Narrative Scroll */}
        <NarrativeSection />

        {/* Core Features */}
        <FeaturesSection />

        {/* The World of StormRun */}
        <WorldSection />

        {/* Factions & Community */}
        <FactionsSection />

        {/* Membership Tiers */}
        <MembershipSection />

        {/* Footer */}
        <footer className="border-t border-[#1a1f2e] bg-[#0b0f17] py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#b18cff] to-[#93c5fd] rounded-sm" />
                <div>
                  <div className="text-xl font-bold">STORMRUN</div>
                  <div className="text-sm text-[#93c5fd]">Run for survival. Build the future.</div>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="border-[#1a1f2e] hover:border-[#b18cff]">
                  App Store
                </Button>
                <Button variant="outline" className="border-[#1a1f2e] hover:border-[#b18cff]">
                  Google Play
                </Button>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-[#1a1f2e] text-center text-sm text-[#93c5fd]/60">
              © 2025 StormRun. All rights reserved. | Audrey AI System Active
            </div>
          </div>
        </footer>
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
      color: "#93c5fd",
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
          <div className="inline-block px-4 py-2 bg-[#121626]/80 border border-[#93c5fd]/30 rounded-sm mb-6">
            <span className="text-[#93c5fd] text-sm font-semibold tracking-wider">MISSION BRIEFING</span>
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
        <p className="text-lg text-[#93c5fd] leading-relaxed">{stage.description}</p>
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
      color: "#93c5fd",
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
      color: "#93c5fd",
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
          <p className="text-xl text-[#93c5fd] max-w-2xl mx-auto">
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
        <p className="text-sm text-[#93c5fd]/80 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
}

function WorldSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section ref={ref} className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%) contrast(1.3)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17] via-transparent to-[#0b0f17]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-block px-4 py-2 bg-[#121626]/80 border border-[#86efac]/30 rounded-sm mb-6">
            <span className="text-[#86efac] text-sm font-semibold tracking-wider">WORLD STATUS</span>
          </div>
          <h2 className="text-6xl md:text-7xl font-bold tracking-tighter mb-8">
            The World of StormRun
          </h2>
          <p className="text-2xl text-[#93c5fd] mb-6 leading-relaxed">
            Every street conquered builds your world.
          </p>
          <p className="text-2xl text-[#86efac] leading-relaxed">
            Every run expands your future.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-20 relative"
        >
          <div className="aspect-video rounded-sm overflow-hidden border border-[#1a1f2e] relative">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80)`,
                filter: 'grayscale(90%) contrast(1.2) brightness(0.7)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-transparent" />
            {/* Grid overlay */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(rgba(177, 140, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(177, 140, 255, 0.5) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FactionsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  const factions = [
    { name: "Phoenix Collective", territory: "847K km²", color: "#fb923c", members: "342K" },
    { name: "Storm Chasers", territory: "723K km²", color: "#93c5fd", members: "298K" },
    { name: "Neon Runners", territory: "691K km²", color: "#b18cff", members: "276K" },
    { name: "Wasteland Warriors", territory: "654K km²", color: "#86efac", members: "251K" },
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
          <div className="inline-block px-4 py-2 bg-[#121626]/80 border border-[#fb923c]/30 rounded-sm mb-6">
            <span className="text-[#fb923c] text-sm font-semibold tracking-wider">GLOBAL NETWORK</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
            Factions & Community
          </h2>
          <p className="text-xl text-[#93c5fd] max-w-2xl mx-auto">
            Join forces. Claim territory. Dominate the leaderboard.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {factions.map((faction, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-[#121626] border border-[#1a1f2e] p-6 rounded-sm hover:border-opacity-50 transition-all cursor-pointer group"
              style={{ borderColor: `${faction.color}40` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: faction.color, boxShadow: `0 0 20px ${faction.color}` }}
                  />
                  <h3 className="text-xl font-bold">{faction.name}</h3>
                </div>
                <Crown size={20} style={{ color: faction.color }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold" style={{ color: faction.color }}>
                    {faction.territory}
                  </div>
                  <div className="text-xs text-[#93c5fd]/60 tracking-wider">TERRITORY</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#86efac]">{faction.members}</div>
                  <div className="text-xs text-[#93c5fd]/60 tracking-wider">MEMBERS</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-[#121626] border border-[#facc15]/30 p-8 rounded-sm text-center"
        >
          <Zap size={32} className="mx-auto mb-4 text-[#facc15]" />
          <h3 className="text-2xl font-bold mb-2">UPCOMING EVENT</h3>
          <p className="text-[#facc15] text-lg mb-4">Solar Flare Blackout</p>
          <p className="text-[#93c5fd]/80 text-sm">
            Global faction competition begins in 72 hours. Double territory gains.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function MembershipSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  const tiers = [
    {
      name: "Core Access",
      price: "Free",
      description: "Core missions and safe zone expansion.",
      features: [
        "Basic route generation",
        "Standard hazard events",
        "Safe zone tracking",
        "Faction membership",
      ],
      color: "#93c5fd",
      cta: "Start Running",
    },
    {
      name: "StormPass",
      price: "$9.99/mo",
      description: "Elite missions, advanced gear, faction intelligence.",
      features: [
        "Advanced AI routing",
        "Exclusive hazard events",
        "Premium gear unlocks",
        "Faction intelligence reports",
        "Priority event access",
      ],
      color: "#b18cff",
      cta: "Upgrade Now",
      featured: true,
    },
    {
      name: "Founder's Tier",
      price: "$149",
      description: "Global events, exclusive storylines, lifetime access.",
      features: [
        "Lifetime StormPass access",
        "Exclusive story missions",
        "Founder's badge & gear",
        "Early feature access",
        "Direct dev feedback channel",
      ],
      color: "#facc15",
      cta: "Claim Founder Status",
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
          <div className="inline-block px-4 py-2 bg-[#121626]/80 border border-[#b18cff]/30 rounded-sm mb-6">
            <span className="text-[#b18cff] text-sm font-semibold tracking-wider">MISSION DOSSIERS</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4">
            Choose Your Path
          </h2>
          <p className="text-xl text-[#93c5fd] max-w-2xl mx-auto">
            Select the tier that matches your survival strategy.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`bg-[#121626] border rounded-sm p-8 relative ${
                tier.featured ? 'border-[#b18cff] md:scale-105' : 'border-[#1a1f2e]'
              }`}
            >
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#b18cff] text-[#0b0f17] text-xs font-bold rounded-sm">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="text-4xl font-bold mb-2" style={{ color: tier.color }}>
                  {tier.price}
                </div>
                <p className="text-sm text-[#93c5fd]/80">{tier.description}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div 
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-[#eaf0ff]/80">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full font-semibold ${
                  tier.featured 
                    ? 'bg-[#b18cff] hover:bg-[#9d75e6] text-[#0b0f17]' 
                    : 'bg-[#121626] border border-[#1a1f2e] hover:border-opacity-50'
                }`}
                style={!tier.featured ? { borderColor: tier.color } : {}}
              >
                {tier.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}