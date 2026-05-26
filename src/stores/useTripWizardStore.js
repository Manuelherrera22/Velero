import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const initialData = {
  // Step 1: Details
  title: '',
  description: '',
  role_in_activity: 'capitan',
  
  // Step 2: Location
  location: '',
  exact_location: '',
  location_reference: '',
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
  included_services: ['Seguro', 'Capitán', 'Salvavidas'],
  excluded_services: [],
  custom_services: [],
  boat_id: null,

  // Step 6-7: TBD properties 
  tags: [],

  // Step 8: Price & Limits
  price_per_person: 0,
  allow_full_boat: false,
  full_boat_price: 0,
  discount_percentage: 0,
  min_passengers: 1,
  max_passengers: 6,
  allowed_payment_methods: ['PayPal'],
  requires_full_payment: true,

  // Step 9: Dates
  custom_dates: [] // Local array before saving to DB
}

export const useTripWizardStore = create(
  persist(
    (set, get) => ({
      currentStep: 1,
  totalSteps: 8,
  formData: { ...initialData },
  hasBookings: false,

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

  addCustomService: (serviceName) => {
    set((state) => {
      const isAlreadyIncluded = state.formData.included_services.includes(serviceName);
      return {
        formData: {
          ...state.formData,
          custom_services: [...new Set([...(state.formData.custom_services || []), serviceName])],
          included_services: isAlreadyIncluded ? state.formData.included_services : [...state.formData.included_services, serviceName],
          excluded_services: state.formData.excluded_services.filter(s => s !== serviceName)
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

  // Replace a blob URL with a real uploaded URL (used by eager upload)
  replacePhoto: (category, oldUrl, newUrl) => set((state) => {
    const imagesMeta = { ...state.formData.images_meta };
    if (category === 'portada') {
      if (imagesMeta.portada === oldUrl) {
        imagesMeta.portada = newUrl;
      }
    } else {
      imagesMeta[category] = (imagesMeta[category] || []).map(u => u === oldUrl ? newUrl : u);
    }
    return { formData: { ...state.formData, images_meta: imagesMeta }};
  }),

  getTotalPhotos: () => {
    const imagesMeta = get().formData.images_meta;
    let count = imagesMeta.portada ? 1 : 0;
    ['camarote', 'actividad', 'comidas', 'paisaje'].forEach(cat => {
      count += (imagesMeta[cat] || []).length;
    });
    return count;
  },

      // Reset entirely
      resetWizard: () => set({ currentStep: 1, formData: { ...initialData }, hasBookings: false }),

      // Init for Edit
      initForEdit: (tripData, datesData, hasBookings = false) => {
        const loadedData = tripData.metadata || { ...initialData };
        
        if (datesData && datesData.length > 0) {
          const durationDays = loadedData.duration_days || 1;
          loadedData.custom_dates = datesData.map(d => {
            const depDate = d.date;
            const arrDate = new Date(depDate + 'T12:00:00');
            arrDate.setDate(arrDate.getDate() + (durationDays - 1));
            const arrDateStr = arrDate.toISOString().split('T')[0];
            
            // Generate all_dates array for multi-day trips
            let allDates = undefined;
            if (durationDays > 1) {
              allDates = [];
              const cur = new Date(depDate + 'T12:00:00');
              for (let i = 0; i < durationDays; i++) {
                allDates.push(cur.toISOString().split('T')[0]);
                cur.setDate(cur.getDate() + 1);
              }
            }
            
            return {
              id: d.id,
              departure_date: depDate,
              arrival_date: arrDateStr,
              departure_time: d.start_time?.slice(0, 5) || '08:00',
              arrival_time: d.end_time?.slice(0, 5) || '',
              price_per_person: d.price_per_person_override || loadedData.price_per_person || 0,
              full_boat_price: d.full_boat_price_override || loadedData.full_boat_price || 0,
              available_spots: d.available_spots,
              blocked_spots: d.blocked_spots || 0,
              all_dates: allDates
            };
          });
        }

        set({
          currentStep: 1,
          formData: { ...initialData, ...loadedData, id: tripData.id },
          hasBookings: hasBookings
        });
      },

      copyFromTrip: (tripData, datesData) => {
        const loadedData = tripData.metadata || { ...initialData };
        
        if (datesData && datesData.length > 0) {
          loadedData.custom_dates = datesData.map(d => ({
            id: crypto.randomUUID(), // New UUIDs for dates
            departure_date: d.date,
            departure_time: d.start_time?.slice(0, 5) || '08:00',
            arrival_time: d.end_time?.slice(0, 5) || '',
            available_spots: d.available_spots,
            blocked_spots: d.blocked_spots || 0
          }));
        }

        set({
          currentStep: 1,
          formData: { ...initialData, ...loadedData, id: null, title: loadedData.title ? loadedData.title + ' (Copia)' : '' },
          hasBookings: false
        });
      }
    }),
    {
      name: 'trip-wizard-draft',
      partialize: (state) => ({
        ...state,
        formData: {
          ...state.formData,
          images_meta: { ...initialData.images_meta } // Don't persist blob URLs
        }
      })
    }
  )
)
