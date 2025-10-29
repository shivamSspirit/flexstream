'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageCarouselProps {
  images: string[];
  videos?: string[];
}

export function ImageCarousel({ images, videos = [] }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine images and videos into a single media array
  const mediaItems = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...videos.map(url => ({ type: 'video' as const, url })),
  ];

  const totalItems = mediaItems.length;

  if (totalItems === 0) return null;
  if (totalItems === 1) {
    // Single media item - no carousel needed
    const item = mediaItems[0];
    return (
      <div className="relative overflow-hidden rounded-xl">
        {item.type === 'image' ? (
          <img
            src={item.url}
            alt="Post media"
            className="w-full object-cover max-h-[500px] bg-card-bg rounded-xl"
            loading="lazy"
          />
        ) : (
          <video
            src={item.url}
            controls
            className="w-full object-cover max-h-[500px] bg-black rounded-xl"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? totalItems - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === totalItems - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentItem = mediaItems[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-xl group">
      {/* Main Media Display */}
      <div className="relative">
        {currentItem.type === 'image' ? (
          <img
            src={currentItem.url}
            alt={`Post media ${currentIndex + 1}`}
            className="w-full object-cover max-h-[500px] bg-card-bg rounded-xl transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <video
            key={currentItem.url}
            src={currentItem.url}
            controls
            className="w-full object-cover max-h-[500px] bg-black rounded-xl"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        )}

        {/* Navigation Arrows */}
        {totalItems > 1 && (
          <>
            <Button
              onClick={goToPrevious}
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              onClick={goToNext}
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Counter Badge */}
        {totalItems > 1 && (
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
            {currentIndex + 1} / {totalItems}
          </div>
        )}
      </div>

      {/* Dots Indicator */}
      {totalItems > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full">
          {mediaItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-200 rounded-full ${
                index === currentIndex
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
