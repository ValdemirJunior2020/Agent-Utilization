// /tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        hpNavy: '#071A2D',
        hpBlue: '#0077C8',
        hpSky: '#22A7F0',
        hpSuccess: '#16A34A',
        hpWarning: '#F59E0B',
        hpDanger: '#DC2626',
        hpBg: '#F4F7FB',
        hpMuted: '#64748B',
      },
      boxShadow: {
        executive: '0 18px 55px rgba(7, 26, 45, 0.10)',
      },
    },
  },
  plugins: [],
};
