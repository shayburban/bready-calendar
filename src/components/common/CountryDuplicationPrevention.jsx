import React, { useState, useEffect } from 'react';
import { Country } from '@/api/entities';

// Backend-side duplication prevention service
export const CountryDataService = {
  // Clean and deduplicate countries
  async cleanupCountryData() {
    try {
      const countries = await Country.list();
      const seen = new Set();
      const duplicates = [];
      const cleaned = [];

      // Identify duplicates by phone_country_code
      countries.forEach(country => {
        const key = country.phone_country_code;
        if (seen.has(key)) {
          duplicates.push(country);
        } else {
          seen.add(key);
          cleaned.push(country);
        }
      });

      console.log(`Found ${duplicates.length} duplicate countries:`, duplicates.map(c => c.country_name));
      return { cleaned, duplicates };
    } catch (error) {
      console.error('Error cleaning country data:', error);
      return { cleaned: [], duplicates: [] };
    }
  },

  // Get unique countries sorted alphabetically
  async getUniqueCountries() {
    const countries = await Country.list();
    const uniqueMap = new Map();

    // Use phone_country_code as key to prevent duplicates
    countries.forEach(country => {
      if (!uniqueMap.has(country.phone_country_code)) {
        uniqueMap.set(country.phone_country_code, country);
      }
    });

    return Array.from(uniqueMap.values())
      .sort((a, b) => a.country_name.localeCompare(b.country_name));
  }
};