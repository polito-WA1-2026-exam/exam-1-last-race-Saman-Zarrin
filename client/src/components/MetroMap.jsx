import React from 'react';

// 1. Added plannedSegments prop (defaulting to empty array)
function MetroMap({ showLines, plannedSegments = [] }) {
  // Coordinates built EXACTLY to match your 12 db_setup.js stations
  const stations = [
    { name: 'Piazza delle Lanterne', cx: 150, cy: 100 },
    { name: 'Crocevia del Falco', cx: 350, cy: 100 },
    { name: 'Centrale', cx: 550, cy: 100 },
    { name: 'Porta Velaria', cx: 750, cy: 100 },
    
    { name: 'Viale dei Mosaici', cx: 150, cy: 250 },
    { name: 'Borgo Sereno', cx: 350, cy: 250 },
    { name: 'Fontana Oscura', cx: 550, cy: 250 },
    
    { name: 'Torre Cinerea', cx: 750, cy: 250 },
    { name: 'Campo dell Eco', cx: 950, cy: 250 },
    
    { name: 'Stazione Nord', cx: 750, cy: 400 },
    { name: 'Parco Ovest', cx: 550, cy: 400 },
    { name: 'Fiume Giallo', cx: 350, cy: 400 }
  ];

  // Lines built EXACTLY to match your db_setup.js segments table
  const segments = [
    // Red Line
    { a: 'Piazza delle Lanterne', b: 'Crocevia del Falco', color: 'red' },
    { a: 'Crocevia del Falco', b: 'Centrale', color: 'red' },
    { a: 'Centrale', b: 'Porta Velaria', color: 'red' },
    { a: 'Piazza delle Lanterne', b: 'Viale dei Mosaici', color: 'blue' },
    { a: 'Fontana Oscura', b: 'Parco Ovest', color: 'blue' },
    // Blue Line
    { a: 'Viale dei Mosaici', b: 'Borgo Sereno', color: 'blue' },
    { a: 'Borgo Sereno', b: 'Fontana Oscura', color: 'blue' },
    { a: 'Fontana Oscura', b: 'Centrale', color: 'blue' },

    // Green Line
    { a: 'Porta Velaria', b: 'Torre Cinerea', color: 'green' },
    { a: 'Torre Cinerea', b: 'Campo dell Eco', color: 'green' },
    { a: 'Campo dell Eco', b: 'Stazione Nord', color: 'green' },

    // Yellow Line
    { a: 'Torre Cinerea', b: 'Stazione Nord', color: '#ffcc00' },
    { a: 'Stazione Nord', b: 'Parco Ovest', color: '#ffcc00' },
    { a: 'Parco Ovest', b: 'Fiume Giallo', color: '#ffcc00' }
  ];

  // Helper to find coordinates for drawing lines
  const getCoord = (name) => stations.find(s => s.name === name) || { cx: 0, cy: 0 };

  return (
    <div className="bg-white border rounded shadow-sm mb-4" style={{ overflowX: 'auto' }}>
      <svg width="1000" height="500" style={{ minWidth: '1000px' }}>
        
        {/* Draw colored Lines ONLY if showLines is true (Phase 1) */}
        {showLines && segments.map((seg, index) => {
          const start = getCoord(seg.a);
          const end = getCoord(seg.b);
          return (
            <line 
              key={index} 
              x1={start.cx} y1={start.cy} 
              x2={end.cx} y2={end.cy} 
              stroke={seg.color} 
              strokeWidth="6" 
              opacity="0.7"
            />
          );
        })}

        {/* 2. NEW: Draw the PLANNED route in Phase 2 (Neutral grey, dashed line) */}
        {!showLines && plannedSegments.map((seg, index) => {
          // Fallback logic depending on what properties your DB API returns (station_a vs a)
          const startName = seg.station_a || seg.a; 
          const endName = seg.station_b || seg.b;
          const start = getCoord(startName);
          const end = getCoord(endName);
          
          return (
            <line 
              key={`planned-${index}`} 
              x1={start.cx} y1={start.cy} 
              x2={end.cx} y2={end.cy} 
              stroke="#555"          /* Neutral dark grey hides the real line color */
              strokeWidth="6" 
              strokeDasharray="8,8"  /* Dashed style indicates it's the "planned" route */
              opacity="0.9"
            />
          );
        })}

        {/* Draw Stations (Always visible) */}
        {stations.map((station, index) => (
          <g key={index}>
            <circle 
              cx={station.cx} cy={station.cy} 
              r="8" fill="white" stroke="#333" strokeWidth="3" 
            />
            <text 
              x={station.cx} y={station.cy - 15} 
              textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333"
            >
              {station.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default MetroMap;