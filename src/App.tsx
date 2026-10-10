/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Phone, 
  Calendar, 
  MapPin, 
  Clock, 
  Star, 
  CheckCircle2, 
  Heart, 
  ShieldCheck, 
  Award, 
  Users, 
  Check, 
  MessageSquare, 
  X, 
  Menu, 
  ArrowRight, 
  Activity, 
  Plus, 
  HelpCircle,
  Share2,
  BookmarkCheck,
  Languages,
  LogIn,
  LogOut,
  User as UserIcon,
  CloudLightning,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CLINIC_INFO, CLINIC_TIMINGS, SERVICES_DATA, REVIEWS_DATA, ABOUT_STORY } from './data';
import { Appointment, ServiceItem } from './types';
import { auth, googleProvider, db, signInWithPopup, signOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';

// Absolute URL of the generated doctor portrait resolved inside the public paths
const doctorImg = "/src/assets/images/doctor_portrait_1782113102938.jpg";

export default function App() {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'about' | 'reviews' | 'contact'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Appointment Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    timeSlot: '09:30 AM - 10:00 AM',
    reason: ''
  });
  
  // Booked appointments list stored locally or via Firestore
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [submittedAppointment, setSubmittedAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [language, setLanguage] = useState<'bilingual' | 'english'>('bilingual');

  // Load existing bookings from localStorage or set up Firebase Firestore realtime listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        // Set up pre-filled fields if possible
        setFormData(prev => ({
          ...prev,
          name: prev.name || currentUser.displayName || ''
        }));

        // Realtime sync from Firestore
        const q = query(collection(db, "appointments"), where("userId", "==", currentUser.uid));
        const unsubFirestore = onSnapshot(q, (snapshot) => {
          const list: Appointment[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            list.push({ 
              id: doc.id, 
              ...data,
              // Fallback to generic dates if not in string
              createdAt: data.createdAt ? new Date(data.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')
            } as Appointment);
          });
          // Memory sort descending by date or creation
          list.sort((a, b) => new Date(b.date + ' ' + b.timeSlot.split(' - ')[0]).getTime() - new Date(a.date + ' ' + a.timeSlot.split(' - ')[0]).getTime());
          setAppointments(list);
        }, (err) => {
          console.error("Firestore loading error:", err);
        });

        return () => {
          unsubFirestore();
        };
      } else {
        // Logged out: fallback load from localStorage
        const saved = localStorage.getItem('prakruti_appointments');
        if (saved) {
          try {
            setAppointments(JSON.parse(saved));
          } catch (e) {
            console.error("Error reading localStorage appointments", e);
          }
        } else {
          setAppointments([]);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync state with localStorage (used primarily for guest flow)
  const saveAppointments = (updated: Appointment[]) => {
    setAppointments(updated);
    localStorage.setItem('prakruti_appointments', JSON.stringify(updated));
  };

  // Login handler
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Google Auth popup failed:", e);
      alert("Could not complete Google authentication. Please try again.");
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAppointments([]);
    } catch (e) {
      console.error("Sign out fail:", e);
    }
  };

  // Switch tabs and scroll to top automatically
  const navigateTo = (tab: 'home' | 'services' | 'about' | 'reviews' | 'contact') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Time slot options
  const timeSlots = [
    "09:30 AM - 10:00 AM",
    "10:00 AM - 10:30 AM",
    "10:30 AM - 11:00 AM",
    "11:00 AM - 11:30 AM",
    "11:30 AM - 12:00 PM",
    "12:00 PM - 12:30 PM",
    "12:30 PM - 01:00 PM",
    "05:30 PM - 06:00 PM",
    "06:00 PM - 06:30 PM",
    "06:30 PM - 07:00 PM",
    "07:00 PM - 07:30 PM",
    "07:30 PM - 08:00 PM",
    "08:00 PM - 08:30 PM",
    "08:30 PM - 09:00 PM",
    "09:00 PM - 09:30 PM"
  ];

  // Handle appointment scheduling
  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.date || !formData.reason) {
      alert("Please fill in all details required.");
      return;
    }

    setIsSubmitting(true);

    const appDetails = {
      name: formData.name,
      phone: formData.phone,
      date: formData.date,
      timeSlot: formData.timeSlot,
      reason: formData.reason,
      status: 'Confirmed' as const,
      createdAt: new Date().toISOString()
    };

    if (user) {
      // Secure Cloud Integration
      try {
        const docRef = await addDoc(collection(db, "appointments"), {
          ...appDetails,
          userId: user.uid
        });
        const createdApp: Appointment = {
          id: docRef.id,
          ...appDetails,
          createdAt: new Date().toLocaleString('en-IN')
        };
        setSubmittedAppointment(createdApp);
      } catch (err) {
        console.error("Firestore addDoc error, falling back locally:", err);
        // Fallback safely to guest mode
        const fallbackApp: Appointment = {
          id: `Backup-${Math.floor(1000 + Math.random() * 9000)}`,
          ...appDetails,
          createdAt: new Date().toLocaleString('en-IN')
        };
        saveAppointments([fallbackApp, ...appointments]);
        setSubmittedAppointment(fallbackApp);
      }
    } else {
      // Guest booking
      const guestApp: Appointment = {
        id: `PFC-${Math.floor(1000 + Math.random() * 9000)}`,
        ...appDetails,
        createdAt: new Date().toLocaleString('en-IN')
      };

      const updated = [guestApp, ...appointments];
      saveAppointments(updated);
      setSubmittedAppointment(guestApp);
    }

    setIsSubmitting(false);

    // Reset form fields (retain demographic fields for better UX)
    setFormData(prev => ({
      ...prev,
      date: '',
      timeSlot: '09:30 AM - 10:00 AM',
      reason: ''
    }));
  };

  // Delete/Cancel appointment
  const cancelAppointment = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, "appointments", id));
      } catch (err) {
        console.error("Firestore deleteDoc error:", err);
        alert("Couldn't remove appointment from Firestore cloud.");
      }
    } else {
      const filtered = appointments.filter(app => app.id !== id);
      saveAppointments(filtered);
    }

    if (submittedAppointment?.id === id) {
      setSubmittedAppointment(null);
    }
  };

  // Generate whatsapp dynamic share text
  const getWhatsAppShareText = (app: Appointment) => {
    const text = `*New Appointment Registered with Prakruti Family Clinic*\n\n` +
      `*Patient Name:* ${app.name}\n` +
      `*Phone Number:* ${app.phone}\n` +
      `*Appointment Date:* ${app.date}\n` +
      `*Preferred Slot:* ${app.timeSlot}\n` +
      `*Reason for Visit:* ${app.reason}\n` +
      `*Token Reference:* ${app.id}\n\n` +
      `Please confirm the slot from your system. Thank you!`;
    return `https://wa.me/919892858656?text=${encodeURIComponent(text)}`;
  };

  // Determine current day to highlight in Contact opening hrs
  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-screen flex flex-col selection:bg-brand-green-200 selection:text-brand-green-800 text-brand-green-800 antialiased font-sans">
      
      {/* 🟢 CLINIC STATUS ALERT STRIP */}
      <div id="status-strip" className="bg-brand-green-800 text-white py-1 px-4 text-xs font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-1 sm:space-y-0 text-center">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.h-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>📍 Shop No 2, Kisan Nagar 3, Rabodi, Thane West, MH - 400601</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-300 font-bold">🟢 Open Daily: 09:30 AM - 01:30 PM | 05:30 PM - 09:30 PM</span>
            <button 
              onClick={() => setLanguage(lang => lang === 'bilingual' ? 'english' : 'bilingual')} 
              className="bg-brand-green-700 hover:bg-brand-green-600 transition text-[10px] px-2 py-0.5 rounded flex items-center space-x-1"
              id="language-switch"
            >
              <Languages className="w-3 h-3" />
              <span>{language === 'bilingual' ? "English Only" : "द्विभाषी (Hindi + En)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🏥 STICKY HEADER */}
      <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-brand-green-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          {/* Logo with leafy cross typography */}
          <div 
            onClick={() => navigateTo('home')} 
            className="flex items-center space-x-2.5 cursor-pointer group"
            id="logo-brand"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-green-600 flex items-center justify-center text-white font-serif font-bold text-2xl transition-transform group-hover:scale-105 shadow-md">
              🌿
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-brand-green-700 flex items-baseline leading-none">
                Prakruti <span className="text-xs ml-1 bg-brand-green-100 text-brand-green-700 px-1.5 py-0.5 rounded font-sans italic">Clinic</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-brand-brown-light font-medium tracking-wide">
                प्रकृति फैमिली क्लिनिक • Thane
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-7 text-sm font-semibold text-brand-green-700">
            <button 
              onClick={() => navigateTo('home')} 
              className={`pb-1 transition-all border-b-2 ${activeTab === 'home' ? 'border-brand-brown-light text-brand-green-800 font-extrabold' : 'border-transparent hover:text-brand-green-800 hover:border-brand-green-200'}`}
              id="nav-home"
            >
              Home
            </button>
            <button 
              onClick={() => navigateTo('services')} 
              className={`pb-1 transition-all border-b-2 ${activeTab === 'services' ? 'border-brand-brown-light text-brand-green-800 font-extrabold' : 'border-transparent hover:text-brand-green-800 hover:border-brand-green-200'}`}
              id="nav-services"
            >
              Services (सेवाएं)
            </button>
            <button 
              onClick={() => navigateTo('about')} 
              className={`pb-1 transition-all border-b-2 ${activeTab === 'about' ? 'border-brand-brown-light text-brand-green-800 font-extrabold' : 'border-transparent hover:text-brand-green-800 hover:border-brand-green-200'}`}
              id="nav-about"
            >
              About Clinic
            </button>
            <button 
              onClick={() => navigateTo('reviews')} 
              className={`pb-1 transition-all border-b-2 ${activeTab === 'reviews' ? 'border-brand-brown-light text-brand-green-800 font-extrabold' : 'border-transparent hover:text-brand-green-800 hover:border-brand-green-200'}`}
              id="nav-reviews"
            >
              Reviews ({CLINIC_INFO.googleRating}★)
            </button>
            <button 
              onClick={() => navigateTo('contact')} 
              className={`pb-1 transition-all border-b-2 ${activeTab === 'contact' ? 'border-brand-brown-light text-brand-green-800 font-extrabold' : 'border-transparent hover:text-brand-green-800 hover:border-brand-green-200'}`}
              id="nav-contact"
            >
              Timings & Place
            </button>
          </nav>

          {/* Call and Book Header Actions */}
          <div className="hidden sm:flex items-center space-x-2.5">
            {isAuthLoading ? (
              <div className="w-24 h-9 bg-gray-100 animate-pulse rounded-lg"></div>
            ) : user ? (
              <div className="flex items-center space-x-2 bg-brand-green-50/80 px-2.5 py-1.5 rounded-lg border border-brand-green-200 shadow-inner">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "Patient"} className="w-7 h-7 rounded-full border border-brand-green-300" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-green-600 text-white flex items-center justify-center text-xs font-bold font-sans">
                    {user.displayName ? user.displayName[0] : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
                <div className="text-left leading-none max-w-[100px] hidden md:block">
                  <p className="text-[10px] font-black text-brand-green-800 truncate">{user.displayName || "Patient"}</p>
                  <p className="text-[9px] text-emerald-700 font-bold flex items-center">
                    <Sparkles className="w-1.5 h-1.5 text-emerald-600 mr-0.5 animate-pulse" />
                    <span>Sync Live</span>
                  </p>
                </div>
                <button 
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1 hover:text-red-650 transition text-gray-500 hover:bg-red-50 rounded"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGoogleSignIn}
                className="bg-white hover:bg-brand-green-50 text-brand-green-800 border border-brand-green-600/80 hover:border-brand-green-650 px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                id="header-google-login"
              >
                <LogIn className="w-3.5 h-3.5 text-brand-green-700" />
                <span>Patient Portal</span>
              </button>
            )}

            <a 
              href={`tel:${CLINIC_INFO.phone}`} 
              className="bg-brand-green-100 hover:bg-brand-green-200 text-brand-green-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
              id="header-phone-btn"
            >
              <Phone className="w-4 h-4 text-brand-green-600" />
              <span>09892858656</span>
            </a>
            <button 
              onClick={() => navigateTo('contact')} 
              className="bg-brand-green-600 hover:bg-brand-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md flex items-center space-x-1"
              id="header-book-btn"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="lg:hidden flex items-center space-x-2">
            <a 
              href={`tel:${CLINIC_INFO.phone}`} 
              className="bg-brand-green-100 text-brand-green-800 p-2 rounded-lg text-xs font-bold sm:hidden"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-1.5 bg-brand-green-50 rounded-lg text-brand-green-700 border border-brand-green-100"
              aria-label="Toggle menu"
              id="hamburger-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-brand-green-100 bg-white"
              id="mobile-nav-panel"
            >
              <div className="px-4 py-4 space-y-2.5 flex flex-col text-left">
                <button 
                  onClick={() => navigateTo('home')} 
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm font-semibold transition ${activeTab === 'home' ? 'bg-brand-green-100 text-brand-green-800 font-extrabold' : 'text-brand-green-700 hover:bg-brand-green-50'}`}
                >
                  🏠 Home Page (होम)
                </button>
                <button 
                  onClick={() => navigateTo('services')} 
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm font-semibold transition ${activeTab === 'services' ? 'bg-brand-green-100 text-brand-green-800 font-extrabold' : 'text-brand-green-700 hover:bg-brand-green-50'}`}
                >
                  🌿 Services Page (उपचार और सेवाएं)
                </button>
                <button 
                  onClick={() => navigateTo('about')} 
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm font-semibold transition ${activeTab === 'about' ? 'bg-brand-green-100 text-brand-green-800 font-extrabold' : 'text-brand-green-700 hover:bg-brand-green-50'}`}
                >
                  📖 Clinic History & Doctor
                </button>
                <button 
                  onClick={() => navigateTo('reviews')} 
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm font-semibold transition ${activeTab === 'reviews' ? 'bg-brand-green-100 text-brand-green-800 font-extrabold' : 'text-brand-green-700 hover:bg-brand-green-50'}`}
                >
                  ⭐ Patients Reviews ({CLINIC_INFO.googleRating}★)
                </button>
                <button 
                  onClick={() => navigateTo('contact')} 
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm font-semibold transition ${activeTab === 'contact' ? 'bg-brand-green-100 text-brand-green-800 font-extrabold' : 'text-brand-green-700 hover:bg-brand-green-50'}`}
                >
                  📅 Book & Locate Clinic
                </button>

                <div className="pt-3 border-t border-brand-green-100 space-y-2 flex flex-col">
                  {/* Integrated Mobile Auth widget */}
                  {isAuthLoading ? (
                    <div className="w-full h-10 bg-gray-100 animate-pulse rounded"></div>
                  ) : user ? (
                    <div className="bg-brand-green-50 p-3 rounded-lg border border-brand-green-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || "Patient"} className="w-8 h-8 rounded-full border border-brand-green-300" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold">
                            {user.displayName ? user.displayName[0] : <UserIcon className="w-4 h-4" />}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-brand-green-800">{user.displayName || "Patient"}</p>
                          <p className="text-[10px] text-emerald-700 font-semibold flex items-center">
                            <span>☁️ Cloud Sync Active</span>
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={handleSignOut}
                        className="text-xs bg-red-50 text-red-600 font-bold px-2.5 py-1.5 rounded-lg border border-red-100 flex items-center space-x-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleGoogleSignIn}
                      className="w-full bg-brand-cream-100 hover:bg-brand-cream-200 text-brand-green-850 border border-brand-green-200 font-extrabold py-2.5 rounded-lg text-center text-sm flex items-center justify-center space-x-2"
                    >
                      <LogIn className="w-4 h-4 text-brand-green-600" />
                      <span>Log In with Google</span>
                    </button>
                  )}

                  <a 
                    href={`tel:${CLINIC_INFO.phone}`} 
                    className="w-full bg-brand-green-100 py-2.5 rounded-lg text-center font-bold text-brand-green-800 flex items-center justify-center space-x-2"
                  >
                    <Phone className="w-4 h-4 text-brand-green-600" />
                    <span>Call 09892858656</span>
                  </a>
                  <button 
                    onClick={() => navigateTo('contact')} 
                    className="w-full bg-brand-green-600 py-2.5 rounded-lg text-center font-bold text-white shadow-md flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Appointment</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 🚀 MAIN CONTENT BODY */}
      <main className="flex-grow">
        
        {/* ==================== TAB 1: HOME PAGE ==================== */}
        {activeTab === 'home' && (
          <div id="home-view">
            
            {/* 🌟 HERO BANNER & TRUST BADGE OVER VIEW */}
            <section className="relative overflow-hidden bg-gradient-to-b from-brand-green-100/50 via-brand-cream-100 to-brand-cream-50 py-12 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-brand-green-100">
              {/* Background natural green organic graphics */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-brand-green-200/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-10 w-96 h-96 bg-brand-green-100/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>

              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left Hero Texts */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  
                  {/* Rating Badge + Open Status */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-emerald-100 text-brand-green-800 text-xs font-extrabold px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-sm border border-emerald-200">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{CLINIC_INFO.googleRating} Google Rated</span>
                      <span className="text-[10px] text-brand-green-700">({CLINIC_INFO.reviewCount} reviews)</span>
                    </span>
                    <span className="bg-green-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200 animate-pulse">
                      🏥 Open Now • Consultation Desk
                    </span>
                  </div>

                  {/* Multilingual Titling */}
                  <div className="space-y-3">
                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-brand-green-850 font-black tracking-tight leading-[1.1]">
                      {CLINIC_INFO.name} <br />
                      <span className="text-3xl sm:text-4xl lg:text-5xl text-brand-green-600 block mt-2 font-serif font-semibold">
                        {CLINIC_INFO.nameHindi}
                      </span>
                    </h1>
                    
                    <p className="text-brand-brown-dark font-serif italic text-lg sm:text-xl">
                      " {CLINIC_INFO.tagline} "
                    </p>
                    <p className="text-brand-green-700 text-sm font-semibold italic">
                      "{CLINIC_INFO.taglineHindi}"
                    </p>
                  </div>

                  <p className="text-gray-600 max-w-xl text-base leading-relaxed">
                    Welcome to Thane's premium trusted home for gentle, holistic family healthcare. 
                    Under Dr.'s empathetic primary medicine, we help your family thrive naturally, with affordable, transparent clinical treatments in Rabodi, Thane West.
                  </p>

                  {/* Hero Actions Call & Book */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                    <a 
                      href={`tel:${CLINIC_INFO.phone}`} 
                      className="bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold py-4 px-6 rounded-xl text-center shadow-lg hover:shadow-brand-green-600/10 transition-all flex items-center justify-center space-x-2"
                      id="hero-call-btn"
                    >
                      <Phone className="w-5 h-5" />
                      <span>Call Now: 09892858656</span>
                    </a>
                    
                    <button 
                      onClick={() => navigateTo('contact')}
                      className="bg-white hover:bg-brand-green-50 text-brand-green-700 border-2 border-brand-green-600 font-extrabold py-3.5 px-6 rounded-xl text-center shadow-sm transition-all flex items-center justify-center space-x-2.5"
                      id="hero-book-btn"
                    >
                      <Calendar className="w-5 h-5 text-brand-green-600" />
                      <span>📅 Book Appointment</span>
                    </button>
                  </div>

                  {/* Mini bullet-strip */}
                  <div className="bg-brand-green-100/60 p-3 rounded-xl border border-brand-green-200 max-w-xl">
                    <div className="flex flex-wrap justify-between items-center text-xs text-brand-green-800 font-bold divide-y sm:divide-y-0 sm:divide-x divide-brand-green-200">
                      <div className="px-3 py-1">🏥 Family Clinic</div>
                      <div className="px-3 py-1">🌿 Trusted Care</div>
                      <div className="px-3 py-1">📍 Rabodi, Thane</div>
                      <div className="px-3 py-1">🕒 Open Daily</div>
                    </div>
                  </div>

                </div>

                {/* Right Hero Image Card */}
                <div className="lg:col-span-5 relative flex justify-center">
                  <div className="relative max-w-md w-full">
                    {/* Artistic leaf/framed design */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-green-600/20 to-brand-brown-light/20 rounded-[2rem] transform rotate-3 scale-102"></div>
                    <div className="absolute inset-0 bg-brand-green-100 rounded-[2rem] transform -rotate-3 scale-98 border border-brand-green-200"></div>
                    
                    <div className="relative bg-white p-4 rounded-[2rem] shadow-xl border border-brand-green-100 overflow-hidden">
                      <img 
                        src={doctorImg} 
                        alt="Prakruti Family Clinic Doctor" 
                        className="w-full h-auto object-cover rounded-[1.5rem] bg-brand-green-50"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Floating Trust stats */}
                      <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-brand-green-100 flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-[10px] text-brand-brown-light font-bold uppercase tracking-wider">Expertise</p>
                          <p className="text-xs font-bold text-brand-green-800">10+ Years Trusted</p>
                        </div>
                        <div className="h-8 w-px bg-brand-green-100"></div>
                        <div className="text-left">
                          <p className="text-[10px] text-brand-green-600 font-bold uppercase tracking-wider">Google Rating</p>
                          <div className="flex items-center space-x-1 text-xs font-bold text-gray-800">
                            <span>4.9</span>
                            <div className="flex text-amber-500">
                              <Star className="w-3 h-3 fill-current" />
                              <Star className="w-3 h-3 fill-current" />
                              <Star className="w-3 h-3 fill-current" />
                              <Star className="w-3 h-3 fill-current" />
                              <Star className="w-3 h-3 fill-current" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cute sticker note */}
                    <div className="absolute -top-4 -right-4 bg-brand-cream-200 border border-brand-brown-light text-brand-brown-dark rounded-xl p-2.5 shadow-md transform rotate-6 max-w-[140px] text-center hidden sm:block">
                      <p className="font-serif text-xs font-bold leading-tight">पारिवारिक क्लिनिक</p>
                      <p className="text-[9px] font-medium leading-tight mt-0.5 text-gray-700">Holistic healthcare with personal empathy</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* 🏷️ TRUST BADGES GRID */}
            <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-brand-green-100 shadow-inner">
              <div className="max-w-7xl mx-auto">
                <p className="text-center text-xs font-extrabold uppercase tracking-widest text-brand-brown-light mb-8">
                  Prakruti Clinic Standard of Trust • जन-विश्वास के पांच आधार
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
                  
                  {/* Badge 1 */}
                  <div className="bg-brand-green-50/50 p-4 rounded-xl border border-brand-green-100 flex flex-col items-center hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-full bg-brand-green-100 flex items-center justify-center mb-3">
                      <Star className="w-6 h-6 text-brand-green-600 fill-brand-green-600" />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-brand-green-800">⭐ 4.9 Rated</h3>
                    <p className="text-[11px] text-gray-500 mt-1">Hinglish Reviews verified on Google</p>
                  </div>

                  {/* Badge 2 */}
                  <div className="bg-brand-green-50/50 p-4 rounded-xl border border-brand-green-100 flex flex-col items-center hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-full bg-brand-green-100 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6 text-brand-green-600" />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-brand-green-800">👨👩👧 Family Care</h3>
                    <p className="text-[11px] text-gray-500 mt-1">Pediatrics, Youth, Sisters & Seniors</p>
                  </div>

                  {/* Badge 3 */}
                  <div className="bg-brand-green-50/50 p-4 rounded-xl border border-brand-green-100 flex flex-col items-center hover:shadow-md transition">
                    <div className="w-12 h-12 rounded-full bg-brand-green-100 flex items-center justify-center mb-3">
                      <Heart className="w-6 h-6 text-brand-green-600 fill-brand-green-100" />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-brand-green-800">🌿 Natural Approach</h3>
                    <p className="text-[11px] text-gray-500 mt-1">Avoid extra pills, promote lifestyle change</p>
                  </div>

                  {/* Badge 4 */}
                  <div className="bg-brand-green-50/50 p-4 rounded-xl border border-brand-green-100 flex flex-col items-center hover:shadow-md transition col-span-1">
                    <div className="w-12 h-12 rounded-full bg-brand-green-100 flex items-center justify-center mb-3">
                      <MapPin className="w-6 h-6 text-brand-green-600" />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-brand-green-800">📍 Rabodi, Thane</h3>
                    <p className="text-[11px] text-gray-500 mt-1">KP Annex Building near Postman Apartment</p>
                  </div>

                  {/* Badge 5 */}
                  <div className="bg-brand-green-50/50 p-4 rounded-xl border border-brand-green-100 flex flex-col items-center hover:shadow-md transition col-span-2 md:col-span-1">
                    <div className="w-12 h-12 rounded-full bg-brand-green-100 flex items-center justify-center mb-3">
                      <Award className="w-6 h-6 text-brand-green-600" />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-brand-green-800">🏥 Deep Local Trust</h3>
                    <p className="text-[11px] text-gray-500 mt-1">The primary healthcare helper of Rabodi Area</p>
                  </div>

                </div>
              </div>
            </section>

            {/* 🛠️ COMPREHENSIVE SERVICES TEASER (PREVIEW) */}
            <section className="bg-brand-cream-100/40 py-16 px-4 sm:px-6 lg:px-8 border-b border-brand-green-100">
              <div className="max-w-7xl mx-auto text-left">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
                  <div>
                    <span className="text-xs font-bold text-brand-brown-light uppercase tracking-widest block mb-2">
                      Experienced Care for Every Requirement
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl text-brand-green-800 font-extrabold tracking-tight">
                      Our Medical Services • चिकित्सा सेवाएं
                    </h2>
                  </div>
                  <button 
                    onClick={() => navigateTo('services')} 
                    className="text-brand-green-600 hover:text-brand-green-700 font-extrabold text-sm flex items-center space-x-1 border-b-2 border-brand-green-600 pb-1 hover:border-transparent transition"
                  >
                    <span>View All Services & Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {SERVICES_DATA.slice(0, 3).map((svc) => (
                    <div 
                      key={svc.id} 
                      className="bg-white p-5 rounded-2xl border border-brand-green-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-brand-green-600 flex items-center justify-center mb-4 border border-emerald-100">
                          <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="font-serif text-lg font-bold text-brand-green-850">
                          {svc.title}
                        </h3>
                        <p className="text-xs font-semibold text-brand-brown-light italic mb-2">
                          {svc.titleHindi}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">
                          {svc.description}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedService(svc);
                          navigateTo('services');
                        }}
                        className="text-left text-xs font-bold text-brand-green-600 hover:text-brand-green-700 flex items-center space-x-1"
                      >
                        <span>Learn more & See treatments</span>
                        <span>➔</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Patient education banner */}
                <div className="bg-brand-green-600 text-white rounded-2xl p-6 md:p-8 mt-10 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-2 text-left max-w-xl">
                    <p className="bg-brand-green-700 inline-block px-2.5 py-1 rounded text-[10px] tracking-wider uppercase font-bold text-emerald-300">
                      Primary Healing & Lifestyle Guides
                    </p>
                    <h3 className="font-serif text-xl md:text-2xl font-bold">
                      Is it Fever or seasonal infection? बुखार, पुरानी खाँसी या थायराइड है?
                    </h3>
                    <p className="text-xs text-brand-green-100">
                      Do not self-prescribe antibiotics. It might harm immunity. Consult Dr. at Prakruti Clinic for tailored medicine routines that help your body recover with minimum side-effects.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigateTo('contact')}
                    className="bg-brand-cream-100 hover:bg-brand-cream-200 text-brand-green-850 font-bold px-6 py-3.5 rounded-lg text-sm whitespace-nowrap shadow transition"
                  >
                    📅 Schedule Consultation
                  </button>
                </div>

              </div>
            </section>

            {/* 💬 HIGHLIGHTED PATIENT REVIEWS */}
            <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-b border-brand-green-100">
              <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-xl mx-auto mb-10">
                  <span className="text-xs font-extrabold text-brand-brown-light uppercase tracking-widest block mb-2">
                    Verified Hinglish Patient Stories (सच्चे अनुभव)
                  </span>
                  <h2 className="font-serif text-3xl font-extrabold text-brand-green-800">
                    Trusted by Families in Rabodi, Thane
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {REVIEWS_DATA.slice(0, 2).map((rev) => (
                    <div 
                      key={rev.id} 
                      className="bg-brand-green-50/40 p-6 rounded-2xl border border-brand-green-100/80 text-left relative"
                    >
                      <div className="absolute top-6 right-6 text-brand-green-200 font-serif text-6xl leading-none">“</div>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-brand-green-600/10 flex items-center justify-center font-bold text-brand-green-700">
                          {rev.patientName[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-brand-green-800">{rev.patientName}</h4>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">
                            ✓ Verified Patient ({rev.treatment})
                          </span>
                        </div>
                      </div>
                      <div className="flex text-amber-500 mb-3">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current text-amber-500" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed italic">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <button 
                    onClick={() => navigateTo('reviews')}
                    className="bg-brand-green-50 text-brand-green-700 hover:bg-brand-green-100 font-extrabold text-sm px-6 py-3 rounded-lg border border-brand-green-200 transition"
                  >
                    ⭐ Read all {CLINIC_INFO.reviewCount} Hinglish Patient Reviews ➔
                  </button>
                </div>
              </div>
            </section>

            {/* ☎️ QUICK APPOINTMENT PROMPT BAR */}
            <section className="bg-gradient-to-tr from-brand-green-850 via-brand-green-750 to-brand-green-600 text-white py-14 px-4 sm:px-6 lg:px-8 text-left">
              <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-2 max-w-xl">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold">
                    Need Doctor Consultation for your children or parents?
                  </h3>
                  <p className="text-sm text-emerald-100">
                    Quickly check in daily. Address Shop no. 2, KP Annex near Postman Apartment, Kisan Nagar 3. Or send us a direct message on WhatsApp for instant confirmation.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto shrink-0">
                  <a 
                    href={`tel:${CLINIC_INFO.phone}`} 
                    className="bg-amber-500 hover:bg-amber-600 text-brand-green-800 font-black py-3 px-6 rounded-xl text-center shadow whitespace-nowrap transition flex items-center justify-center space-x-1.5"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call 09892858656</span>
                  </a>
                  <button 
                    onClick={() => navigateTo('contact')}
                    className="bg-brand-green-750 hover:bg-brand-green-700 text-white font-extrabold py-3.5 px-6 rounded-xl text-center border border-emerald-400 whitespace-nowrap transition flex items-center justify-center space-x-1.5"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Timed Slot</span>
                  </button>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ==================== TAB 2: SERVICES PAGE ==================== */}
        {activeTab === 'services' && (
          <div id="services-view" className="py-12 bg-brand-cream-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
              
              <div className="max-w-3xl mb-10">
                <span className="text-xs font-bold text-brand-brown-light uppercase tracking-widest block mb-1">
                  Trusted Medical Protocols • व्यापक उपचार
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-brand-green-800 font-extrabold tracking-tight">
                  Family Healthcare & Primary OPD Treatments
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                  At Prakruti Family Clinic, we believe in patient-centered consultations. We do not support arbitrary referrals. Dr. spends time mapping your diagnostic parameters and plans recovery.
                </p>
              </div>

              {/* Dynamic Service Selection Spotlight (Custom Interactive Component) */}
              <AnimatePresence>
                {selectedService && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-brand-green-50 border border-brand-green-200 rounded-2xl p-6 mb-10 shadow-inner"
                    id="service-spotlight"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] bg-brand-green-650 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          Active Selection Feature
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-green-800 mt-1">
                          {selectedService.title} ({selectedService.titleHindi})
                        </h3>
                      </div>
                      <button 
                        onClick={() => setSelectedService(null)}
                        className="p-1 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg shadow-sm border transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mb-4 max-w-2xl">
                      {selectedService.description} At Prakruti Family Clinic, Thane, we provide specific diagnosis charts to ensure you and your children recover safe.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                      {selectedService.features.map((feat, i) => (
                        <div key={i} className="flex items-center space-x-2.5 bg-white p-3 rounded-lg text-xs font-bold shadow-sm text-brand-green-800 border border-brand-green-100">
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => navigateTo('contact')}
                        className="bg-brand-green-600 hover:bg-brand-green-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow"
                      >
                        📅 Book Treatment Slot
                      </button>
                      <a 
                        href={`https://wa.me/919892858656?text=Hi%20Prakruti%20Clinic,%20I'd%20like%20to%20know%20more%20about%20your%20treatment%20for%20${encodeURIComponent(selectedService.title)}`}
                        referrerPolicy="no-referrer"
                        className="text-brand-green-700 hover:text-brand-green-800 bg-white hover:bg-gray-50 border border-brand-green-200 font-extrabold text-xs px-4 py-2.5 rounded-lg inline-flex items-center space-x-1"
                      >
                        <span>Chat WhatsApp Contact</span>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid of All Services */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="services-grid">
                {SERVICES_DATA.map((svc) => {
                  const isActive = selectedService?.id === svc.id;
                  return (
                    <div 
                      key={svc.id}
                      className={`bg-white rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between text-left ${isActive ? 'ring-2 ring-brand-green-600 border-transparent shadow-md' : 'border-brand-green-100 hover:border-brand-green-200 shadow-sm hover:shadow-md'}`}
                    >
                      <div>
                        {/* Heading and tag */}
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[9px] bg-brand-green-100 text-brand-green-850 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {svc.category}
                          </span>
                          <span className="text-lg">🌿</span>
                        </div>
                        
                        <h3 className="font-serif text-lg font-bold text-brand-green-850">
                          {svc.title}
                        </h3>
                        <p className="text-xs font-bold text-brand-brown-light italic mb-3">
                          {svc.titleHindi}
                        </p>
                        
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">
                          {svc.description}
                        </p>

                        <div className="space-y-1.5 mb-5 text-[11px] text-gray-700">
                          {svc.features.slice(0, 2).map((feat, i) => (
                            <div key={i} className="flex items-center space-x-1.5">
                              <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-brand-green-50 flex items-center justify-between">
                        <button 
                          onClick={() => setSelectedService(svc)}
                          className="text-xs font-black text-brand-green-600 hover:text-brand-green-700"
                        >
                          {isActive ? "Spotlight Open ✓" : "View Treatment Details ➔"}
                        </button>
                        <button 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, reason: svc.title }));
                            navigateTo('contact');
                          }}
                          className="bg-brand-green-50 hover:bg-brand-green-100 text-brand-green-800 text-[11px] font-bold px-2.5 py-1.5 rounded"
                        >
                          Quick Book
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nature philosophy strip */}
              <div className="mt-14 bg-brand-green-800 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-left max-w-xl">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-cream-100">
                    "Prakriti Se Swasthya, Parivaar Ki Sehat"
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Prakruti Clinic translates raw scientific investigation into natural therapy guidelines. We help you and your family control Blood Pressure, Sugar levels, and Obesity issues through structured medical consultations and lifestyle diets.
                  </p>
                </div>
                <div className="flex space-x-3 shrink-0">
                  <a 
                    href={`tel:${CLINIC_INFO.phone}`}
                    className="bg-amber-500 text-brand-green-850 font-black text-xs px-4 py-2.5 rounded shadow"
                  >
                    📞 Call Doctor
                  </a>
                  <button 
                    onClick={() => navigateTo('contact')}
                    className="bg-brand-green-700 hover:bg-brand-green-600 text-white border border-emerald-400 font-extrabold text-xs px-4 py-2.5 rounded"
                  >
                    📅 Schedule Timed Consultation
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 3: ABOUT PAGE ==================== */}
        {activeTab === 'about' && (
          <div id="about-view" className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left profile image with details */}
                <div className="lg:col-span-5 relative">
                  <div className="absolute inset-0 bg-brand-green-100 rounded-3xl transform rotate-3 -z-10"></div>
                  <div className="border border-brand-green-200 bg-brand-cream-50 p-4 rounded-3xl shadow-lg relative">
                    <img 
                      src={doctorImg} 
                      alt="Dr. Prakruti Family Clinic Practitioner" 
                      className="w-full h-auto object-cover rounded-2xl shadow bg-brand-green-100"
                      referrerPolicy="no-referrer"
                    />

                    {/* Qualifications and details */}
                    <div className="mt-4 p-4 bg-white rounded-xl text-left border border-brand-green-100">
                      <p className="text-xs font-bold text-brand-brown-light tracking-wide uppercase">General Practitioner</p>
                      <h4 className="font-serif text-lg font-bold text-brand-green-800 mt-1">Medical Director, GP</h4>
                      <p className="text-xs text-gray-500 font-semibold">MBBS, MD Primary Family Medicine Practitioner</p>
                      <p className="text-xs text-gray-500">10+ Years Dedicated Clinical Experience in Mumbai & Thane</p>

                      <div className="mt-3.5 pt-3 border-t border-brand-green-100 flex items-center justify-between text-xs font-semibold text-brand-green-700">
                        <span>Speaks: Hindi, English, Marathi, Gujarati</span>
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold">In-Person & Online</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Clinical Story and Pillars */}
                <div className="lg:col-span-7 space-y-6">
                  <span className="text-xs font-extrabold text-brand-brown-light uppercase tracking-widest block">
                    Our Medical History • क्लिनिक का परिचय
                  </span>
                  
                  <h2 className="font-serif text-3xl sm:text-4xl text-brand-green-800 font-black tracking-tight leading-snug">
                    {ABOUT_STORY.welcome} <br />
                    <span className="text-xl sm:text-2xl text-brand-green-600 block mt-1">
                      {ABOUT_STORY.welcomeHindi}
                    </span>
                  </h2>

                  <p className="text-brand-brown-dark font-serif italic text-base">
                    "{ABOUT_STORY.tagline}"
                  </p>

                  <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                    {ABOUT_STORY.contentParagraphs.map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>

                  <div className="bg-brand-green-50 p-4 rounded-xl border border-brand-green-100">
                    <p className="font-serif text-[11px] font-bold text-brand-brown-light uppercase tracking-wider mb-2">
                       Our Core Promise • प्रकृति क्लिनिक की प्रतिज्ञा
                    </p>
                    <p className="text-xs text-brand-green-800 font-bold italic leading-relaxed">
                      "At Prakruti, we pledge never to burden patients with excessive treatment lists or complex procedures. Our goal is to recover your health through lifestyle awareness and targeted primary diagnostics."
                    </p>
                  </div>
                </div>

              </div>

              {/* Part 2: Pillars of Trust */}
              <div className="mt-16 pt-12 border-t border-brand-green-100 text-left">
                <div className="max-w-2xl mb-10">
                  <span className="text-xs font-bold text-brand-brown-light uppercase tracking-widest block mb-1">
                    Value Principles
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-brand-green-800 font-black">
                    Four Pillars of Patient Trust • विश्वास के चार स्तंभ
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {ABOUT_STORY.whyTrustUs.map((item, i) => (
                    <div 
                      key={i} 
                      className="bg-brand-cream-100/50 p-5 rounded-2xl border border-brand-cream-200 text-left hover:shadow-md transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-green-600 text-white font-serif font-black text-xs flex items-center justify-center mb-4 shadow">
                        {i + 1}
                      </div>
                      <h4 className="font-serif text-base font-bold text-brand-green-800">
                        {item.title}
                      </h4>
                      <p className="text-xs font-semibold text-brand-brown-light mb-2">
                        {item.titleHindi}
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 4: REVIEWS PAGE ==================== */}
        {activeTab === 'reviews' && (
          <div id="reviews-view" className="py-12 bg-brand-cream-15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
              
              {/* Comprehensive Google Rating stats header */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-brand-green-100 shadow-sm text-center lg:text-left">
                  <span className="text-xs font-extrabold text-brand-brown-light uppercase tracking-widest block mb-1">
                    Verified Google Patient Ratings
                  </span>
                  <h3 className="font-serif text-xl font-bold text-brand-green-800">
                    Trusted Reputation
                  </h3>
                  
                  <div className="my-5 flex flex-col items-center lg:items-start">
                    <p className="text-6xl font-serif font-extrabold text-brand-green-800">
                      {CLINIC_INFO.googleRating}
                    </p>
                    <div className="flex text-amber-500 my-1">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current text-amber-400" />
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-1">
                       Based on {CLINIC_INFO.reviewCount} Reviews • 100% Patient Satisfaction
                    </p>
                  </div>

                  <hr className="my-4 border-brand-green-100" />

                  {/* Rating meters */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-gray-500">
                      <span className="w-12">5 Stars</span>
                      <div className="flex-grow mx-3 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full w-[96%]"></div>
                      </div>
                      <span className="w-5 text-right font-bold">20</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span className="w-12">4 Stars</span>
                      <div className="flex-grow mx-3 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full w-[4%]"></div>
                      </div>
                      <span className="w-5 text-right font-bold">1</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="w-12">3 Stars</span>
                      <div className="flex-grow mx-3 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full w-0"></div>
                      </div>
                      <span className="w-5 text-right">0</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300">
                      <span className="w-12">2 Stars</span>
                      <div className="flex-grow mx-3 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="h-full w-0"></div>
                      </div>
                      <span className="w-5 text-right">0</span>
                    </div>
                  </div>

                  <a 
                    href={CLINIC_INFO.googleMapsUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-brand-green-650 hover:bg-brand-green-700 text-white font-bold py-3 px-4 rounded-xl text-center text-xs mt-6 inline-flex items-center justify-center space-x-1.5 shadow transition-all"
                  >
                    <span>Click to post a Google Review ➔</span>
                  </a>

                </div>

                <div className="lg:col-span-7 text-left space-y-4">
                  <span className="text-[10px] bg-brand-green-100 text-brand-green-800 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                    Official Thane Review Desk
                  </span>
                  <h4 className="font-serif text-2xl sm:text-3xl font-black text-brand-green-800 leading-snug">
                    Hinglish & Hindi Testimonials from local Thane Families
                  </h4>
                  <p className="text-gray-500 text-xs">
                     We are incredibly grateful for the feedback our patients show. These testimonials reflect the genuine healthcare journeys of individuals from Rabodi, Kisan Nagar, Shivaji Nagar, and adjacent Thane areas. We look forward to welcome you.
                  </p>
                  
                  <div className="bg-brand-cream-200 border border-brand-brown-light/40 p-4 rounded-xl flex items-center space-x-3 text-xs italic text-brand-brown-dark font-medium">
                    <span>💡</span>
                    <span>"Dr. speaks fluent Marathi, Hindi, and English so that my parents understand coordinates perfectly. Excellent clinic structure."</span>
                  </div>
                </div>
              </div>

              {/* List of 5 verified Reviews */}
              <div className="space-y-6" id="reviews-list">
                {REVIEWS_DATA.map((rev) => (
                  <div 
                    key={rev.id} 
                    className="bg-white p-6 rounded-2xl border border-brand-green-100 shadow-sm text-left relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 bg-brand-green-600 h-full"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-brand-green-100 text-brand-green-700 font-serif font-black text-sm flex items-center justify-center">
                          {rev.patientName[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-brand-green-800">{rev.patientName}</h4>
                          <p className="text-[10px] text-gray-500">{rev.date} • Verified local patient</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100">
                          🎯 {rev.treatment}
                        </span>
                        <div className="flex text-amber-500 text-xs">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>

                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic pr-6">
                      "{rev.comment}"
                    </p>

                    {rev.commentHindi && (
                      <div className="mt-3.5 pt-3 border-t border-brand-green-50/70">
                        <p className="text-[11px] text-slate-500 italic font-semibold flex items-center space-x-1">
                          <span className="text-xs">🇮🇳</span>
                          <span>हिन्दी अनुवाद: "{rev.commentHindi}"</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 5: CONTACT PAGE & BOOKING ==================== */}
        {activeTab === 'contact' && (
          <div id="contact-view" className="py-12 bg-brand-cream-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
              
              <div className="max-w-2xl mb-10">
                <span className="text-xs font-bold text-brand-brown-light uppercase tracking-widest block mb-1">
                  Connect & Inquire • संपर्क और अपॉइंटमेंट
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-brand-green-800 font-extrabold tracking-tight">
                  Timings, Address & Live Booking Desk
                </h2>
                <p className="text-gray-500 text-xs mt-2">
                  Find the exact location of Prakruti Family Clinic in Rabodi, Thane West, check daily morning / evening consult slots, or schedule an online appointment immediately using our live simulation.
                </p>
              </div>

              {/* Grid: Columns of (Details/Timings/Maps) + (Booking Form) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Address details, timings, Google Map */}
                <div className="lg:col-span-5 space-y-7">
                  
                  {/* Address Box */}
                  <div className="bg-white p-5 rounded-2xl border border-brand-green-100 shadow-sm space-y-3">
                    <h3 className="font-serif font-extrabold text-base text-brand-green-850 flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-brand-green-600 shrink-0" />
                      <span>Thane Clinic Physical Address</span>
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      <strong>Shop No 2, K P Annex Building,</strong> Shivaji Nagar Rd, Near Postman Apt, Kisan Nagar 3, Rabodi, Thane West, Thane, Maharashtra 400601
                    </p>
                    <div className="pt-2 border-t border-brand-green-50 text-[11px] text-brand-green-700 italic">
                      📍 Landmark: Opposite Postman Apartment, Kisan Nagar 3.
                    </div>
                  </div>

                  {/* Daily Timing Schedule */}
                  <div className="bg-white p-5 rounded-2xl border border-brand-green-100 shadow-sm">
                    <h3 className="font-serif font-extrabold text-base text-brand-green-850 flex items-center space-x-2 mb-4">
                      <Clock className="w-5 h-5 text-brand-green-600 shrink-0" />
                      <span>Doctor Consultation Slot Timings</span>
                    </h3>
                    <div className="divide-y divide-brand-green-50">
                      {CLINIC_TIMINGS.map((ct, idx) => {
                        const isToday = ct.day === currentDayName;
                        return (
                          <div 
                            key={idx} 
                            className={`py-2 px-1 flex justify-between items-center text-xs ${isToday ? 'bg-brand-green-50/50 font-bold rounded text-brand-green-800' : 'text-gray-600'}`}
                          >
                            <span className="flex items-center space-x-2">
                              <span>{ct.day}</span>
                              {isToday && <span className="bg-emerald-600 text-white font-serif text-[8px] px-1 py-0.5 rounded uppercase">Today</span>}
                            </span>
                            <span className="text-[11px] text-right text-brand-green-700 font-mono italic">{ct.slots}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3.5 pt-3.5 border-t border-brand-green-50 flex items-center space-x-2.5 text-xs font-semibold text-brand-brown-light">
                      <span>💡 Emergency Contact Number:</span>
                      <a href={`tel:${CLINIC_INFO.phone}`} className="font-mono text-brand-green-700 font-extrabold underline">{CLINIC_INFO.phoneDisplay}</a>
                    </div>
                  </div>

                  {/* Quick Connect Phone/WhatsApp Block */}
                  <div className="bg-brand-green-800 text-white p-5 rounded-2xl shadow-md space-y-4">
                    <h3 className="font-serif font-bold text-base">Quick Action Hotlines</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs text-center">
                      <a 
                        href={`tel:${CLINIC_INFO.phone}`} 
                        className="bg-amber-500 hover:bg-amber-600 font-bold py-3 text-brand-green-850 rounded-lg flex items-center justify-center space-x-1"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call 09892858656</span>
                      </a>
                      <a 
                        href={`https://wa.me/919892858656?text=Hi%20Prakruti%20Clinic,%20I'd%20like%20to%20know%20more%20about%20your%20clinical%20timing%20today.`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-1"
                      >
                        <MessageSquare className="w-4 h-4 fill-white text-emerald-500" />
                        <span>WhatsApp Now</span>
                      </a>
                    </div>
                  </div>

                  {/* Real Location Map Preview */}
                  <div className="bg-white p-4 rounded-2xl border border-brand-green-100 shadow-sm relative overflow-hidden h-60">
                    <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-bold text-brand-green-800 shadow-sm border border-brand-green-15">
                      🗺️ KP Annex, Shivaji Nagar, Thane West
                    </div>
                    <iframe 
                      title="Google Maps Prakruti Clinic"
                      src={CLINIC_INFO.mapsEmbedUrl} 
                      className="w-full h-full border-0 rounded-xl"
                      allowFullScreen={false} 
                      loading="lazy" 
                      referrerPolicy="no-referrer"
                    ></iframe>
                  </div>

                </div>

                {/* Right Side: Appointment Booking Form */}
                <div className="lg:col-span-7">
                  
                  {/* Form Wrapper Panel */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-brand-green-100 shadow-sm">
                    
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-green-850 text-left mb-2 flex items-center justify-between">
                      <span>Interactive Appointment Booking</span>
                      {user && (
                        <span className="hidden sm:inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-widest leading-none">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Google Synced</span>
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4 text-left">
                       Submit the patient credentials below. Your token receipt will be generated automatically and stored securely in the cloud under your profile.
                    </p>

                    {/* Dynamic Auth banner inside booking card */}
                    {isAuthLoading ? (
                      <div className="w-full h-16 bg-gray-50 animate-pulse rounded-xl mb-5"></div>
                    ) : user ? (
                      <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-150 mb-5 text-left text-xs text-emerald-800 flex items-start space-x-2.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold">Authenticated as {user.displayName || "Family Member"}</p>
                          <p className="text-emerald-700 text-[11px] mt-0.5 leading-relaxed">
                            Your medical details and scheduled sessions are encrypted and securely synchronized with the Firebase Cloud Database in real time.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-150 mb-5 text-left text-xs text-brand-brown-dark relative">
                        <div className="flex items-start space-x-2.5">
                          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-bold">Save Bookings to Google Cloud Database</p>
                            <p className="text-gray-600 text-[11px] mt-0.5 mb-2.5 leading-relaxed">
                              Currently booking in Guest Mode. Local bookings can be lost if you clear your browser cache. Log in to protect your medical details and link bookings securely to the cloud.
                            </p>
                            <button 
                              onClick={handleGoogleSignIn}
                              className="bg-white hover:bg-brand-cream-100 text-brand-green-800 font-extrabold px-3.5 py-1.5 rounded-lg border border-brand-green-200 shadow-sm text-[11px] flex items-center space-x-1.5 transition"
                            >
                              <LogIn className="w-3.5 h-3.5 text-brand-green-700" />
                              <span>Log in with Google</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <AnimatePresence mode='wait'>
                      {/* Ticket Display if submitted successfully */}
                      {submittedAppointment ? (
                        <motion.div 
                          key="ticket"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-brand-green-50 border-2 border-brand-green-200 rounded-2xl p-5 sm:p-6 text-left relative"
                        >
                          {/* Circle cuts in ticket card */}
                          <div className="absolute -left-3 top-1/2 w-6 h-6 bg-brand-cream-50 rounded-full border-r border-brand-green-100 transform -translate-y-1/2 z-10"></div>
                          <div className="absolute -right-3 top-1/2 w-6 h-6 bg-brand-cream-50 rounded-full border-l border-brand-green-100 transform -translate-y-1/2 z-10"></div>

                          <div className="text-center space-y-2 mb-4">
                            <span className="bg-emerald-600 text-white font-serif text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                              Appointment Registered Successfully!
                            </span>
                            <h4 className="font-serif text-2xl font-black text-brand-green-800 tracking-tight">
                              TOKEN NO: {submittedAppointment.id}
                            </h4>
                            <p className="text-[11px] text-brand-brown-light font-bold">
                              Prakruti Clinic Thane Verification Slip
                            </p>
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-dashed border-brand-green-200 text-xs space-y-2.5">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Patient Name:</span>
                              <strong className="text-brand-green-800">{submittedAppointment.name}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Contact Number:</span>
                              <strong className="font-mono text-brand-green-800">{submittedAppointment.phone}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Requested Date:</span>
                              <strong className="text-brand-green-800">{submittedAppointment.date}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Scheduled Time Slot:</span>
                              <strong className="text-brand-green-700 font-mono italic">{submittedAppointment.timeSlot}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Reason / Diagnostics:</span>
                              <strong className="text-brand-green-800 italic">{submittedAppointment.reason}</strong>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-100">
                              <span className="text-gray-500">Status Code:</span>
                              <strong className="text-emerald-700 font-extrabold flex items-center">
                                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                                Confirming via WhatsApp
                              </strong>
                            </div>
                          </div>

                          {/* Post actions on booking receipt */}
                          <div className="mt-6 space-y-3">
                            <a 
                              href={getWhatsAppShareText(submittedAppointment)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-center text-xs flex items-center justify-center space-x-2 shadow"
                            >
                              <MessageSquare className="w-4 h-4 fill-white" />
                              <span>Share Token on WhatsApp for Quick Confirmation</span>
                            </a>

                            <div className="flex gap-4">
                              <button 
                                onClick={() => setSubmittedAppointment(null)}
                                className="w-1/2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-3 rounded-lg border border-gray-200 text-center text-[11px]"
                              >
                                Book Another Slot
                              </button>
                              <button 
                                onClick={() => cancelAppointment(submittedAppointment.id)}
                                className="w-1/2 bg-transparent hover:bg-red-50 text-red-600 font-extrabold py-2 px-3 rounded-lg text-center text-[11px] border border-red-100"
                              >
                                Cancel Request Token
                              </button>
                            </div>
                          </div>

                        </motion.div>
                      ) : (
                        /* Traditional input form fields */
                        <motion.form 
                          key="form"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onSubmit={handleBookingSubmit} 
                          className="space-y-4"
                          id="app-booking-form"
                        >
                          
                          {/* Patient Name */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 text-left mb-1.5">
                              Patient Full Name * (मरीज का नाम)
                            </label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. Ramesh Kumar Patil"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-full p-3 rounded-xl border border-brand-green-100 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent text-xs text-left"
                            />
                          </div>

                          {/* Patient Phone */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 text-left mb-1.5">
                              Mobile Number * (मोबाइल नंबर)
                            </label>
                            <input 
                              type="tel" 
                              required
                              placeholder="e.g. 9892858656"
                              pattern="[0-9]{10}"
                              maxLength={10}
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className="w-full p-3 rounded-xl border border-brand-green-100 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent text-xs text-left font-mono"
                            />
                            <p className="text-[10px] text-gray-400 text-left mt-1">Provide a correct 10-digit number for WhatsApp updates.</p>
                          </div>

                          {/* Grid date and time slot selection */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Appt Date */}
                            <div>
                              <label className="block text-xs font-bold text-gray-700 text-left mb-1.5">
                                Select Preferred Date * (तारीख)
                              </label>
                              <input 
                                type="date" 
                                required
                                min={new Date().toISOString().split('T')[0]} // Block previous historical dates
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                className="w-full p-2.5 rounded-xl border border-brand-green-100 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent text-xs text-left font-mono"
                              />
                            </div>

                            {/* Appt Slot */}
                            <div>
                              <label className="block text-xs font-bold text-gray-700 text-left mb-1.5">
                                Preferred Timings slot * (समय)
                              </label>
                              <select 
                                value={formData.timeSlot}
                                onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
                                className="w-full p-2.5 rounded-xl border border-brand-green-100 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent text-xs font-mono"
                              >
                                {timeSlots.map((ts, i) => (
                                  <option key={i} value={ts}>{ts}</option>
                                ))}
                              </select>
                            </div>

                          </div>

                          {/* Reason for Visit */}
                          <div>
                            <label className="block text-xs font-bold text-gray-700 text-left mb-1.5">
                              Medical Issue / Diagnostic Reason * (बीमारी या लक्षण)
                            </label>
                            <select 
                              value={formData.reason}
                              onChange={(e) => setFormData({...formData, reason: e.target.value})}
                              className="w-full p-3 rounded-xl border border-brand-green-100 focus:outline-none focus:ring-2 focus:ring-brand-green-600 focus:border-transparent text-xs"
                              required
                            >
                              <option value="">-- Choose Symptoms / Diagnosis --</option>
                              <option value="General Fever & Flu Treatment">General Fever & Flu (बुखार, सर्दी)</option>
                              <option value="Chronic BP Management">Hypertension / Blood Pressure</option>
                              <option value="Thyroid Checkup & Guidance">Thyroid (थायराइड)</option>
                              <option value="Diabetes Sugar checkup">Sugar / Diabetes Management</option>
                              <option value="Child/Infant Pediatric consultation">Child Care (शिशु रोग उपचार)</option>
                              <option value="Women Hormone or Health Counsel">Women Health (महिला स्वास्थ्य)</option>
                              <option value="Routine Health Checkup block">General Health Checkup (निवारक जांच)</option>
                              <option value="Other Medical consultation">Other Consultation (अन्य बीमारी)</option>
                            </select>
                          </div>

                          <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-brand-green-600 hover:bg-brand-green-700 disabled:bg-brand-green-300 text-white font-bold py-4 rounded-xl text-center text-xs transition duration-200 mt-2 flex items-center justify-center space-x-2 shadow-md"
                          >
                            {isSubmitting ? (
                              <>
                                <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                                <span>Verifying Schedule parameters...</span>
                              </>
                            ) : (
                              <>
                                <BookmarkCheck className="w-4 h-4 text-emerald-100" />
                                <span>Get Confirmed Healthcare Token Receipt ➔</span>
                              </>
                            )}
                          </button>

                          <div className="text-[10px] text-gray-400 text-center font-medium mt-1">
                            🚀 Standard OPD fees are payable in the clinic. No initial prepayment required.
                          </div>

                        </motion.form>
                      )}
                    </AnimatePresence>

                     {/* Booked list history */}
                     {appointments.length > 0 && (
                       <div className="mt-8 pt-8 border-t border-brand-green-100 text-left">
                         <h4 className="font-serif font-bold text-sm text-brand-green-800 mb-3 flex items-center justify-between">
                           <span className="flex items-center space-x-2">
                             <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                             <span>{user ? "Your Secure Cloud Tokens" : "Your Active local-only Tokens"} ({appointments.length})</span>
                           </span>
                           {user && (
                             <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-sans flex items-center space-x-1 border border-emerald-100">
                               <CloudLightning className="w-2.5 h-2.5 animate-pulse" />
                               <span>Live Cloud Database connected</span>
                             </span>
                           )}
                         </h4>
                         <div className="space-y-2.5">
                           {appointments.map((app) => (
                             <div 
                               key={app.id} 
                               className="bg-brand-green-50/50 p-3 rounded-lg flex items-center justify-between border border-brand-green-100"
                             >
                               <div className="text-left space-y-0.5 flex-1 min-w-0 mr-3">
                                 <div className="flex items-center space-x-2 text-xs flex-wrap gap-1">
                                   <span className="font-extrabold text-brand-green-800 font-mono text-[11px]">{app.id}</span>
                                   <span className="text-gray-400">|</span>
                                   <span className="font-bold text-slate-700 truncate max-w-[120px]">{app.name}</span>
                                   
                                   {/* Persistent state label */}
                                   {user ? (
                                     <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded flex items-center">
                                       <Sparkles className="w-2 h-2 text-emerald-600 mr-0.5" />
                                       <span>Cloud Database</span>
                                     </span>
                                   ) : (
                                     <span className="text-[9px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.2 rounded">
                                       Local Storage
                                     </span>
                                   )}
                                 </div>
                                 <p className="text-[10px] font-mono text-gray-500">
                                   📅 {app.date} | {app.timeSlot}
                                 </p>
                               </div>
                              <div className="flex items-center space-x-2">
                                <a 
                                  href={getWhatsAppShareText(app)}
                                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 p-1.5 rounded-lg text-[10px] uppercase font-bold text-center inline-block"
                                  title="Share Receipt on WhatsApp"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Share Receipt
                                </a>
                                <button 
                                  onClick={() => cancelAppointment(app.id)}
                                  className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg text-[10px] font-bold"
                                  title="Remove local ticket reference"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* 💚 DYNAMIC CLINIC FOOTER */}
      <footer className="bg-brand-green-800 text-white pt-12 pb-24 lg:pb-12 px-4 sm:px-6 lg:px-8 border-t-4 border-brand-brown-light text-left relative overflow-hidden">
        {/* Abstract leaf shape decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-green-700/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10 text-xs text-emerald-100">
          
          {/* Col 1: Brand description */}
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-white text-brand-green-800 font-serif font-black text-xl flex items-center justify-center">
                🌿
              </div>
              <span className="font-serif text-lg font-bold tracking-tight text-white">
                Prakruti Clinic
              </span>
            </div>
            
            <p className="leading-relaxed text-emerald-200">
              Prakruti Family Clinic (प्रकृति फैमिली क्लिनिक) isRabodi Thane's trusted center for comprehensive in-person medical consulting, pediatric therapies, and holistic lifestyle coaching.
            </p>

            <div className="flex items-center space-x-2 text-white">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <strong className="text-sm font-bold">4.9 Stars Verified Ratings on Google</strong>
            </div>
          </div>

          {/* Col 2: High priority links */}
          <div className="space-y-3 text-left">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">Quick Clinic Guide</h4>
            <ul className="space-y-2 text-emerald-200">
              <li>
                <button onClick={() => navigateTo('home')} className="hover:text-white transition">🏠 Home Frontdesk</button>
              </li>
              <li>
                <button onClick={() => navigateTo('services')} className="hover:text-white transition">🌿 Services & OPD Consults</button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-white transition">📖 About Story & Dr. Profile</button>
              </li>
              <li>
                <button onClick={() => navigateTo('reviews')} className="hover:text-white transition">⭐ Hinglish Patients Reviews</button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-white transition">📅 Map Coordinates & Timings</button>
              </li>
            </ul>
          </div>

          {/* Col 3: Specific Services links */}
          <div className="space-y-3 text-left">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">Primary Operations</h4>
            <ul className="space-y-2 text-emerald-200">
              <li>General Health Consultation Description</li>
              <li>Pediatric Flu, Virals, and Cough Relief</li>
              <li>Hypertension BP & Sugar control</li>
              <li>Preventive diagnostic screening</li>
              <li>Women Anemia & Hormonal Wellness</li>
            </ul>
          </div>

          {/* Col 4: Thane Location contact card */}
          <div className="space-y-4 text-left">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">Location & Contact</h4>
            
            <div className="space-y-2 text-emerald-200 leading-snug">
              <p className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Shop No 2, KP Annex, Kisan Nagar 3, Rabodi, Thane West, MH 400601</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`tel:${CLINIC_INFO.phone}`} className="hover:underline text-white font-mono">{CLINIC_INFO.phoneDisplay}</a>
              </p>
              <p className="flex items-center space-x-2 text-xs">
                <span>⏱️ Slots:</span>
                <span className="bg-brand-green-700 px-2 py-0.5 rounded text-white font-mono">09:30 AM - 09:30 PM (Daily)</span>
              </p>
            </div>
          </div>

        </div>

        {/* Lower legal copyright details */}
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-brand-green-700/60 text-center text-[10px] text-emerald-300">
          <p>© {new Date().getFullYear()} Prakruti Family Clinic (प्रकृति फैमिली क्लिनिक) • Rabodi, Thane West. All rights reserved.</p>
          <p className="mt-1 text-emerald-400/80">Designed for ultimate family wellness, natural healing metrics, and precise diagnostics.</p>
        </div>
      </footer>

      {/* 💬 FLOATING WHATSAPP BUTTON (BOTTOM-RIGHT) */}
      <a 
        href={`https://wa.me/919892858656?text=Hello%20Prakruti%20Family%20Clinic,%20I'd%20like%2520to%20know%20more%20about%20your%20clinical%20timings%20and%20consultations.`}
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:shadow-emerald-500/30 transition-all hover:scale-105 flex items-center justify-center group"
        title="Chat on WhatsApp"
        id="floating-whatsapp-btn"
      >
        <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 ease-out text-xs font-black text-white whitespace-nowrap mr-0 group-hover:mr-2">
          Chat with Clinic
        </span>
        <svg 
          className="w-6.5 h-6.5 fill-white text-emerald-500" 
          viewBox="0 0 24 24" 
          width="24" 
          height="24"
        >
          <path d="M12.012 2C6.5 2 2.006 6.5 2.006 12a10 10 0 0 0 1.5 5.25L2 22l4.838-1.425c1.537.938 3.325 1.425 5.174 1.425 5.513 0 10.007-4.5 10.007-10S17.525 2 12.012 2zm0 18.25c-1.637 0-3.237-.413-4.637-1.2l-.338-.2-.337-.188-2.812.825.85-2.738-.225-.337A8.138 8.138 0 0 1 3.513 12c0-4.55 3.812-8.25 8.5-8.25s8.5 3.7 8.5 8.25-3.812 8.25-8.5 8.25zm4.688-6.313c-.263-.125-1.55-.762-1.787-.85-.238-.087-.413-.125-.588.125-.175.25-.675.85-.825 1.025-.15.175-.3.2-.563.075-.262-.125-1.112-.413-2.125-1.313-.787-.7-1.312-1.563-1.475-1.838-.162-.275-.012-.425.125-.562.125-.125.263-.3.388-.45.125-.15.163-.25.25-.425.087-.175.037-.337-.013-.462-.05-.125-.413-1.025-.562-1.387-.15-.363-.3-.313-.413-.313H8.35c-.175 0-.463.063-.7.313-.238.25-.925.9-1.075 2.213-.15 1.312.8 2.575.913 2.725.112.15 1.875 2.875 4.537 4.025.638.275 1.138.438 1.525.563.638.2 1.225.175 1.688.112.513-.075 1.55-.638 1.775-1.25.225-.613.225-1.138.15-1.25-.075-.125-.263-.188-.525-.313z" />
        </svg>
      </a>

      {/* 📱 MOBILE QUICK ACTION BUTTONS STICKY DESK (ONLY ON SM DEV WRAPPERS) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-green-100 z-40 grid grid-cols-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] py-2 px-3 gap-2">
        <a 
          href={`tel:${CLINIC_INFO.phone}`} 
          className="bg-brand-green-50 text-brand-green-800 hover:bg-brand-green-100 text-xs font-bold py-3.5 px-2 rounded-xl text-center flex items-center justify-center space-x-2 transition border border-brand-green-150"
        >
          <Phone className="w-4 h-4 text-brand-green-600" />
          <span>Call 09892858656</span>
        </a>
        <button 
          onClick={() => navigateTo('contact')}
          className="bg-brand-green-600 hover:bg-brand-green-700 text-white text-xs font-bold py-3.5 px-2 rounded-xl text-center flex items-center justify-center space-x-2 transition shadow-md"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

    </div>
  );
}

