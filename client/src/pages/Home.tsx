import AppPromoBanner from "../Home/AppPromoBanner"
import Features from "../Home/Features"
import Hero from "../Home/Hero"
import HomeCategories from "../Home/HomeCategories"
import Newsletter from "../Home/Newsletter"
import PopularProducts from "../Home/PopularProducts"


const Home = () => {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Hero/>
      <Features/>
      <HomeCategories/>
      <PopularProducts/>
      <AppPromoBanner/>
      <Newsletter/>
      
    </div>
  )
}

export default Home
