import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from 'lucide-react';

export default function HeaderLanguageSelector() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-600 hover:text-brand-blue">
                    English, USD
                    <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <div className="p-2 space-y-2">
                     <div>
                        <label className="text-sm font-medium text-gray-700">Language</label>
                        <Select defaultValue="en">
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Currency</label>
                        <Select defaultValue="usd">
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="usd">USD</SelectItem>
                                <SelectItem value="eur">EUR</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}