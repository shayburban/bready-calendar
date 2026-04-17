import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, X } from 'lucide-react';

export default function CustomAlertModal({ isOpen, onClose, title, message }) {
  if (!isOpen) {
    return null;
  }

  // Split message by double newlines and add numbers if multiple messages
  const messages = message ? message.split('\n\n').filter(msg => msg.trim()) : [];
  const hasMultipleMessages = messages.length > 1;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close modal when clicking on backdrop (outside the card)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              {title || 'Attention Required'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 p-4 rounded-md">
              {messages.map((msg, index) => (
                <p key={index} className="text-red-800 font-medium mb-3 last:mb-0">
                  {hasMultipleMessages ? `${index + 1}. ${msg}` : msg}
                </p>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={onClose}>
                OK
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}