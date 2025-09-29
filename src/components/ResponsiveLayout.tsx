import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, List, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface Widget {
  id: string;
  component: React.ReactNode;
  title: string;
  minWidth?: number;
  minHeight?: number;
  priority?: number;
}

interface ResponsiveLayoutProps {
  widgets: Widget[];
  className?: string;
}

export const ResponsiveLayout = ({ widgets, className = '' }: ResponsiveLayoutProps) => {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list' | 'masonry'>('grid');
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Auto-adjust layout based on screen size
  useEffect(() => {
    if (isMobile) {
      setLayoutMode('list');
    } else {
      setLayoutMode('grid');
    }
  }, [isMobile]);

  const getLayoutClasses = () => {
    switch (layoutMode) {
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr';
      case 'list':
        return 'flex flex-col gap-4';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    }
  };

  const getWidgetClasses = (widget: Widget) => {
    const baseClasses = 'glass-card rounded-lg border border-border/50 overflow-hidden transition-all duration-300';
    
    if (expandedWidget === widget.id) {
      return `${baseClasses} fixed inset-4 z-50 max-w-none max-h-none`;
    }

    if (layoutMode === 'masonry') {
      return `${baseClasses} break-inside-avoid mb-4`;
    }

    return baseClasses;
  };

  const sortedWidgets = [...widgets].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return (
    <div className={`relative ${className}`}>
      {/* Layout Controls */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6 justify-end"
        >
          <div className="flex items-center gap-1 glass-panel rounded-lg p-1">
            {[
              { mode: 'grid', icon: Grid, label: 'Grid' },
              { mode: 'list', icon: List, label: 'List' },
            ].map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                variant={layoutMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setLayoutMode(mode as 'grid' | 'list' | 'masonry')}
                className="h-8 px-3"
              >
                <Icon className="w-4 h-4" />
                <span className="sr-only">{label}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Widgets Container */}
      <div className={getLayoutClasses()}>
        <AnimatePresence>
          {sortedWidgets.map((widget, index) => (
            <motion.div
              key={widget.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: {
                  delay: index * 0.1,
                  duration: 0.4,
                  ease: "easeOut"
                }
              }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              whileHover={{ 
                scale: expandedWidget ? 1 : 1.02,
                transition: { duration: 0.2 }
              }}
              className={getWidgetClasses(widget)}
              style={{
                minWidth: widget.minWidth,
                minHeight: widget.minHeight,
              }}
            >
              {/* Widget Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/30 bg-gradient-to-r from-card/50 to-card/30">
                <h3 className="font-medium text-foreground">{widget.title}</h3>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedWidget(
                      expandedWidget === widget.id ? null : widget.id
                    )}
                    className="h-8 w-8 hover:bg-primary/20"
                  >
                    {expandedWidget === widget.id ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* Widget Content */}
              <div className="flex-1 overflow-auto">
                {widget.component}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Backdrop for expanded widgets */}
      <AnimatePresence>
        {expandedWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setExpandedWidget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};