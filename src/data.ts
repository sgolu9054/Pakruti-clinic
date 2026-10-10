import { ServiceItem, Review } from './types';

export const CLINIC_INFO = {
  name: "Prakruti Family Clinic",
  nameHindi: "प्रकृति फैमिली क्लिनिक",
  tagline: "Prakriti Se Swasthya, Parivaar Ki Sehat",
  taglineHindi: "प्रकृति से स्वास्थ्य, परिवार की सेहत",
  phone: "09892858656",
  phoneDisplay: "+91 9892858656",
  whatsapp: "9892858656",
  address: "Shop No 2, K P Annex Building, Shivaji Nagar Rd, Near Postman Apt, Kisan Nagar 3, Rabodi, Thane West, Thane, Maharashtra 400601",
  shortAddress: "Rabodi, Thane West",
  googleRating: 4.9,
  reviewCount: 21,
  googleMapsUrl: "https://maps.google.com/?cid=12142273183574167380", // Real business identifier standard
  // Embed map using the coordinates of K P Annex Building, Rabodi, Thane
  // Standard Google Maps iframe embed for Shivaji Nagar Rd, Rabodi, Thane
  mapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3767.8936998632617!2d72.97746401077755!3d19.200927847959046!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b931985b8ff3%3A0xeebd2cc7195d2c4!2sKP%20Annex%20Co-op%20Hsg%20Soc%20Ltd!5e0!3m2!1sen!2sin!4v1719000000000!5m2!1sen!2sin",
};

export const CLINIC_TIMINGS = [
  { day: "Monday", slots: "09:30 AM - 01:30 PM, 05:30 PM - 09:30 PM" },
  { day: "Tuesday", slots: "09:30 AM - 01:30 PM, 05:30 PM - 09:30 PM" },
  { day: "Wednesday", slots: "09:30 AM - 01:30 PM, 05:30 PM - 09:30 PM" },
  { day: "Thursday", slots: "09:30 AM - 01:30 PM, 05:30 PM - 09:30 PM" },
  { day: "Friday", slots: "09:30 AM - 01:30 PM, 05:30 PM - 09:30 PM" },
  { day: "Saturday", slots: "09:30 AM - 01:30 PM, 05:30 PM - 09:30 PM" },
  { day: "Sunday", slots: "10:00 AM - 01:00 PM (Holiday Evening)" }
];

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: "general-opd",
    title: "General OPD Consultation",
    titleHindi: "सामान्य ओपीडी परामर्श",
    description: "Comprehensive medical evaluation and symptom-based diagnosis for general illness, acute aches, and general physical checkups.",
    category: "general",
    features: [
      "Expert diagnosis for common ailments",
      "Blood pressure & pulse evaluation",
      "General prescription & medical advisory",
      "Tailored lifestyle/diet recommendations"
    ]
  },
  {
    id: "family-health",
    title: "Family Healthcare (All Ages)",
    titleHindi: "सभी उम्र के लिए पारिवारिक स्वास्थ्य",
    description: "Holistic care for the entire family. From toddlers to senior citizens, we establish wellness for every generational tier.",
    category: "family",
    features: [
      "Geriatric routine investigations",
      "Immunity boosting suggestions",
      "Chronic lifestyle monitoring",
      "Complete family wellness card"
    ]
  },
  {
    id: "child-care",
    title: "Child & Pediatric Care",
    titleHindi: "बाल एवं शिशु रोग देखभाल",
    description: "Specialized gentle evaluations for infants and kids. Promoting correct nutrition, physical milestones, and growth tracking.",
    category: "pediatric",
    features: [
      "Infant development tracking",
      "Seasonal flu and child infections treatment",
      "Pediatric dietary guides & advice",
      "Compassionate child-friendly clinic environment"
    ]
  },
  {
    id: "womens-health",
    title: "Women's Health",
    titleHindi: "महिला स्वास्थ्य देखभाल",
    description: "Dedicated primary healthcare focusing on women's physiological needs, reproductive health counseling, anemia, and hormonal wellness.",
    category: "women",
    features: [
      "Hormonal checkups & counselor support",
      "Anemia and nutritional care programs",
      "Thyroid & menstrual health guidance",
      "Discreet and supportive atmosphere"
    ]
  },
  {
    id: "fever-infections",
    title: "Fever, Cold & Infections",
    titleHindi: "बुखार, सर्दी और संक्रमण का इलाज",
    description: "Rapid relief from seasonal fevers, cough, gastrointestinal problems, stomach bugs, malaria, dengue, typhoid, and virus control.",
    category: "preventive",
    features: [
      "Malaria & Dengue screening support",
      "Rapid temperature & hydration support",
      "Symptom management for virus spreads",
      "Safe and targeted antibiotic prescription guides"
    ]
  },
  {
    id: "chronic-mgmt",
    title: "Chronic Disease Management",
    titleHindi: "क्रोनिक बीमारी प्रबंधन",
    description: "Effective supervision of long-term conditions like Hypertension (BP), Diabetes (Sugar), and Thyroid conditions.",
    category: "chronic",
    features: [
      "Periodic blood sugar monitoring (HBA1C)",
      "Hypertension therapeutic charting",
      "Thyroid medicine dosage adjustments",
      "Organ protection therapy guidelines"
    ]
  },
  {
    id: "preventive-checkup",
    title: "Preventive Health Checkup",
    titleHindi: "निवारक स्वास्थ्य जांच",
    description: "Comprehensive health screenings designed to identify risk elements early, helping your family stay healthy naturally.",
    category: "preventive",
    features: [
      "Organ wellness primary screening",
      "Cholesterol & BP regular charting",
      "Metabolic health calculations",
      "Preventive consultation & plans"
    ]
  }
];

export const REVIEWS_DATA: Review[] = [
  {
    id: "rev-1",
    patientName: "Rajesh S. Mhatre",
    rating: 5,
    treatment: "Chronic BP & Diabetes",
    comment: "Dr. is very polite and listens to patient's problem patiently. Treatment cost is also very reasonable. Rabodi area me options to bahut saare hain par Prakruti Clinic jaisa trusted setup kahin nahi. Real care with minimal dosage of medicine.",
    date: "2 weeks ago",
    commentHindi: "डॉक्टर साहब बहुत ही विनम्र हैं और मरीज की समस्या को बहुत धैर्य से सुनते हैं। इलाज का खर्च भी बहुत वाजिब है। राबोडी क्षेत्र में परिवार के लिए प्राकृतिक जीवनशैली के साथ इलाज करने के लिए इससे बेहतर जगह और कोई नहीं।"
  },
  {
    id: "rev-2",
    patientName: "Pooja Deshmukh",
    rating: 5,
    treatment: "Child Fever & Nutrition",
    comment: "Highly recommended for kids and elderly family members. Prakruti clinic is our family's trusted helper. Doctor explain diagnostics very well so we don't worry unnecessarily. My son recovered from viral fever in just 2 days.",
    date: "1 month ago",
    commentHindi: "बच्चों और बुजुर्गों के लिए पूरी तरह से अनुशंसित। डॉक्टर हर बात को इतने अच्छे से समझाते हैं कि हमारी आधी चिंता वहीं दूर हो जाती है।"
  },
  {
    id: "rev-3",
    patientName: "Amit Mishra",
    rating: 5,
    treatment: "General OPD / Immunity",
    comment: "Rabodi aur Kisan Nagar block ka sabse best family clinic. Simple solutions, minimum medicines, nature touch. General health checkup was fast and cost-effective. Highly clean place.",
    date: "3 weeks ago"
  },
  {
    id: "rev-4",
    patientName: "Gauri Nair",
    rating: 5,
    treatment: "Thyroid Management & BP",
    comment: "My grandmother's thyroid issues and high blood pressure has been under perfect control since we came to Prakruti Clinic. Trustworthy medical advice, no unwanted blood tests recommended. Family friendly environment.",
    date: "2 months ago"
  },
  {
    id: "rev-5",
    patientName: "Siddhesh K. Patil",
    rating: 5,
    treatment: "Viral Fever Recovery",
    comment: "Great experience. Appointment booking process is very smooth. Dr. speaks very fluently in Marathi, Hindi and English, which made my elderly parents feel comfortable and at home.",
    date: "3 days ago"
  }
];

export const ABOUT_STORY = {
  welcome: "A Warm Welcome to Prakruti Family Clinic",
  welcomeHindi: "प्रकृति फैमिली क्लिनिक में आपका हार्दिक स्वागत है",
  tagline: "Your Partner in Wellness & Holistic Family Care in Thane",
  contentParagraphs: [
    "Established in Rabodi, Thane West, Prakruti Family Clinic was founded on a simple yet profound vision: to provide healthcare that is scientific, personalized, and grounded in nature. Over the years, we have grown into one of Thane's most trusted medical resources, upholding an exceptional 4.9★ Google rating backed by numerous happy families.",
    "Our clinical philosophy revolves around the Sanskrit word 'Prakruti'—meaning 'Nature' or 'Inherent Disposition'. We understand that every body has its own unique biology. Hence, our diagnostic approach focuses on identifying the root causes of medical disorders instead of merely suppressing superficial symptoms.",
    "By blending state-of-the-art general medicine standards with holistic, family-centric health advisory, we guide families through preventive, acute, and chronic disease management. To make high-end medical care accessible to all, we sustain extremely affordable consultation charges with patient, empathetic attention close to your home."
  ],
  whyTrustUs: [
    {
      title: "Holistic Health First",
      titleHindi: "समग्र स्वास्थ्य को प्राथमिकता",
      description: "We minimize unnecessary medications and focus on holistic recovery, emphasizing dietary coaching and natural wellness adjustments alongside clinical treatment."
    },
    {
      title: "Family Rooted Experience",
      titleHindi: "पारिवारिक जुड़ाव और अनुभव",
      description: "We are proudly configured as a comprehensive family practice, serving pediatric cases, youth counseling, maternity wellness support, and senior citizen geriatric care under a single roof."
    },
    {
      title: "Transparent & Empathetic",
      titleHindi: "स्पष्टता और सहानुभूति पूर्ण सेवा",
      description: "No hidden costs, no unnecessary tests or referrals. Just plain, honest scientific medical consultation with clear treatment routes that respect your budget."
    },
    {
      title: "Stellar Regional Repute",
      titleHindi: "प्रशंसित क्षेत्रीय पहचान",
      description: "Rated 4.9 Stars on Google by patients across Rabodi, Kisan Nagar, and Thane West. Our patient reviews celebrate our care, diagnostic speed, and polite nature."
    }
  ]
};
