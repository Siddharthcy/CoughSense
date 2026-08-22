"use client"

import SiteHeader from "@/components/site-header"
import Hero from "@/components/hero"
import ScreeningCard from "@/components/screening-card"
import HowItWorks from "@/components/how-it-works"
import ModelResults from "@/components/model-results"
import ArchitectureDiagram from "@/components/architecture-diagram"
import TechStack from "@/components/tech-stack"
import Disclaimer from "@/components/disclaimer"
import Footer from "@/components/footer"

export default function Page() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div id="top" className="relative min-h-screen overflow-x-hidden">
      {/* ambient background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 520px at 50% -10%, oklch(0.82 0.13 195 / 14%), transparent 70%), radial-gradient(700px 500px at 85% 30%, oklch(0.72 0.12 190 / 9%), transparent 70%), radial-gradient(800px 600px at 10% 75%, oklch(0.6 0.1 250 / 12%), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, oklch(0.16 0.025 250 / 60%) 60%, oklch(0.16 0.025 250) 100%)",
          }}
        />
      </div>

      <SiteHeader />

      <main>
        <Hero
          onStart={() => scrollTo("screening")}
          onHowItWorks={() => scrollTo("how-it-works")}
        />
        <ScreeningCard />
        <HowItWorks />
        <ModelResults />
        <ArchitectureDiagram />
        <TechStack />
        <Disclaimer />
      </main>

      <Footer />
    </div>
  )
}
