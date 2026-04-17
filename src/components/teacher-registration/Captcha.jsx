
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Label } from '@/components/ui/label';

const Captcha = () => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isValid, setIsValid] = useState(null);
  const canvasRef = useRef(null);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    setIsValid(null);
    setUserInput('');
    return text;
  };

  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.font = '30px Arial';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add some distortion
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(25 + i * 20, canvas.height / 2);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // Draw noise lines
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = '#d1d5db';
      ctx.stroke();
    }
  };

  useEffect(() => {
    drawCaptcha(generateCaptcha());
  }, []);

  const handleReload = () => {
    drawCaptcha(generateCaptcha());
  };

  const handleCheck = () => {
    if (userInput.toLowerCase() === captchaText.toLowerCase()) {
      setIsValid(true);
    } else {
      setIsValid(false);
      drawCaptcha(generateCaptcha());
    }
  };

  return (
    <div>
        <Label htmlFor="captcha-input" className="font-semibold text-lg text-gray-800 mb-2">Security Check</Label>
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
            <canvas ref={canvasRef} width="150" height="50" className="rounded-md bg-gray-200"></canvas>
            <Button variant="ghost" size="icon" onClick={handleReload}>
                <RefreshCw className="h-5 w-5" />
            </Button>
            <div className="flex-grow">
                 <Input
            id="captcha-input"
            placeholder="Enter the code"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)} className="flex h-10 w-full rounded-md border border-input px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-white" />


            </div>
             <Button onClick={handleCheck} disabled={userInput.length !== 6}>Check</Button>
        </div>
        {isValid === false && <p className="text-sm text-red-500 mt-1">Incorrect code. Please try the new one.</p>}
        {isValid === true && <p className="text-sm text-green-500 mt-1">Verification successful!</p>}
    </div>);

};

export default Captcha;