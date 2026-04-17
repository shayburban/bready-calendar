import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign,
  Languages,
  BookOpen,
  Video,
  Heart
} from "lucide-react";

export default function TeacherCard({ teacher }) {
  const getInitials = (name) => {
    if (!name) return "";
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border-2 border-slate-100">
      <CardContent className="p-0">
        {/* Profile Header */}
        <div className="relative p-4 bg-slate-50">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-white shadow-md">
              <AvatarImage src={teacher.profile_image} alt={teacher.full_name} />
              <AvatarFallback className="bg-emerald-500 text-white font-semibold">
                {getInitials(teacher.full_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                {teacher.full_name}
              </h3>
              
              <div className="flex items-center gap-2 mb-2">
                {teacher.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-sm">
                      {teacher.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({teacher.total_reviews || 0})
                    </span>
                  </div>
                )}
                
                {teacher.video_intro_url && (
                  <Badge variant="secondary" className="text-xs">
                    <Video className="w-3 h-3 mr-1" />
                    Video Intro
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Subjects */}
          <div>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects?.slice(0, 3).map((subject, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  {subject}
                </Badge>
              ))}
              {teacher.subjects?.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{teacher.subjects.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm text-slate-600 line-clamp-2 h-10">
            {teacher.bio || "Experienced tutor ready to help you achieve your learning goals."}
          </p>

          {/* Pricing & Action */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg text-slate-900">
                  ${teacher.hourly_rate}
                </span>
                <span className="text-sm text-slate-500">/hour</span>
              </div>
            </div>

            <Link to={createPageUrl(`TeacherProfile?id=${teacher.id}`)}>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-4 text-sm h-9">
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}