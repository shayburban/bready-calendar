import React, { useEffect, useRef, useState } from 'react';
import { useTeacher } from './TeacherContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Upload, CheckCircle, XCircle } from 'lucide-react';
import { UploadFile } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PhotoRule = ({ text, examples, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div>
      <p className="text-gray-700 mb-3">{text}</p>
      {examples && (
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          View Photo Examples
        </a>
      )}
      {isOpen && examples && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {examples.map((example, i) => (
            <div key={i} className="text-center">
              <img src={example.src} alt={example.alt} className="rounded-md border" />
              {example.isValid
                ? <CheckCircle className="h-6 w-6 text-green-500 mx-auto mt-2" />
                : <XCircle className="h-6 w-6 text-red-500 mx-auto mt-2" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PhotoUploadForm = () => {
  const { personalInfo, setPersonalInfo, errors, setErrors } = useTeacher();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(personalInfo.profilePicture || '');
  const tempUrlRef = useRef(null);

  useEffect(() => {
    // prevent memory leaks for object URLs
    return () => {
      if (tempUrlRef.current) URL.revokeObjectURL(tempUrlRef.current);
    };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, photo: 'File size should be less than 5MB.' }));
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((p) => ({ ...p, photo: 'Please upload a JPG, PNG, or WEBP image.' }));
      return;
    }

    setUploading(true);
    setErrors((p) => ({ ...p, photo: null }));

    try {
      // Show instant preview of the original image
      if (tempUrlRef.current) URL.revokeObjectURL(tempUrlRef.current);
      tempUrlRef.current = URL.createObjectURL(file);
      setPreview(tempUrlRef.current);

      // Upload original file
      const { file_url } = await UploadFile({ file });
      
      // Update state with final URL
      setPersonalInfo((p) => ({ ...p, profilePicture: file_url }));
      setPreview(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
      setErrors((p) => ({ ...p, photo: 'Image upload failed. Please try again.' }));
    } finally {
      setUploading(false);
    }
  };

  const photoExamples = [
    { src: 'https://placehold.co/150x150/e2e8f0/334155?text=Good', alt: 'Good photo example', isValid: true },
    { src: 'https://placehold.co/150x150/e2e8f0/334155?text=Bad+Angle', alt: 'Bad photo example', isValid: false },
    { src: 'https://placehold.co/150x150/e2e8f0/334155?text=Blurry', alt: 'Blurry photo example', isValid: false },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Left Column: Uploader */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Profile Photo</CardTitle>
          <p className="text-gray-600">
            Make a great first impression. A professional headshot helps you build trust with students.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            <Avatar className="w-40 h-40 border-4 border-gray-200 shadow-sm overflow-hidden bg-white">
              <AvatarImage src={preview} alt="Profile Preview" className="object-cover w-full h-full" />
              <AvatarFallback className="bg-gray-100">
                <User className="w-20 h-20 text-gray-400" />
              </AvatarFallback>
            </Avatar>

            <div className="w-full text-center">
              <Button asChild variant="outline" className="w-full max-w-xs mx-auto">
                <label htmlFor="photo-upload" className="cursor-pointer flex items-center justify-center gap-2">
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                  {!uploading && <Upload className="w-4 h-4" />}
                </label>
              </Button>
              <Input
                id="photo-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                disabled={uploading}
              />
              <p className="text-sm text-gray-500 mt-3">
                JPG/PNG/WEBP · Max 5 MB
              </p>
              {errors.photo && <p className="text-sm text-red-500 mt-2">{errors.photo}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Rules */}
      <div className="space-y-6 mt-4 lg:mt-0">
        <h3 className="text-xl font-bold text-gray-800">Rules For A Great Photo</h3>
        <div className="space-y-4">
          <PhotoRule
            text="Use a clear, professional headshot with good lighting and minimal background distractions."
            examples={photoExamples}
          />
          <hr />
          <PhotoRule
            text="Ensure your face is well lit and unobstructed (no sunglasses) for best results."
            examples={photoExamples}
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadForm;