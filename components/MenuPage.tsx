import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  GraduationCap, 
  Utensils, 
  ChefHat, 
  Users, 
  MapPin, 
  BookOpen, 
  UserPlus,
  ArrowLeft,
  FileText,
  MessageCircle
} from 'lucide-react';
import { Button } from "./ui/button";

interface MenuPageProps {
  onNavigate: (page: string) => void;
}

export function MenuPage({ onNavigate }: MenuPageProps) {
  const [navigating, setNavigating] = useState<string | null>(null);
  const menuItems = [
    
    {
      id: 'leave-dashboard',
      title: 'Leave Form',
      description: 'Apply and track leave requests',
      icon: FileText,
      color: 'bg-teal-100 dark:bg-teal-950/20',
      iconColor: 'text-teal-600 dark:text-teal-400'
    },
    {
      id: 'mess',
      title: 'Mess',
      description: 'Check meal schedules & menus',
      icon: ChefHat,
      color: 'bg-green-100 dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    
    
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onNavigate('dashboard')}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Menu</h1>
          <p className="text-muted-foreground">Explore all ORBIIIT features</p>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-4">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = navigating === item.id;

          const handleClick = () => {
            // play a quick animation then navigate for a smoother feel
            setNavigating(item.id);
            setTimeout(() => {
              onNavigate(item.id);
            }, 180);
          };

          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              animate={isActive ? { scale: 0.98, opacity: 0.95 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`cursor-pointer transition-all duration-200 ${navigating && !isActive ? 'pointer-events-none opacity-60' : ''}`}
              onClick={handleClick}
            >
              <Card>
                <CardContent className="p-4 text-center space-y-3">
                  <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center mx-auto`}>
                    <IconComponent className={`h-6 w-6 ${item.iconColor}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center space-x-2">
                      <h3 className="font-medium text-sm">{item.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      
    </div>
  );
}