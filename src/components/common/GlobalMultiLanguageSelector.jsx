
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Search, CircleAlert, X, Send } from 'lucide-react';

// --- SUB-COMPONENTS ---

const ProficiencySelector = ({ option, onProficiencyChange, error }) => {
  const proficiencyLevels = ["Beginner", "Intermediate", "Advanced", "Native"];
  return (
    <div className="pl-9 pr-2 pb-2 space-y-1">
      <Select onValueChange={(value) => onProficiencyChange(option.id, value)} defaultValue={option.proficiency}>
        <SelectTrigger className={`w-full h-9 ${error ? 'border-red-500' : ''}`}>
          <SelectValue placeholder="Select Level" />
        </SelectTrigger>
        <SelectContent>
          {proficiencyLevels.map(level => (
            <SelectItem key={level} value={level}>{level}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <div className="flex items-center text-red-500 text-xs">
          <CircleAlert className="w-3 h-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

const LanguageOptionItem = ({ option, isSelected, onCheckedChange, onProficiencyChange, proficiency, error }) => {
  const [flag, ...labelParts] = option.label.split(' ');
  const languageLabel = labelParts.join(' ');
  
  return (
    <div>
      <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onCheckedChange(option, checked)}
          aria-label={languageLabel}
        />
        <div className="flex items-center space-x-2 flex-1">
          <span className="text-lg" aria-hidden="true">{flag}</span>
          <span className="text-sm font-medium">{languageLabel}</span>
        </div>
      </label>
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ProficiencySelector
              option={{...option, proficiency}}
              onProficiencyChange={onProficiencyChange}
              error={error}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdditionalItemsPopover = ({ items, onRemove }) => (
    <Popover>
        <PopoverTrigger asChild>
            <button className="inline-flex items-center justify-center gap-2 rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-auto min-h-0 text-xs px-2 py-1 border-dashed whitespace-nowrap w-[70px]" type="button">
                +{items.length} More
            </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2">
            <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-800">Additional Items</h4>
                <div className="space-y-1">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm p-1.5 rounded-md bg-gray-50">
                            <span>{`${item.label.split(' ').slice(1).join(' ')} (${item.proficiency || '...'})`}</span>
                            <button onClick={() => onRemove(item.id)} className="text-gray-500 hover:text-red-500">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </PopoverContent>
    </Popover>
);


// --- MAIN COMPONENT ---

export default function MultiLanguageProficiencySelector({
  options = [],
  placeholder = "Select an option",
  onSelect = () => {},
  customFormTitle = "Didn't find your option?",
  customFormFields = [],
  onCustomSubmit = () => {},
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [customFormData, setCustomFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  const proficiencyError = "Level is required";

  const validateAndPropagate = (newSelected) => {
    const errors = {};
    let allValid = true;
    newSelected.forEach(option => {
      if (!option.proficiency) {
        errors[option.id] = proficiencyError;
        allValid = false;
      }
    });
    setValidationErrors(errors);
    onSelect(newSelected, allValid);
  };
  
  useEffect(() => {
    validateAndPropagate(selectedOptions);
  }, [selectedOptions]);

  const handleCheckedChange = (option, checked) => {
    let newSelected;
    if (checked) {
      newSelected = [...selectedOptions, { ...option, proficiency: undefined }];
    } else {
      newSelected = selectedOptions.filter(o => o.id !== option.id);
    }
    setSelectedOptions(newSelected);
  };

  const handleProficiencyChange = (optionId, proficiency) => {
    const newSelected = selectedOptions.map(o =>
      o.id === optionId ? { ...o, proficiency } : o
    );
    setSelectedOptions(newSelected);
  };
  
  const handleRemoveOption = (optionId) => {
    const newSelected = selectedOptions.filter(o => o.id !== optionId);
    setSelectedOptions(newSelected);
  };
  
  const handleCustomFormChange = (e) => {
    setCustomFormData({ ...customFormData, [e.target.name]: e.target.value });
  };
  
  const handleCustomFormSubmit = (e) => {
    e.preventDefault();
    onCustomSubmit(customFormData);
    setCustomFormData({});
  };

  const filteredOptions = useMemo(() =>
    options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    ), [options, searchTerm]);
    
  const visibleSelected = selectedOptions.slice(0, 4);
  const hiddenSelected = selectedOptions.slice(4);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Inject specific CSS styles */}
      <style>{`
        .viewbox .dd-button { background: #f8f8f8 !important; border: solid 1px #dfdcdc !important; color: #878287 !important; padding: 7px 30px 7px 20px !important; cursor: pointer !important; white-space: nowrap !important; }
        .writ { background-color: #f8f8f8 !important; border: solid 1px #dfdfdf !important; color: #2d2d2d !important; border-radius: 3px !important; }
      `}</style>
      
      {/* Dropdown Selector */}
      <div className="viewbox">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="dd-button w-full justify-between h-auto">
                <span className="flex items-center gap-2"><Globe className="h-4 w-4" />{placeholder}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
              <div className="p-4 border-b">
                <h4 className="font-semibold text-gray-900 mb-3">Select Language</h4>
                <div className="relative">
                  <Input placeholder="Search languages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-8" />
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {filteredOptions.map(option => {
                  const selected = selectedOptions.find(o => o.id === option.id);
                  return <LanguageOptionItem key={option.id} option={option} isSelected={!!selected} onCheckedChange={handleCheckedChange} onProficiencyChange={handleProficiencyChange} proficiency={selected?.proficiency} error={selected ? validationErrors[option.id] : undefined} />;
                })}
              </div>
            </PopoverContent>
          </Popover>
      </div>

      {/* Custom Submission Form */}
      <Accordion type="single" collapsible>
        <AccordionItem value="custom" className="border-b-0">
          <AccordionTrigger className="text-sm text-blue-600 hover:no-underline py-1"><span className="blueTxt">{customFormTitle}</span></AccordionTrigger>
          <AccordionContent>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              <form onSubmit={handleCustomFormSubmit} className="p-4 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {customFormFields.map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-1">{field.label}</label>
                      <Input type={field.type} name={field.name} value={customFormData[field.name] || ''} onChange={handleCustomFormChange} required={field.required} placeholder={`e.g., ${field.label.includes('Language') ? 'Mandarin' : 'Native'}`} className="writ" />
                    </div>
                  ))}
                </div>
                <Button type="submit" className="gap-2"><Send className="h-4 w-4" />Submit Custom Language</Button>
              </form>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Selected Languages Display */}
      {selectedOptions.length > 0 && (
        <div className="space-y-3 pt-4">
          <h4 className="font-medium text-gray-700">Selected Languages</h4>
          <div className="flex items-center gap-2 flex-wrap">
            {visibleSelected.map((lang) => (
              <Badge key={lang.id} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">
                {`${lang.label.split(' ').slice(1).join(' ')} (${lang.proficiency || '...'})`}
                <button onClick={() => handleRemoveOption(lang.id)} aria-label={`Remove ${lang.label}`} className="rounded-full hover:bg-gray-300 p-0.5"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
            {hiddenSelected.length > 0 && (
                <AdditionalItemsPopover items={hiddenSelected} onRemove={handleRemoveOption} />
            )}
          </div>
          {Object.keys(validationErrors).length > 0 && (
            <div className="flex items-center text-red-500 text-sm mt-2">
              <CircleAlert className="w-4 h-4 mr-2" />
              Please select proficiency levels for all languages.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
