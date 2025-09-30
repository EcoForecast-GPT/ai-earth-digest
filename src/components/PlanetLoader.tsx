import { memo } from 'react';

export const PlanetLoader = memo(() => {
  return (
    <div className="relative h-[220px] w-[220px] flex items-center justify-center">
      <div id="planetTrail1" className="planet-trail planet-trail-1" />
      <div id="planetTrail2" className="planet-trail planet-trail-2" />
      <div id="planetTrail3" className="planet-trail planet-trail-3" />

      <div className="planets-container">
        <div id="planet" className="planet" />
        <div id="star" className="star" />
        <div id="starShadow" className="star-shadow" />
        <div id="blackHoleDisk2" className="black-hole-disk-2" />
        <div id="blackHole" className="black-hole" />
        <div id="blackHoleDisk1" className="black-hole-disk-1" />
      </div>
    </div>
  );
});

PlanetLoader.displayName = 'PlanetLoader';
