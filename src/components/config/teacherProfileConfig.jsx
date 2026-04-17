import { AdminPricingConfig } from '@/api/entities';

// This file centralizes configuration that might otherwise be fetched on-the-fly,
// ensuring components have immediate access to necessary data without waiting for an async call.
// In a real-world scenario, this might be populated from a build-time script or a default fallback.

// Default values, similar to those in AdminPricingManagement, to ensure form works even if DB fetch fails.
const DEFAULT_PACKAGE_TIERS = [
    { name: 'Small', minHours: 5, maxHours: 9 },
    { name: 'Medium', minHours: 10, maxHours: 19 },
    { name: 'Large', minHours: 20, maxHours: 40 },
];

export const TEACHER_PROFILE_CONFIG = {
  PACKAGE_TIERS: DEFAULT_PACKAGE_TIERS,
};

// Asynchronous function to get the live config from the database.
// This is not used by default in the form to avoid making it async, but it's available for other modules.
export const getLivePricingConfig = async () => {
  try {
    const configs = await AdminPricingConfig.filter({ isActive: true });
    if (configs.length > 0) {
      return configs[0];
    }
    return null; // or return default config
  } catch (error) {
    console.error("Failed to fetch live pricing config:", error);
    return null;
  }
};