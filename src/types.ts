export interface ServiceItem {
  id: string;
  title: string;
  titleHindi: string;
  description: string;
  category: 'general' | 'family' | 'pediatric' | 'women' | 'chronic' | 'preventive';
  features: string[];
}

export interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  commentHindi?: string;
  source?: string;
  treatment: string;
  date: string;
}

export interface Appointment {
  id: string;
  name: string;
  phone: string;
  date: string;
  timeSlot: string;
  reason: string;
  status: 'Pending' | 'Confirmed' | 'Completed';
  createdAt: string;
}
