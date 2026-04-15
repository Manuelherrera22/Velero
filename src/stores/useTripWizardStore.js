import { create } from 'zustand'

const initialData = {
  // Step 1: Details
  title: '',
  description: '',
  role_in_activity: 'capitan',
  
  // Step 2: Location
  location: '',
  coordinates: null,

  // Step 3: Itinerary
  duration_days: 1,
  duration_nights: 0,
  pension_type: '',
  itinerary: [], // [{ day: 1, description: '' }]

  // Step 4: Photos
  images_meta: {
    portada: '',
    camarote: [],
    actividad: [],
    comidas: [],
    paisaje: []
  },

  // Step 5: Services & Boat
  included_services: [],
  excluded_services: [],
  boat_id: null,

  // Step 6-7: TBD properties 
  tags: [],

  // Step 8: Price & Limits
  price_per_person: 0,
  allow_full_boat: false,
  full_boat_price: 0,
  min_passengers: 1,
  max_passengers: 6,
  allowed_payment_methods: ['PayPal'],
  cancellation_policy: '',
  requires_full_payment: true,

  // Step 9: Dates
  custom_dates: [] // Local array before saving to DB
}

export const useTripWizardStore = create((set, get) => ({
  currentStep: 1,
  totalSteps: 10,
  formData: { ...initialData },

  // Navigation
  nextStep: () => set((state) => ({ 
    currentStep: Math.min(state.currentStep + 1, state.totalSteps) 
  })),
  prevStep: () => set((state) => ({ 
    currentStep: Math.max(state.currentStep - 1, 1) 
  })),
  setStep: (step) => set({ currentStep: step }),

  // Form Updates
  updateFormData: (updates) => set((state) => ({
    formData: { ...state.formData, ...updates }
  })),

  // Array Updates (Services, Policies)
  toggleService: (type, serviceName) => {
    // type = 'included_services' or 'excluded_services'
    const arr = get().formData[type];
    const isPresent = arr.includes(serviceName);
    
    // Logic: if adding to included, ensure removed from excluded, and vice versa.
    set((state) => {
      const oppositeType = type === 'included_services' ? 'excluded_services' : 'included_services';
      return {
        formData: {
          ...state.formData,
          [type]: isPresent ? arr.filter((s) => s !== serviceName) : [...arr, serviceName],
          [oppositeType]: state.formData[oppositeType].filter((s) => s !== serviceName)
        }
      };
    });
  },

  // Photos Meta Management
  addPhoto: (category, url) => set((state) => {
    const imagesMeta = { ...state.formData.images_meta };
    if (category === 'portada') {
      imagesMeta.portada = url;
    } else {
      if (!imagesMeta[category]) imagesMeta[category] = [];
      imagesMeta[category] = [...imagesMeta[category], url];
    }
    return { formData: { ...state.formData, images_meta: imagesMeta }};
  }),

  removePhoto: (category, url) => set((state) => {
    const imagesMeta = { ...state.formData.images_meta };
    if (category === 'portada') {
      imagesMeta.portada = '';
    } else {
      imagesMeta[category] = imagesMeta[category].filter(i => i !== url);
    }
    return { formData: { ...state.formData, images_meta: imagesMeta }};
  }),

  // Reset entirely
  resetWizard: () => set({ currentStep: 1, formData: { ...initialData } })
}))
