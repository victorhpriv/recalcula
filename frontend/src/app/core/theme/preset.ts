import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Tema PrimeNG alinhado ao sistema visual do Saldo:
 * verde-esmeralda escuro como cor principal, superfícies neutras levemente esverdeadas,
 * cantos menores nos controles.
 */
export const AppPreset = definePreset(Aura, {
  primitive: {
    emerald: {
      50: '#ecf8f3', 100: '#d2efe3', 200: '#a6dfc8', 300: '#6fc7a7', 400: '#3aa985', 500: '#178f6c',
      600: '#0e7a5c', 700: '#0c624b', 800: '#0b4e3d', 900: '#093f32', 950: '#04241c',
    },
  },
  semantic: {
    primary: {
      50: '{emerald.50}', 100: '{emerald.100}', 200: '{emerald.200}', 300: '{emerald.300}', 400: '{emerald.400}',
      500: '{emerald.500}', 600: '{emerald.600}', 700: '{emerald.700}', 800: '{emerald.800}', 900: '{emerald.900}',
      950: '{emerald.950}',
    },
    formField: { borderRadius: '8px' },
    colorScheme: {
      light: {
        primary: { color: '{primary.600}', contrastColor: '#ffffff', hoverColor: '{primary.700}', activeColor: '{primary.800}' },
        surface: {
          0: '#ffffff', 50: '#f6f8f5', 100: '#eef1ed', 200: '#e1e6e0', 300: '#c9d0c8', 400: '#a3aca5',
          500: '#8b968f', 600: '#66726b', 700: '#4f5d56', 800: '#2c3933', 900: '#14211b', 950: '#0b1410',
        },
      },
      dark: {
        primary: { color: '{primary.400}', contrastColor: '#06140f', hoverColor: '{primary.300}', activeColor: '{primary.200}' },
        surface: {
          0: '#ffffff', 50: '#e6ede9', 100: '#c9d3ce', 200: '#a5b2ab', 300: '#87948d', 400: '#6f7c75',
          500: '#4c5953', 600: '#33403a', 700: '#24312b', 800: '#19241f', 900: '#141d19', 950: '#0d1411',
        },
      },
    },
  },
});
