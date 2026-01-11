import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-slate-900 bg-opacity-85 backdrop-blur-md border-b border-white border-opacity-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            RA Software Solutions
          </div>
          <button
            onClick={handleLoginClick}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 opacity-20"></div>
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white bg-opacity-10 rounded-full"
              style={{
                width: `${Math.random() * 5 + 2}px`,
                height: `${Math.random() * 5 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 10}s infinite`,
              }}
            ></div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
            Transform Your Business with <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Smart Solutions</span>
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto" style={{color: 'var(--dark-light)'}}>
            Enterprise-grade billing software and cloud solutions tailored for retail businesses. Manage inventory, process transactions, and grow your business seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleLoginClick}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-white bg-opacity-10 border border-white border-opacity-30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-opacity-20 transition-all duration-300 backdrop-blur-sm"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-semibold mb-4">
              Our Solutions
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Comprehensive Software Suite</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From billing to business intelligence, we provide end-to-end solutions designed specifically for retail and service businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Retail Billing Software */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mb-6">
                🧾
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Retail Billing Software</h3>
              <p className="text-gray-600 mb-6">Complete POS and billing solution for silks, readymades, and retail stores with real-time inventory tracking.</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  GST-compliant invoicing
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Barcode scanning support
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Multi-payment modes
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Customer database management
                </li>
              </ul>
            </div>

            {/* Cloud Solutions */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mb-6">
                ☁️
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Cloud Solutions</h3>
              <p className="text-gray-600 mb-6">Secure, scalable cloud infrastructure with automatic backups and 99.9% uptime guarantee.</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Access from anywhere
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Real-time synchronization
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Automated daily backups
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Enterprise-grade security
                </li>
              </ul>
            </div>

            {/* Custom Web Applications */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mb-6">
                🌐
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Custom Web Applications</h3>
              <p className="text-gray-600 mb-6">Bespoke web solutions tailored to your unique business requirements and workflows.</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Responsive design
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Modern UI/UX
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Integration-ready
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Scalable architecture
                </li>
              </ul>
            </div>

            {/* Mobile Applications */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mb-6">
                📱
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Mobile Applications</h3>
              <p className="text-gray-600 mb-6">Native iOS and Android apps for on-the-go business management and customer engagement.</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Offline mode support
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Push notifications
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Biometric authentication
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Cross-platform sync
                </li>
              </ul>
            </div>

            {/* Jewellery Solutions */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mb-6">
                💎
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Jewellery Solutions</h3>
              <p className="text-gray-600 mb-6">Specialized software for jewellery stores with AR visualization and precious metal tracking.</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  AR try-on (Coming Soon)
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Gold/Silver rate tracking
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Making charges calculation
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Certification management
                </li>
              </ul>
            </div>

            {/* Appointment Booking */}
            <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mb-6">
                📅
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Appointment Booking</h3>
              <p className="text-gray-600 mb-6">Smart scheduling system with automated reminders and calendar integration.</p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Online booking portal
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  SMS/Email reminders
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Resource management
                </li>
                <li className="flex items-center text-gray-700">
                  <span className="text-indigo-500 mr-2">✓</span>
                  Payment integration
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-semibold mb-4">
              Industries We Serve
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Trusted Across Multiple Sectors</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our solutions are designed to meet the unique needs of various industries.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8">
            {/* Textile & Apparel */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                👗
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Textile & Apparel</h3>
            </div>

            {/* Jewellery Stores */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                💍
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Jewellery Stores</h3>
            </div>

            {/* Retail Shops */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                🏪
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Retail Shops</h3>
            </div>

            {/* Healthcare */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                🏥
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Healthcare</h3>
            </div>

            {/* Restaurants */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                🍽️
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Restaurants</h3>
            </div>

            {/* Salons & Spas */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                💇
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Salons & Spas</h3>
            </div>

            {/* Fitness Centers */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                🏋️
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Fitness Centers</h3>
            </div>

            {/* Education */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                📚
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Education</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full font-semibold mb-4">
              Why Choose Us
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Built for Performance</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our solutions are engineered with cutting-edge technology to deliver exceptional performance and reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                ⚡
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Lightning Fast</h4>
                <p className="text-gray-600">Optimized for speed with response times under 100ms. Process hundreds of transactions per minute without lag.</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                🔒
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Bank-Level Security</h4>
                <p className="text-gray-600">End-to-end encryption and compliance with industry standards to keep your data safe and secure.</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                📊
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Real-Time Analytics</h4>
                <p className="text-gray-600">Gain instant insights with powerful dashboards and reporting tools to make data-driven decisions.</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                🤝
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">24/7 Support</h4>
                <p className="text-gray-600">Dedicated support team available round the clock to assist you whenever you need help.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of businesses already using our solutions to streamline operations and boost productivity. Get started today with a free consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleLoginClick}
              className="bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Started Now
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-white bg-opacity-20 border border-white border-opacity-30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-opacity-30 transition-all duration-300 backdrop-blur-sm"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
                RA Software Solutions
              </h3>
              <p className="mb-6" style={{color: 'var(--dark-light)'}}>
                Empowering businesses with innovative software solutions. Your trusted partner for digital transformation.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    📱
                  </div>
                  <a href="tel:+918248904925" className="hover:text-white transition-colors" style={{color: 'var(--dark-light)'}}>
                    +91 8248904925
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    ✉️
                  </div>
                  <a href="mailto:mranjith2016@gmail.com" className="hover:text-white transition-colors" style={{color: 'var(--dark-light)'}}>
                    mranjith2016@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Products</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors" style={{color: 'var(--dark-light)'}}>Billing Software</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{color: 'var(--dark-light)'}}>Cloud Solutions</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{color: 'var(--dark-light)'}}>Mobile Apps</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{color: 'var(--dark-light)'}}>Custom Development</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors" style={{color: 'var(--dark-light)'}}>About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{color: 'var(--dark-light)'}}>Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{color: 'var(--dark-light)'}}>Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors" style={{color: 'var(--dark-light)'}}>Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-200 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-200 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-200 hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-200">
            <p>© 2026 RA Software Solutions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;