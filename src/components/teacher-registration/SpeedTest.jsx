import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wifi, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const SpeedTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const handleRunTest = () => {
    setTesting(true);
    setResult(null);
    // Simulate a speed test
    setTimeout(() => {
      const downloadSpeed = (Math.random() * (100 - 20) + 20).toFixed(2);
      const uploadSpeed = (Math.random() * (50 - 10) + 10).toFixed(2);
      setResult({ download: downloadSpeed, upload: uploadSpeed });
      setTesting(false);
    }, 3000);
  };

  return (
    <Card className="bg-white">
        <CardContent className="p-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">Internet Speed Test</h3>
            <p className="text-sm text-gray-600 mb-4">A stable internet connection is required for online teaching. Please run a speed test.</p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button onClick={handleRunTest} disabled={testing}>
                    {testing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Running Test...
                        </>
                    ) : (
                        <>
                            <Wifi className="mr-2 h-4 w-4" />
                            Run Speed Test
                        </>
                    )}
                </Button>
                {result && !testing && (
                    <div className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>
                            Download: <strong>{result.download} Mbps</strong> / Upload: <strong>{result.upload} Mbps</strong>
                        </span>
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500 mt-2">We recommend at least 10 Mbps for both download and upload speeds for a smooth experience.</p>
        </CardContent>
    </Card>
  );
};

export default SpeedTest;