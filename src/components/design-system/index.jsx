
// Export all design system components
export { Colors, getSubjectColor, getPriorityColor, cssVariables } from './Colors';
export { Typography, getResponsiveTextSize, textClasses } from './Typography';

// Import for internal use in Theme object
import { Colors } from './Colors';
import { Typography } from './Typography';

// Combined theme object
export const Theme = {
  colors: Colors,
  typography: Typography,
};

export default Theme;
