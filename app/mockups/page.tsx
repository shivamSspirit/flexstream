'use client';

import { useState } from 'react';
import { PostCardMockup } from '@/components/waitlist/PostCardMockup';
import { ProfileStatsMockup } from '@/components/waitlist/ProfileStatsMockup';
import { TokenLaunchMockup } from '@/components/waitlist/TokenLaunchMockup';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/Logo';
import { Download, Camera, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MockupsPage() {
  const [selectedMockup, setSelectedMockup] = useState<'postcard' | 'profile' | 'launch'>('postcard');
  const [copied, setCopied] = useState(false);

  const mockups = [
    {
      id: 'postcard' as const,
      name: 'Post Card with Token Trading',
      description: 'Shows a successful earnings flex with token stats and trading',
      emoji: '💰',
      color: 'from-accent-green to-accent-cyan'
    },
    {
      id: 'profile' as const,
      name: 'Profile Stats Dashboard',
      description: 'Creator profile with earnings, stats, and creator token',
      emoji: '👑',
      color: 'from-accent-purple to-accent-pink'
    },
    {
      id: 'launch' as const,
      name: 'Token Launch Flow',
      description: 'Create post interface with token launch and privacy options',
      emoji: '🚀',
      color: 'from-accent-blue to-accent-cyan'
    }
  ];

  const handleCopyImage = async () => {
    toast.info('Take a screenshot using your system tools (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadInstructions = () => {
    const instructions = `
📸 How to Use These Mockups for Your Waitlist Page:

1. SCREENSHOT EACH MOCKUP:
   - Mac: Cmd + Shift + 4 (drag to select area)
   - Windows: Win + Shift + S
   - Linux: Use screenshot tool of your choice

2. RECOMMENDED SCREENSHOTS:
   ✅ Post Card - Best for hero section (like Pocket's chat bubble)
   ✅ Profile Stats - Great for showing success metrics
   ✅ Token Launch - Shows how easy it is to create & earn

3. WHERE TO USE:
   - Hero section: Use Post Card as main visual
   - Feature section: Use all 3 in a row/grid
   - Bottom CTA: Use Profile Stats to show success

4. IMAGE OPTIMIZATION:
   - Save as PNG for transparency
   - Compress with TinyPNG or similar
   - Recommended width: 800-1200px

5. DESIGN TIPS:
   - Add subtle drop shadow in CSS
   - Use hover effects for interactivity
   - Consider dark background for contrast

6. NEXT STEPS:
   - Save screenshots to /public/mockups/
   - Import in waitlist page with next/image
   - Add lazy loading for performance
    `;

    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mockup-usage-guide.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded usage guide!');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadInstructions}
              variant="outline"
              className="bg-white/5 border-white/20 hover:bg-white/10 text-white text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Usage Guide
            </Button>
            <Button
              onClick={handleCopyImage}
              className="bg-gradient-to-r from-accent-green to-accent-cyan text-black font-bold text-sm"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Instructions Shown
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Screenshot Guide
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              <span className="bg-gradient-to-r from-accent-green via-accent-cyan to-accent-blue bg-clip-text text-transparent">
                Waitlist Mockups
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              High-fidelity mockups for your waitlist landing page.
              Screenshot any of these to use in your marketing materials.
            </p>
          </div>

          {/* Mockup Selector */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {mockups.map((mockup) => (
              <button
                key={mockup.id}
                onClick={() => setSelectedMockup(mockup.id)}
                className={`relative px-6 py-4 rounded-xl border-2 transition-all ${
                  selectedMockup === mockup.id
                    ? `bg-gradient-to-r ${mockup.color} bg-opacity-10 border-transparent shadow-lg`
                    : 'bg-white/5 border-white/20 hover:border-white/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{mockup.emoji}</span>
                  <div className="text-left">
                    <div className={`font-bold text-base ${
                      selectedMockup === mockup.id ? 'text-white' : 'text-white/80'
                    }`}>
                      {mockup.name}
                    </div>
                    <div className="text-xs text-white/50 max-w-xs">
                      {mockup.description}
                    </div>
                  </div>
                </div>
                {selectedMockup === mockup.id && (
                  <div className="absolute -top-2 -right-2">
                    <div className={`h-6 w-6 rounded-full bg-gradient-to-r ${mockup.color} flex items-center justify-center shadow-lg`}>
                      <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Mockup Display */}
          <div className="mb-12">
            <div className="bg-gradient-to-b from-white/5 to-transparent rounded-2xl p-8 md:p-12 border border-white/10">
              {selectedMockup === 'postcard' && <PostCardMockup />}
              {selectedMockup === 'profile' && <ProfileStatsMockup />}
              {selectedMockup === 'launch' && <TokenLaunchMockup />}
            </div>
          </div>

          {/* Instructions */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border border-accent-blue/30 rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-accent-blue to-accent-purple flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white">How to Use These Mockups</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-accent-green flex items-center justify-center shrink-0 mt-1">
                      <span className="text-black font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">Take Screenshot</h3>
                      <p className="text-white/60 text-sm">
                        Use Cmd+Shift+4 (Mac) or Win+Shift+S (Windows) to capture the mockup area
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-accent-cyan flex items-center justify-center shrink-0 mt-1">
                      <span className="text-black font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">Optimize Image</h3>
                      <p className="text-white/60 text-sm">
                        Save as PNG, compress with TinyPNG, and resize to 800-1200px width
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-accent-purple flex items-center justify-center shrink-0 mt-1">
                      <span className="text-black font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">Add to Waitlist</h3>
                      <p className="text-white/60 text-sm">
                        Save to /public/mockups/ and import in your waitlist page
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl p-6 space-y-3">
                  <h3 className="font-bold text-white mb-3">💡 Pro Tips</h3>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green shrink-0">✓</span>
                      <span>Use PostCard mockup as hero image (like Pocket&apos;s chat bubble)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green shrink-0">✓</span>
                      <span>Show all 3 mockups in a feature showcase grid</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green shrink-0">✓</span>
                      <span>Add subtle drop shadows in CSS for depth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green shrink-0">✓</span>
                      <span>Use dark backgrounds for maximum contrast</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-green shrink-0">✓</span>
                      <span>Lazy load images for better performance</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-white/50 text-sm text-center">
                  Need help implementing? Check the usage guide or visit{' '}
                  <a href="/waitlist" className="text-accent-green hover:underline">
                    /waitlist
                  </a>
                  {' '}to see them in action
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
