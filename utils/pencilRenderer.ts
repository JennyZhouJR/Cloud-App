// Palette
export const COLORS = {
  GRAPHITE: '#3B3B3B',
  RED: '#D66158',
  BLUE: '#8EB7E0',
  GREEN: '#9BCB87',
  WHITE: '#F8F1E3',
  YELLOW: '#F2C94C',
};

export const FLOWER_COLORS = [
  '#F6A7C1', // pink
  '#FFBC9A', // peach
  '#FFE873', // soft yellow
  '#A8E6CF', // mint green
  '#C7B8E0', // lilac
  '#8EB7E0'  // sky blue
];

// Helper to draw a "shaky" line
export const drawSketchLine = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number = 1,
  roughness: number = 1.5
) => {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  
  // Draw base line
  ctx.moveTo(x1, y1);
  
  const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const steps = Math.max(1, Math.floor(dist / 5)); // Segment every 5px
  
  let cx = x1;
  let cy = y1;
  
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const tx = x1 + (x2 - x1) * t;
    const ty = y1 + (y2 - y1) * t;
    
    // Add jitter
    const ox = (Math.random() - 0.5) * roughness;
    const oy = (Math.random() - 0.5) * roughness;
    
    ctx.lineTo(tx + ox, ty + oy);
    cx = tx;
    cy = ty;
  }
  
  ctx.stroke();
  
  // Second pass for texture (lighter)
  ctx.beginPath();
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = width * 0.5;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 1.0;
};

export const drawLightning = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number
) => {
  ctx.save();
  ctx.strokeStyle = '#FFF9E3';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#FFF9E3';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  
  ctx.moveTo(x, y);
  let cx = x;
  let cy = y;
  
  // Draw main bolt
  while(cy < y + height) {
    const segmentY = Math.random() * 30 + 10;
    const segmentX = (Math.random() - 0.5) * 60; // Jagged
    
    cx += segmentX;
    cy += segmentY;
    
    ctx.lineTo(cx, cy);
    
    // Occasional branch
    if (Math.random() < 0.3) {
      ctx.save();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + (Math.random()-0.5)*40, cy + 30);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.stroke();
  ctx.restore();
};

export const drawFlower = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  density: number,
  color: string = COLORS.RED
) => {
  const petals = 5 + Math.floor(density * 3);
  const radius = size;
  
  ctx.save();
  ctx.translate(x, y);
  
  // Draw Petals
  for (let i = 0; i < petals; i++) {
    const angle = (Math.PI * 2 * i) / petals;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    
    // Petal scribble
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;
    
    for(let j=0; j<4; j++) {
       const jitter = size * 0.2;
       ctx.moveTo(0,0);
       ctx.bezierCurveTo(
         px * 0.5 + (Math.random()-0.5)*jitter, py * 0.5 + (Math.random()-0.5)*jitter,
         px + (Math.random()-0.5)*jitter, py + (Math.random()-0.5)*jitter,
         px * 0.2, py * 0.2
       );
    }
    ctx.stroke();
  }
  
  // Center
  ctx.beginPath();
  ctx.fillStyle = COLORS.YELLOW;
  ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke(); // Outline center
  
  ctx.restore();
};

export const drawCloud = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  complexity: number
) => {
  ctx.save();
  ctx.translate(x, y);
  
  const puffs = 3 + Math.floor(complexity * 5);
  ctx.strokeStyle = COLORS.GRAPHITE;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1.5;
  
  ctx.beginPath();
  for (let i = 0; i < puffs; i++) {
    const angle = (Math.PI * 2 * i) / puffs; // Spread loosely
    const ox = Math.cos(angle) * (size * 0.5) + (Math.random() - 0.5) * 10;
    const oy = Math.sin(angle) * (size * 0.3) + (Math.random() - 0.5) * 5;
    const r = size * (0.4 + Math.random() * 0.3);
    
    ctx.moveTo(ox + r, oy);
    ctx.arc(ox, oy, r, 0, Math.PI*2);
  }
  ctx.fill();
  
  // Sketchy outline on top
  ctx.beginPath();
  for (let i = 0; i < puffs; i++) {
      const angle = (Math.PI * 2 * i) / puffs;
      const ox = Math.cos(angle) * (size * 0.5);
      const oy = Math.sin(angle) * (size * 0.3);
      const r = size * (0.4 + Math.random() * 0.3);
      
      // Arc segments instead of full circles for "sketch" look
      ctx.moveTo(ox + Math.cos(0)*r, oy + Math.sin(0)*r);
      for(let a=0; a<Math.PI*2; a+=0.5) {
          ctx.lineTo(
              ox + Math.cos(a)*r + (Math.random()-0.5)*2, 
              oy + Math.sin(a)*r + (Math.random()-0.5)*2
          );
      }
  }
  ctx.stroke();
  
  ctx.restore();
};

export const drawBird = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  wingPhase: number,
  color: string = COLORS.GRAPHITE,
  isPerched: boolean = false
) => {
  ctx.save();
  ctx.translate(x, y);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  
  if (isPerched) {
      // Perched shape (folded wings)
      ctx.moveTo(-8, 0);
      ctx.quadraticCurveTo(0, -12, 8, 0); // Body
      ctx.moveTo(-8, 0);
      ctx.lineTo(0, 5); // Tail
      ctx.lineTo(8, 0);
  } else {
      // Flying shape
      const wingY = Math.sin(wingPhase) * 10;
      // Left Wing
      ctx.moveTo(-15, wingY);
      ctx.quadraticCurveTo(-5, -5, 0, 0);
      // Right Wing
      ctx.moveTo(15, wingY);
      ctx.quadraticCurveTo(5, -5, 0, 0);
  }
  
  ctx.stroke();
  ctx.restore();
};