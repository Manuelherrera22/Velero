const { createStore } = require('zustand/vanilla');

const store = createStore((set) => ({
  images_meta: {
    portada: '',
    camarote: [],
  },
  addPhoto: (category, url) => set((state) => {
    const imagesMeta = { ...state.images_meta };
    if (category === 'portada') {
      imagesMeta.portada = url;
    } else {
      if (!imagesMeta[category]) imagesMeta[category] = [];
      imagesMeta[category] = [...imagesMeta[category], url];
    }
    return { images_meta: imagesMeta };
  }),
}));

store.getState().addPhoto('camarote', 'url1');
store.getState().addPhoto('camarote', 'url2');
store.getState().addPhoto('camarote', 'url3');

console.log(store.getState().images_meta.camarote);
