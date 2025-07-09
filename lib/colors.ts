// Paleta de colores consistente para ChickenBroster ERP
export const colors = {
  // Colores principales
  primary: {
    50: 'from-orange-50 to-amber-50',
    100: 'from-orange-100 to-amber-100',
    200: 'from-orange-200 to-amber-200',
    300: 'from-orange-300 to-amber-300',
    400: 'from-orange-400 to-amber-400',
    500: 'from-orange-500 to-amber-500',
    600: 'from-orange-600 to-amber-600',
    700: 'from-orange-700 to-amber-700',
    800: 'from-orange-800 to-amber-800',
    900: 'from-orange-900 to-amber-900',
  },
  
  // Colores de texto
  text: {
    primary: 'text-orange-600',
    secondary: 'text-orange-700',
    muted: 'text-gray-600 dark:text-gray-300',
    dark: 'text-gray-900 dark:text-white',
  },
  
  // Colores de fondo
  background: {
    primary: 'bg-orange-50 dark:bg-orange-900/20',
    secondary: 'bg-amber-50 dark:bg-amber-900/20',
    card: 'bg-white dark:bg-gray-800',
    gradient: 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800',
  },
  
  // Colores de bordes
  border: {
    primary: 'border-orange-200 dark:border-orange-800',
    secondary: 'border-amber-200 dark:border-amber-800',
    focus: 'border-orange-500 focus:ring-orange-500/20',
  },
  
  // Estados
  status: {
    active: 'bg-orange-100 text-orange-800 border-orange-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  },
  
  // Gradientes
  gradients: {
    primary: 'bg-gradient-to-r from-orange-600 to-amber-600',
    card: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
    text: 'bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent',
  },
  
  // Hover states
  hover: {
    primary: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
    button: 'hover:bg-orange-600 hover:text-white',
    card: 'hover:shadow-lg hover:shadow-orange-500/25',
  },
}

// Clases CSS predefinidas para uso común
export const colorClasses = {
  // Cards
  cardPrimary: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
  cardSecondary: 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
  
  // Buttons
  buttonPrimary: 'bg-orange-600 hover:bg-orange-700 text-white',
  buttonSecondary: 'border-orange-300 text-orange-600 hover:bg-orange-600 hover:text-white',
  
  // Text
  titlePrimary: 'bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent',
  textPrimary: 'text-orange-600',
  textSecondary: 'text-gray-600 dark:text-gray-300',
  
  // Icons
  iconPrimary: 'text-orange-600',
  iconSecondary: 'text-amber-600',
  
  // Progress bars
  progressPrimary: 'bg-orange-200',
  
  // Badges
  badgeActive: 'bg-orange-100 text-orange-800 border-orange-200',
  badgeSuccess: 'bg-green-100 text-green-800 border-green-200',
  badgeWarning: 'bg-amber-100 text-amber-800 border-amber-200',
  badgeError: 'bg-red-100 text-red-800 border-red-200',
} 