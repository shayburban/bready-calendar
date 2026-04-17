
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Search, CircleAlert, X, Send } from 'lucide-react';

const ProficiencySelector = ({ option, onChange, error, levels, isOutlineError, dependentFieldKey }) =>
  <div className={`pl-9 pr-2 pb-2 space-y-1 ${error ? 'border-red-500' : ''}`}>
    <Select onValueChange={(value) => onChange(option.id, value)} value={option[dependentFieldKey]}>
      <SelectTrigger className={`bg-gray-50 px-3 py-2 text-sm flex items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-full h-9 ${isOutlineError ? 'border-red-500 focus:ring-red-500' : ''}`}>
        <SelectValue placeholder={`Select ${dependentFieldKey}`} />
      </SelectTrigger>
      <SelectContent>
        {levels.map((level) =>
          <SelectItem key={level} value={level}>{level}</SelectItem>
        )}
      </SelectContent>
    </Select>
    {error &&
      <div className="flex items-center text-red-500 text-xs">
        <CircleAlert className="w-3 h-3 mr-1" />
        {error}
      </div>
    }
  </div>;


const OptionItem = ({ option, isSelected, onChecked, onProficiencyChange, error, proficiencyLevels, showItemIcon, isOutlineError, dependentFieldKey }) => {
  const { flag, label } = useMemo(() => {
    if (showItemIcon && option.label.includes(' ')) {
      const parts = option.label.split(' ');
      return { flag: parts[0], label: parts.slice(1).join(' ') };
    }
    return { flag: null, label: option.label };
  }, [option.label, showItemIcon]);

  return (
    <div>
      <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
        <Checkbox checked={isSelected} onCheckedChange={(checked) => onChecked(option, checked)} aria-label={label} />
        <div className="flex items-center space-x-2 flex-1">
          {flag && <span className="text-lg" aria-hidden="true">{flag}</span>}
          <span className="text-sm font-medium">{label}</span>
        </div>
      </label>
      <AnimatePresence>
        {isSelected &&
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}>

            <ProficiencySelector
              option={option}
              onChange={onProficiencyChange}
              error={error}
              levels={proficiencyLevels}
              isOutlineError={isOutlineError}
              dependentFieldKey={dependentFieldKey}
            />
          </motion.div>
        }
      </AnimatePresence>
    </div>);

};

const AdditionalItemsPopover = ({ items, onRemove, validationErrors, dependentFieldKey, outlineMap, getDisplayName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);
  const popoverRef = useRef(null);

  const handleToggle = useCallback((open) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(open);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 300);
  }, []);

  const handleClick = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="inline-flex items-center gap-2 rounded-md font-medium border border-dashed bg-background hover:bg-accent hover:text-accent-foreground text-xs px-2 py-1 w-[70px] whitespace-nowrap">

          +{items.length} More
        </button>
      </PopoverTrigger>
      <PopoverContent
        ref={popoverRef}
        className="w-60 p-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}>

        <h4 className="font-medium text-sm text-gray-800 mb-2">Additional Selections</h4>
        <div className="space-y-1">
          {items.map((item) =>
            <div
              key={item.id}
              className={`flex items-center justify-between text-sm p-1.5 rounded-md ${outlineMap[item.id] ? 'bg-red-50 border border-red-500' : 'bg-gray-50'}`}>

              <div className="flex items-center gap-2">
                <span className={outlineMap[item.id] ? 'text-red-700' : ''}>
                  {`${getDisplayName(item)} (${item[dependentFieldKey] || '...'})`}
                </span>
                {item.pending && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending</span>}
                {outlineMap[item.id] && <CircleAlert className="w-3 h-3 text-red-500" />}
              </div>
              <button onClick={() => onRemove(item.id)} className="text-gray-500 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>);

};

export default function GlobalCustomDropdownSelector({
  options: initialOptions = [], // Renamed prop to avoid confusion with internal state
  placeholder = "Select an option",
  onSelect = () => { },
  customFormTitle = "Didn't find your option?",
  customFormFields = [],
  onCustomSubmit = () => { },
  className = "",
  // New props for customization
  popoverTitle = "Select Language",
  searchPlaceholder = "Search languages...",
  selectedItemsTitle = "Selected Languages",
  proficiencyLevels = ["Native", "Fluent", "Advanced", "Intermediate", "Beginner"],
  showItemIcon = true,
  triggerIcon = <Globe className="h-4 w-4" />,
  dependentFieldKey = 'proficiency', // NEW PROP for dependent field
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState(() => initialOptions.map(opt => ({ ...opt, active: false }))); // Internal state for items, with 'active' status
  const [customFormData, setCustomFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({}); // Textual errors for specific fields
  const [outlineMap, setOutlineMap] = useState({}); // Visual red outline errors for missing dependent fields
  const [customFormError, setCustomFormError] = useState('');
  const [maxVisibleItems, setMaxVisibleItems] = useState(4);
  const containerRef = useRef(null);

  // Fix: Memoize safeCustomFormFields to stabilize useCallback dependency
  const safeCustomFormFields = useMemo(() => customFormFields || [], [customFormFields]);
  const hasCustomForm = safeCustomFormFields.length > 0;

  // ✅ ADD: universal display resolver for chips/pills (keeps existing logic untouched)
  const getDisplayName = useCallback((item) => {
    if (!item) return '';

    // Prefer explicit name when present
    if (typeof item.name === 'string' && item.name.trim()) {
      return item.name.trim();
    }

    // Fall back to label/title/value/text/slug if available
    const raw =
      item.label ??
      item.title ??
      item.value ??
      item.text ??
      item.slug ??
      '';

    if (!raw) return '';

    // If we show an icon/flag in labels, strip the first token visually
    // Example: "🌐 English" or "🇺🇸 English" -> "English"
    if (showItemIcon && raw.includes(' ')) {
      const parts = raw.trim().split(' ');
      // if the first token is an icon/flag/symbol, drop it
      const first = parts[0] ?? '';
      const looksLikeIcon = first.length <= 3 || /[\u{1F1E6}-\u{1F1FF}\p{Extended_Pictographic}]/u.test(first);
      return (looksLikeIcon ? parts.slice(1).join(' ') : raw).trim();
    }

    return String(raw).trim();
  }, [showItemIcon]);

  // Sync options prop with internal state, preserving active state
  useEffect(() => {
    setOptions(prevOptions => {
      const prevActiveMap = new Map(prevOptions.map(opt => [opt.id, opt.active]));
      return initialOptions.map(opt => ({
        ...opt,
        active: prevActiveMap.has(opt.id) ? prevActiveMap.get(opt.id) : false
      }));
    });
  }, [initialOptions]);

  const handleDropdownState = useCallback((open, type = 'main') => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const header = document.querySelector('header');

    if (open) {
      setIsOpen(true);
      document.body.setAttribute('data-state', `open-${type}`);
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      if (header) header.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      setIsOpen(false);
      document.body.removeAttribute('data-state');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      if (header) header.style.paddingRight = '';
    }
  }, []);

  const activeSelectedOptions = useMemo(() => options.filter(opt => opt.active), [options]);

  useEffect(() => {
    const handleResize = () => {
      const activeSelectedOptionsLength = activeSelectedOptions.length;
      if (!containerRef.current) {
        setMaxVisibleItems(activeSelectedOptionsLength || 0);
        return;
      }

      const containerWidth = containerRef.current.offsetWidth;
      const averageItemWidth = window.innerWidth < 768 ? 160 : 190;
      const moreButtonWidth = 80; // Approximate width for "+X More" button

      const maxInContainer = Math.floor(containerWidth / averageItemWidth);
      const maxWithMoreButton = Math.floor((containerWidth - moreButtonWidth) / averageItemWidth);

      if (activeSelectedOptionsLength > maxInContainer && maxInContainer > 0) {
        setMaxVisibleItems(Math.max(1, maxWithMoreButton));
      } else {
        setMaxVisibleItems(activeSelectedOptionsLength);
      }
    };

    const debouncedResize = () => {
      setTimeout(handleResize, 150);
    };

    handleResize();
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [activeSelectedOptions.length]); // Depend on the count of active items

  const validateAndPropagate = useCallback((currentOptions) => {
    const newValidationErrors = {};
    const newOutlineMap = {};

    currentOptions.forEach((opt) => {
      if (opt.active && (!opt[dependentFieldKey] || opt[dependentFieldKey] === '')) {
        newValidationErrors[opt.id] = `${dependentFieldKey.charAt(0).toUpperCase() + dependentFieldKey.slice(1)} is required`;
        newOutlineMap[opt.id] = true;
      }
    });

    setValidationErrors(newValidationErrors);
    setOutlineMap(newOutlineMap); // Set all outlines based on current state

    const allSelectedValid = Object.keys(newValidationErrors).length === 0;
    const selectedActiveOptions = currentOptions.filter(opt => opt.active);
    onSelect(selectedActiveOptions, allSelectedValid); // Propagate active items
  }, [onSelect, dependentFieldKey]);

  useEffect(() => {
    validateAndPropagate(options);
  }, [options, validateAndPropagate]);

  const handleCheckedChange = useCallback((option, checked) => {
    setOptions(prevOptions => {
      const updatedOptions = prevOptions.map(o => {
        if (o.id === option.id) {
          const newOpt = { ...o, active: checked };
          // If checked and dependent field is missing, set outline
          if (checked && (!newOpt[dependentFieldKey] || newOpt[dependentFieldKey] === '')) {
            setOutlineMap(prev => ({ ...prev, [o.id]: true }));
          } else {
            // If unchecked or dependent field is present, clear outline
            setOutlineMap(prev => {
              const newState = { ...prev };
              delete newState[o.id];
              return newState;
            });
          }
          return newOpt;
        }
        return o;
      });
      return updatedOptions;
    });
  }, [dependentFieldKey]);

  const handleProficiencyChange = useCallback((id, value) => {
    setOptions(prevOptions => prevOptions.map(o => {
      if (o.id === id) {
        // Clear outline when dependent field is selected
        setOutlineMap(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        return { ...o, [dependentFieldKey]: value };
      }
      return o;
    }));
  }, [dependentFieldKey]); // Dependency added

  const handleRemoveOption = useCallback((id) => {
    // When removing, just set active to false
    setOptions(prevOptions => prevOptions.map(o => {
      if (o.id === id) {
        // Clear any outline associated with this item when it's deactivated
        setOutlineMap(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        return { ...o, active: false };
      }
      return o;
    }));
  }, []);

  const handleCustomSubmit = useCallback((e) => {
    e.preventDefault();

    // Only process if we have custom form fields
    if (!hasCustomForm) return;

    const nameField = safeCustomFormFields.find((f) => f.label.includes('Name'));
    const levelField = safeCustomFormFields.find((f) => f.label.includes('Level') || f.label.includes('Proficiency'));
    const name = customFormData[nameField?.name || ''] || '';
    const level = customFormData[levelField?.name || ''] || '';

    if (name && level) {
      setOptions((prevOptions) => {
        const newCustomItem = {
          id: `custom-${Date.now()}`,
          name: name, // Store the name directly
          label: showItemIcon ? `🌐 ${name}` : name, // Label might still include icon for display in list
          [dependentFieldKey]: level, // Use dependentFieldKey here
          pending: true,
          active: true // Custom items are active by default
        };
        // No outline needed initially for custom items if level is provided
        setOutlineMap(prev => {
          const newState = { ...prev };
          delete newState[newCustomItem.id]; // Ensure no outline initially
          return newState;
        });
        return [...prevOptions, newCustomItem];
      });

      setCustomFormData({});
      setCustomFormError('');
      onCustomSubmit({ [nameField?.name || 'name']: name, [levelField?.name || 'level']: level });
    } else {
      setCustomFormError('Please fill out all required fields.');
    }
  }, [safeCustomFormFields, hasCustomForm, customFormData, showItemIcon, onCustomSubmit, dependentFieldKey]);

  const filteredOptions = useMemo(() =>
    options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

  const visibleSelected = activeSelectedOptions.slice(0, maxVisibleItems);
  const hiddenSelected = activeSelectedOptions.slice(maxVisibleItems);

  const hasOutlineErrors = Object.keys(outlineMap).length > 0; // Check if there are any active outlines

  return (
    <div className={`space-y-1 w-full ${className}`}>
      <style>{`
        body[data-state*='open-'] { 
          overflow: hidden !important; 
        }
        body[data-state='open'] {
          overflow: hidden !important;
          padding-right: 15px !important;
        }
        body[data-state='open'] header {
           padding-right: 15px !important;
        }
        .custom-form-input { 
          background: #f8f8f8 !important; 
          border: 1px solid #dfdfdf !important; 
          color: #2d2d2d !important; 
          border-radius: 3px !important; 
        }
        .custom-form-input:focus-visible { 
          border-color: #3b82f6 !important; 
          box-shadow: 0 0 0 2px #bfdbfe !important; 
          outline: none;
        }
        .custom-form-input.error-border { 
          border-color: #ef4444 !important; 
        }
        [data-radix-select-content] { 
          position: fixed !important; 
          z-index: 9999 !important; 
          animation: slideDown 0.2s ease-out !important; 
        }
        @keyframes slideDown { 
          from { opacity: 0; transform: translateY(-10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .selected-languages-container { 
          display: flex; 
          flex-wrap: nowrap; 
          overflow: hidden; 
          gap: 0.5rem; 
          min-height: 32px; 
        }
      `}</style>

      <Popover open={isOpen} onOpenChange={(open) => handleDropdownState(open, 'main')}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="bg-gray-50 px-4 py-2 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground w-full justify-between h-auto dd-button">
            <span className="flex items-center gap-2">
              {triggerIcon}
              {placeholder}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0 w-[320px] h-[367px] flex flex-col">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-gray-900 mb-3">{popoverTitle}</h4>
            <div className="relative">
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-50 pr-8 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />


              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-2">
            {filteredOptions.length ? filteredOptions.map((option) =>
              <OptionItem
                key={option.id}
                option={option}
                isSelected={option.active} // Use internal active state
                onChecked={handleCheckedChange}
                onProficiencyChange={handleProficiencyChange}
                error={validationErrors[option.id]}
                proficiencyLevels={proficiencyLevels}
                showItemIcon={showItemIcon}
                isOutlineError={outlineMap[option.id]} // Pass outline status
                dependentFieldKey={dependentFieldKey}
              />

            ) :
              <p className="text-center text-sm text-gray-500 py-4">No options found.</p>
            }
          </div>
        </PopoverContent>
      </Popover>

      {/* Custom Form - Only render if we have custom form fields */}
      {hasCustomForm &&
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="custom-form" className="rounded-lg border-0">
            <AccordionTrigger className="px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-700">
              {customFormTitle}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleCustomSubmit}
                className="p-4 border rounded-md bg-white space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safeCustomFormFields.map((field) =>
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      {field.type === 'select' ?
                        <Select
                          onValueChange={(value) => setCustomFormData((prev) => ({ ...prev, [field.name]: value }))}
                          value={customFormData[field.name] || ''}>

                          <SelectTrigger className={`custom-form-input ${customFormError && !customFormData[field.name] ? 'error-border' : ''}`}>
                            <SelectValue placeholder={`Select ${field.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {proficiencyLevels.map((level) =>
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            )}
                          </SelectContent>
                        </Select> :
                        field.type === 'textarea' ?
                          <textarea
                            className="custom-form-input w-full min-h-[80px] p-2 text-sm resize-y"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            value={customFormData[field.name] || ''}
                            onChange={(e) => setCustomFormData((prev) => ({ ...prev, [field.name]: e.target.value }))} /> :


                          <Input
                            type={field.type}
                            className={`custom-form-input ${customFormError && !customFormData[field.name] ? 'error-border' : ''}`}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            value={customFormData[field.name] || ''}
                            onChange={(e) => setCustomFormData((prev) => ({ ...prev, [field.name]: e.target.value }))} />

                      }
                    </div>
                  )}
                </div>

                {customFormError &&
                  <div className="flex items-center text-red-500 text-sm">
                    <CircleAlert className="w-4 h-4 mr-2" />
                    {customFormError}
                  </div>
                }

                <Button
                  type="submit"
                  className="flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: customFormData[customFormFields.find((f) => f.label.includes('Name'))?.name] && customFormData[customFormFields.find((f) => f.label.includes('Level'))?.name] ? '#22b41e' : '#959595',
                    color: 'white'
                  }}>

                  <Send className="w-4 h-4" />
                  Submit Custom Item
                </Button>
              </motion.form>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      }

      {activeSelectedOptions.length > 0 &&
        <div className="space-y-3 pt-4">
          <h4 className="font-medium text-gray-700">{selectedItemsTitle}</h4>
          <div ref={containerRef} className="selected-languages-container">
            {visibleSelected.map((lang) =>
              <Badge
                key={lang.id}
                variant={lang.pending ? "outline" : "secondary"}
                className={`flex items-center gap-1.5 py-1 px-2.5 flex-shrink-0 ${outlineMap[lang.id] ? 'border-red-500 bg-red-50' : ''}`}>

                <span className={`truncate ${outlineMap[lang.id] ? 'text-red-700' : ''}`}>
                  {`${getDisplayName(lang)} (${lang[dependentFieldKey] || '...'})`}
                </span>
                {lang.pending && <span className="text-xs text-yellow-600 whitespace-nowrap">(Pending)</span>}
                <button onClick={() => handleRemoveOption(lang.id)} className="rounded-full hover:bg-gray-300 p-0.5 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {hiddenSelected.length > 0 &&
              <AdditionalItemsPopover
                items={hiddenSelected}
                onRemove={handleRemoveOption}
                validationErrors={validationErrors}
                dependentFieldKey={dependentFieldKey}
                outlineMap={outlineMap}
                getDisplayName={getDisplayName}
              />

            }
          </div>
          {hasOutlineErrors &&
            <div className="flex items-center text-red-500 text-sm mt-2">
              <CircleAlert className="w-4 h-4 mr-2" />
              Please select {dependentFieldKey} for all active items.
            </div>
          }
        </div>
      }
    </div>);

}
