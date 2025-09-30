import AboutSection from "./components/AboutSection"
import Footer from "./components/Footer"
import Header from "./components/Header"
import HeroSection from "./components/HeroSection"
import HowItWorks from "./components/HowItWorks"
import WaitlistSection from "./components/WaitlistSection"
const LandingPage = () => {
  return (
    <div>
      <Header />
      <HeroSection />
      <HowItWorks />
      <AboutSection />
      <WaitlistSection />
      <Footer />
    </div>
  )
}

export default LandingPage
