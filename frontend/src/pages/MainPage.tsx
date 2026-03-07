import React from 'react';
import NavbarComponent from '../components/section/NavbarComponent';
import MainText from '../components/herosection/MainText';
import TopRatedSection from '../components/herosection/TopRatedSection';
import ReviewsSection from '../components/herosection/ReviewsSection';
import FAQSection from '../components/herosection/FAQSection';
import FooterComponent from '../components/section/FooterComponent';

const MainPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarComponent />
      <MainText />
      <main className="flex-grow">
        <TopRatedSection />
        <ReviewsSection />
        <FAQSection />
      </main>
      <FooterComponent />
    </div>
  );
};

export default MainPage;
