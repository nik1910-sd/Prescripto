 /** @type {import('tailwindcss').Config} */
export default {
   content:  [
    "./index.html",                 // root index.html
    "./src/**/*.{js,jsx,ts,tsx}",   // all React files
  ],
   theme: {
     extend: {
      colors:{
        'primary':"#5F6FFF "
      }
     },
   },
   plugins: [],
 }