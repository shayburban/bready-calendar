/**
 * COMPREHENSIVE BEST PRACTICES GUIDE FOR BASE44 APPLICATION DEVELOPMENT
 * =======================================================================
 * 
 * This document outlines the essential guidelines, constraints, and best practices
 * for developing applications on the Base44 platform. It serves as a reference
 * for maintaining code quality, ensuring platform compatibility, and delivering
 * robust, maintainable applications.
 * 
 * Last Updated: [Current Date]
 * Version: 2.1
 */

export const BEST_PRACTICES = {

  // ============================================================================
  // 1. PLATFORM CONSTRAINTS & LIMITATIONS
  // ============================================================================
  
  platformConstraints: {
    fileTypes: {
      supported: [
        "JavaScript (.js)",
        "JSX (.jsx)", 
        "JSON (.json)",
        "CSS (globals.css only)"
      ],
      unsupported: [
        ".ts/.tsx files",
        "separate CSS/SCSS modules", 
        "test files (.test.js)",
        "config files (webpack, babel, etc.)"
      ]
    },
    
    librariesAndPackages: {
      available: [
        "React (with hooks)",
        "React Router DOM (Link, useNavigate)",
        "Tailwind CSS (utility classes)",
        "Shadcn/UI components (@/components/ui/*)",
        "Lucide React (icons only - verify icon exists)",
        "Date-fns, Lodash, Moment.js",
        "Recharts (charts/graphs)",
        "React Quill (rich text)",
        "React Hook Form",
        "React Markdown",
        "Three.js (3D graphics)",
        "React Leaflet (maps)",
        "@hello-pangea/dnd (drag & drop)"
      ],
      forbidden: [
        "Any external npm packages not listed above",
        "CDN imports",
        "External API calls (use integrations instead)"
      ]
    },

    codeStructure: {
      entities: "JSON schema files defining data structure",
      pages: "React components exported as default",
      components: "Reusable React components in organized folders",
      layout: "Single Layout.js wrapping all pages",
      styling: "Tailwind classes + globals.css for global styles"
    }
  },

  // ============================================================================
  // 2. AUTOMATIC ROLE MANAGEMENT SYSTEM
  // ============================================================================

  roleManagement: {
    /**
     * KEY FEATURES:
     * 1. **Automatic Role Creation**: On every app startup, it checks if essential roles exist and creates any that are missing
     * 2. **Project Copy Protection**: When you copy the project, the new database will automatically get all essential roles on first load
     * 3. **Accidental Deletion Recovery**: If roles are accidentally deleted, they'll be restored on the next app load
     * 4. **Comprehensive Role Set**: Includes both internal roles (admin, teacher, student) and external roles (doctor, patient, guest) with their perspectives
     * 5. **Silent Operation**: Runs in the background without affecting user experience, with helpful console logs for debugging
     */

    essentialRoles: {
      internal: [
        "admin",
        "teacher", 
        "teacher-t (As A Teacher)",
        "student-s (As A Student)",
        "student"
      ],
      external: [
        "guest",
        "doctor",
        "doctor-d (As A Doctor)", 
        "patient-p (As A Patient)",
        "patient"
      ]
    },

    benefits: [
      "✅ **Project portability**: Copy projects anywhere and essential roles persist",
      "✅ **Data safety**: Accidental deletions are automatically recovered",
      "✅ **Zero maintenance**: Works automatically without admin intervention", 
      "✅ **Scalable**: Easy to add new essential roles to the array",
      "✅ **Non-disruptive**: Doesn't interfere with existing roles or user experience"
    ],

    implementation: {
      timing: "Runs automatically on every app startup",
      operation: "Silent background process with console logging for debugging",
      recovery: "Automatic restoration of accidentally deleted essential roles",
      extensibility: "Easy to extend with additional essential roles as needed"
    }
  },

  // ============================================================================
  // 3. ARCHITECTURE & TECHNICAL IMPLEMENTATION
  // ============================================================================

  architecture: {
    
    // 3.1. Frontend Stack & Folder Architecture
    frontend: {
      fixedStructure: {
        "entities/": {
          purpose: "JSON schema definitions for data models",
          format: "Pure JSON files (no JavaScript)",
          example: "entities/User.json, entities/TeacherProfile.json"
        },
        "pages/": {
          purpose: "Top-level application routes/screens",
          format: "React components exported as default",
          naming: "PascalCase matching route names"
        },
        "components/": {
          purpose: "Reusable UI components organized by feature/domain",
          structure: "Nested folders for logical grouping",
          examples: [
            "components/common/ - Shared utilities",
            "components/teacher-registration/ - Feature-specific",
            "components/layout/header/ - UI section-specific"
          ]
        },
        "Layout.js": {
          purpose: "Global page wrapper with navigation, headers, footers",
          receives: "children (page content) and currentPageName props"
        },
        "globals.css": {
          purpose: "Global styles, CSS variables, Tailwind customizations",
          constraints: "Only global file for custom CSS"
        }
      }
    },

    // 3.2. Data & Integrations
    data: {
      entitySchemas: {
        format: "JSON Schema objects defining data structure",
        builtin: "id, created_date, updated_date, created_by automatically included",
        userEntity: "Pre-built with id, email, full_name, role (cannot be recreated)",
        relationships: "Managed by Base44 platform infrastructure",
        indexing: "Automated by platform based on usage patterns"
      },
      
      integrations: {
        purpose: "External API calls and data processing",
        available: "Core package (InvokeLLM, SendEmail, UploadFile, etc.)",
        usage: "Import from @/api/integrations/PackageName",
        errorHandling: "Let errors bubble up for debugging, avoid try/catch unless specifically needed"
      }
    },

    // 3.3. Authentication & User Management
    authentication: {
      builtin: "Completely handled by Base44 platform",
      userAccess: "await User.me() to get current user",
      loginLogout: "User.login(), User.logout() methods available",
      neverImplement: "Custom login pages, authentication flows, user registration"
    },

    // 3.4. SEO & Structured Data
    seoOptimization: {
      metaTags: {
        implementation: "Add to Layout.js or individual page components",
        required: ["title", "description", "og:title", "og:description", "og:image"],
        dynamic: "Use props/state to generate contextual meta information",
        example: `
          <head>
            <title>{pageTitle} | TutorVerse</title>
            <meta name="description" content={pageDescription} />
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
          </head>
        `
      },
      
      lazyLoading: {
        components: "Use React.lazy() and Suspense for code splitting",
        images: "Implement lazy loading for images in grids/lists",
        example: `
          const LazyComponent = React.lazy(() => import('./HeavyComponent'));
          <Suspense fallback={<div>Loading...</div>}>
            <LazyComponent />
          </Suspense>
        `
      },
      
      structuredData: {
        format: "JSON-LD script tags within React components",
        schemas: {
          Person: "For teacher profiles (name, qualifications, subjects, ratings)",
          Service: "For tutoring services (pricing, availability, expertise)",
          FAQ: "For common questions pages",
          Review: "For student testimonials and ratings",
          LocalBusiness: "For region-specific services"
        },
        implementation: `
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": teacher.name,
              "jobTitle": "Online Tutor",
              "knowsAbout": teacher.subjects,
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": teacher.rating,
                "reviewCount": teacher.reviewCount
              }
            })}
          </script>
        `,
        placement: "Add to relevant page components (teacher profiles, service pages)"
      }
    }
  },

  // ============================================================================
  // 4. DEVELOPMENT WORKFLOW & CODE QUALITY
  // ============================================================================

  workflow: {
    
    // 4.1. My Role as AI Developer
    myCapabilities: [
      "Generate clean, efficient React code within platform constraints",
      "Create and modify entities, pages, components, and layouts",
      "Implement responsive designs with Tailwind CSS",
      "Write structured data markup and SEO optimizations",
      "Design component architectures for maintainability",
      "Provide code that follows modern React best practices",
      "Create comprehensive documentation and comments"
    ],

    myLimitations: [
      "Cannot perform manual testing or click-through validation",
      "Cannot take screenshots or visual comparisons", 
      "Cannot manage Git branches or version control",
      "Cannot create isolated testing environments",
      "Cannot access external services for validation",
      "Cannot write unit test files (.test.js)",
      "Cannot install additional npm packages"
    ],

    // 4.2. User Responsibilities
    userResponsibilities: [
      "Manual end-to-end testing of all user flows",
      "Visual validation against design requirements",
      "Cross-browser compatibility testing",
      "Performance monitoring and optimization feedback",
      "Branch management and version control",
      "User acceptance testing and feedback collection",
      "Quality gates and release approval"
    ],

    // 4.3. Code Quality Standards
    codeQuality: {
      componentDesign: {
        singleResponsibility: "Each component should have one clear purpose",
        maxSize: "Target 50-100 lines per component, break down if larger",
        reusability: "Design components to be reusable across contexts",
        naming: "Use descriptive, PascalCase names that indicate purpose"
      },

      stateManagement: {
        preferHooks: "Use useState, useEffect, useContext for state",
        avoidComplexity: "Break down complex state into multiple hooks",
        contextUsage: "Use Context for shared state, avoid prop drilling",
        reducers: "Use useReducer for complex state logic"
      },

      fileOrganization: {
        folderStructure: "Group components by feature/domain",
        indexFiles: "Create index.js files for cleaner imports where beneficial",
        separation: "Keep business logic separate from UI components",
        consistency: "Follow consistent naming and organization patterns"
      },

      errorHandling: {
        letErrorsBubble: "Allow errors to surface for debugging visibility",
        meaningfulErrors: "Provide clear error messages for user-facing issues",
        gracefulDegradation: "Handle missing data gracefully with defaults",
        loadingStates: "Always show loading states for async operations"
      }
    }
  },

  // ============================================================================
  // 5. TESTING & VALIDATION STRATEGY
  // ============================================================================

  testing: {
    
    // 5.1. Code-Level Quality (AI-Implemented)
    codeQuality: {
      writtenForTestability: "Structure code to be easily testable",
      pureComponents: "Minimize side effects, use pure functions where possible",
      propValidation: "Use clear prop interfaces and validation",
      errorBoundaries: "Implement error boundaries for critical sections"
    },

    // 5.2. Manual Testing Requirements (User-Performed)
    manualTesting: {
      endToEndFlows: "Test complete user journeys from start to finish",
      edgeCases: "Verify behavior with missing data, errors, edge conditions",
      crossBrowser: "Test on multiple browsers and devices",
      performance: "Monitor loading times and user experience metrics",
      accessibility: "Verify keyboard navigation and screen reader compatibility"
    },

    // 5.3. Validation Checklist
    validationChecklist: [
      "✅ Code compiles without errors or warnings",
      "✅ Components render correctly in live preview",
      "✅ Responsive design works on mobile/tablet/desktop",
      "✅ All user interactions function as expected",
      "✅ Data flows correctly between components",
      "✅ Error states display appropriate messages",
      "✅ Loading states provide clear feedback",
      "✅ SEO meta tags are present and dynamic",
      "✅ Structured data validates with schema.org tools"
    ]
  },

  // ============================================================================
  // 6. PERFORMANCE & OPTIMIZATION
  // ============================================================================

  performance: {
    
    coreWebVitals: {
      loadingOptimization: [
        "Use React.lazy() for code splitting on routes",
        "Implement image lazy loading for galleries/lists", 
        "Minimize bundle size by avoiding unnecessary imports",
        "Use efficient algorithms and data structures"
      ],
      
      interactivity: [
        "Debounce search inputs and form validation",
        "Use proper key props in lists to optimize re-rendering",
        "Memoize expensive calculations with useMemo",
        "Optimize event handlers to prevent excessive re-renders"
      ],
      
      visualStability: [
        "Define explicit dimensions for images and media",
        "Use skeleton loading states to prevent layout shift",
        "Test loading states to ensure consistent layouts"
      ]
    },

    memoryManagement: [
      "Clean up event listeners in useEffect cleanup functions",
      "Cancel pending API calls when components unmount",
      "Avoid memory leaks in timers and intervals",
      "Use WeakMap/WeakSet for temporary object references where appropriate"
    ]
  },

  // ============================================================================
  // 7. UI/UX & DESIGN STANDARDS
  // ============================================================================

  design: {
    
    responsiveDesign: {
      breakpoints: "Follow Tailwind's responsive breakpoints (sm, md, lg, xl)",
      mobileFirst: "Design for mobile, then enhance for larger screens",
      flexbox: "Use flexbox and grid for layout, avoid fixed positioning",
      testingRequired: "Always test on multiple screen sizes"
    },

    accessibility: {
      semanticHTML: "Use proper HTML tags (header, nav, main, footer, etc.)",
      keyboardNavigation: "Ensure all interactive elements are keyboard accessible",
      screenReaders: "Provide alt text, aria-labels, and proper heading hierarchy",
      colorContrast: "Ensure sufficient contrast ratios for text and backgrounds"
    },

    userExperience: {
      loadingStates: "Always show loading indicators for async operations",
      errorStates: "Provide clear, actionable error messages",
      emptyStates: "Design meaningful empty states with guidance",
      feedback: "Give immediate feedback for user actions (form submissions, etc.)"
    }
  },

  // ============================================================================
  // 8. COMMON PATTERNS & SOLUTIONS
  // ============================================================================

  commonPatterns: {
    
    formHandling: {
      validation: "Use react-hook-form for complex forms",
      realTimeValidation: "Provide immediate feedback on form errors",
      submission: "Handle loading states and success/error feedback",
      persistence: "Save form progress for multi-step forms"
    },

    dataFetching: {
      entitySDK: "Use entity SDK methods (list, create, update, delete)",
      errorHandling: "Let errors bubble up, handle at component level",
      loadingStates: "Always show loading indicators",
      caching: "Entity SDK handles caching automatically"
    },

    routing: {
      navigation: "Use createPageUrl() for internal navigation",
      parameters: "Parse URL parameters with URLSearchParams",
      linkComponent: "Use react-router-dom Link for client-side navigation"
    }
  },

  // ============================================================================
  // 9. TROUBLESHOOTING & DEBUGGING
  // ============================================================================

  debugging: {
    
    commonIssues: {
      importErrors: "Verify all imports exist in available packages",
      iconErrors: "Ensure all Lucide React icons exist before importing",
      stateIssues: "Check useEffect dependencies and state update patterns",
      routingIssues: "Verify page names match route configurations"
    },

    debuggingStrategies: [
      "Use console.log strategically for state debugging",
      "Check browser dev tools for network requests and errors",
      "Validate entity schemas match expected data structure",
      "Test components in isolation before integrating"
    ]
  }
};

/**
 * USAGE GUIDELINES
 * ================
 * 
 * This best practices guide should be referenced:
 * - Before starting any new feature or component
 * - When encountering development challenges
 * - During code review processes
 * - When onboarding new developers to the project
 * 
 * The guide will be updated as the project evolves and new patterns emerge.
 */

export default BEST_PRACTICES;