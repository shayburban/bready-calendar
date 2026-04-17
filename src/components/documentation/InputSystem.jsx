
import React from 'react';

const documentationContent = `
# Global Input Styling System Documentation

This document provides a comprehensive overview of the global input styling system, its implementation, and usage instructions.

## 1. System Design Folder Check

- **Result**: An audit of the existing project structure revealed that while some global styles for inputs exist in \`globals.css\` and component logic in \`components/common/Input.jsx\`, there was no single, consolidated global input styling component.
- **Action Taken**: A new file, \`components/common/GlobalInputStyling.jsx\`, was created to house the CSS layer, React components, and a test page, fulfilling the prompt's requirement for a centralized system. The implementation uses standard React (JSX) as the build environment did not support TypeScript syntax.

## 2. Usage Instructions

To use the new system, import the components and the style injector.

### Step 1: Apply Global Styles
Render the \`GlobalInputStyles\` component once in your main layout file (e.g., \`Layout.js\`) to inject the base styles into your application.

\`\`\`jsx
import { GlobalInputStyles } from '@/components/common/GlobalInputStyling';

export default function Layout({ children }) {
  return (
    <div>
      <GlobalInputStyles />
      {/* Rest of your layout */}
      <main>{children}</main>
    </div>
  );
}
\`\`\`

### Step 2: Use the Components
Import and use the \`Input\`, \`Textarea\`, and \`Select\` components in your pages and other components.

\`\`\`jsx
import { Input, Textarea, Select } from '@/components/common/GlobalInputStyling';

function MyForm() {
  return (
    <form>
      <Input type="text" placeholder="Your Name" />
      <Textarea placeholder="Your message" />
      <Select>
        <option>Option 1</option>
      </Select>
    </form>
  );
}
\`\`\`

## 3. Styling Details & Variants

- **Base Styles**: Applied globally via \`@layer base\` to all relevant inputs.
- **Variants**:
  - \`variant="default"\`: Standard input with a light gray background.
  - \`variant="outline"\`: Transparent background with a visible border.
  - \`variant="filled"\`: Darker gray background with no initial border.
- **Error State**: Pass the \`error\` prop to apply error styling.
  \`\`\`jsx
  <Input placeholder="Invalid input" error={true} />
  \`\`\`

## 4. Accessibility Features

- **Focus Indicators**: A clear, 2px blue ring appears on focus, meeting WCAG requirements.
- **Contrast Ratios**: Text and background colors meet WCAG AA contrast standards.
- **Disabled State**: A visually distinct, low-opacity style is applied to disabled elements.
- **Labels**: It is recommended to use a \`<label>\` for every input to ensure screen reader compatibility.

## 5. Override Mechanisms

You can override or extend the base styles by passing a \`className\` prop.

\`\`\`jsx
<Input className="border-green-500 !bg-green-50 text-lg" />
\`\`\`
**Note**: Use Tailwind's important modifier \`!\` if you need to override highly specific base styles.

## 6. Migration Guide

Follow these steps to migrate existing inputs to the new system.

1.  **Audit**: Identify all existing \`<input>\`, \`<textarea>\`, and \`<select>\` elements. Note any custom classes or data attributes.
2.  **Replace**: Replace the native HTML element with the corresponding React component from \`GlobalInputStyling\`.
    -   **Before**: \`<input className="flex h-10 w-full rounded-md border border-input ...">\`
    -   **After**: \`<Input type="text" className="h-10" />\` (The system handles the rest).
3.  **Preserve Attributes**: Pass any custom data attributes or other necessary props directly to the new component. They will be forwarded to the underlying HTML element.
    -   **Before**: \`<input data-filename="my-file.js" ...>\`
    -   **After**: \`<Input data-filename="my-file.js" />\`
4.  **Handle Conflicts**: For elements that require unique styling, use the \`className\` prop for overrides. If an element should not receive global styles at all, do not replace it with the component.

## 7. Conflict Resolution

- **Identified Conflicts**: The existing Tailwind utility classes like \`border-input\`, \`bg-background\`, and \`focus-visible:ring-ring\` are superseded by the new global system.
- **Resolution Strategy**: The new system uses \`@layer base\`, which has lower specificity than utility classes. This means a \`className\` prop on the new components will reliably override the base styles. This provides a clean fallback. For components needing radically different styling, continue using native elements without the global styles.

## 8. Breaking Changes

- **Style Overrides**: Any custom styling applied directly to native \`<input>\` elements will be overridden by the new base styles. These must be migrated to the \`className\` prop on the new components.
- **Focus Styles**: The default browser or old Tailwind focus ring will be replaced by the new, consistent blue ring.
- **Opacity**: The disabled state now uses \`opacity: 0.5\`, which may differ from previous implementations.

## 9. Testing Instructions

To test the full range of components, states, and variants, import and render the \`InputTestPage\` component on a test route in your application.

\`\`\`jsx
// In a test page file, e.g., pages/Test.js
import { InputTestPage } from '@/components/common/GlobalInputStyling';

export default function Test() {
  return <InputTestPage />;
}
\`\`\`
`;

export default function InputSystemDocumentation() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace' }}>
        {documentationContent}
      </pre>
    </div>
  );
}
