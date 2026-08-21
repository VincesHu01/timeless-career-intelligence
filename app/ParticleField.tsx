"use client";

import { useEffect, useRef } from "react";

const viewIndex:Record<string,number> = { overview:0, matrix:1, jobs:2, weekly:3, learn:4, sources:5 };

export default function ParticleField({ view }:{ view:string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = window.innerWidth < 760 ? 46 : 96;
    const particles = Array.from({ length:count },(_,index) => ({ x:Math.random()*innerWidth, y:Math.random()*innerHeight, vx:0, vy:0, seed:index/count }));
    const pointer = { x:-1000, y:-1000 };
    let width = 0; let height = 0; let frame = 0; let raf = 0;
    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1,2); width = innerWidth; height = innerHeight;
      canvas.width = width*ratio; canvas.height = height*ratio; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; context.setTransform(ratio,0,0,ratio,0,0);
    };
    const target = (i:number,mode:number) => {
      const t = i/count; const angle = t*Math.PI*2; const cx=width*.72; const cy=height*.48; const r=Math.min(width,height)*.28;
      if (mode === 0) return [cx+Math.cos(angle)*r,cy+Math.sin(angle)*r*.55];
      if (mode === 1) return [width*.18+(i%12)*(width*.64/11),height*.2+Math.floor(i/12)*(height*.62/8)];
      if (mode === 2) return [width*.2+t*width*.62,cy+Math.sin(t*Math.PI*6)*r*.38];
      if (mode === 3) return [cx+Math.sin(angle*2)*r*.72,cy+Math.cos(angle)*r*.72];
      if (mode === 4) { const side=i%2?1:-1; return [cx+side*(70+Math.sin(t*Math.PI*7)*r*.56),height*.12+t*height*.76]; }
      return [width*.2+(i%8)*(width*.6/7),height*.22+Math.floor(i/8)*(height*.56/12)];
    };
    const draw = () => {
      const scrollRange=Math.max(1,document.documentElement.scrollHeight-height);
      const scrollStep=Math.round((scrollY/scrollRange)*2);
      const mode=(viewIndex[view]+scrollStep)%6;
      context.clearRect(0,0,width,height);
      particles.forEach((particle,index) => {
        const [tx,ty]=target(index,mode); const dx=tx-particle.x; const dy=ty-particle.y;
        particle.vx=(particle.vx+dx*.003)*.91; particle.vy=(particle.vy+dy*.003)*.91;
        const mx=particle.x-pointer.x; const my=particle.y-pointer.y; const distance=Math.hypot(mx,my);
        if (distance<120) { particle.vx+=(mx/(distance||1))*(120-distance)*.002; particle.vy+=(my/(distance||1))*(120-distance)*.002; }
        particle.x+=particle.vx; particle.y+=particle.vy;
        const pulse=.35+.45*Math.sin(frame*.012+particle.seed*12);
        context.beginPath(); context.fillStyle=index%7===0?`rgba(53,229,220,${pulse})`:`rgba(156,207,28,${pulse*.62})`;
        context.arc(particle.x,particle.y,index%9===0?2.2:1.25,0,Math.PI*2); context.fill();
        if (index>0 && index%3===0) { const prev=particles[index-1]; const d=Math.hypot(prev.x-particle.x,prev.y-particle.y); if(d<86){context.beginPath();context.strokeStyle=`rgba(91,129,48,${(1-d/86)*.13})`;context.moveTo(particle.x,particle.y);context.lineTo(prev.x,prev.y);context.stroke();} }
      });
      frame+=1; if(!reduced) raf=requestAnimationFrame(draw);
    };
    const onPointer=(event:PointerEvent)=>{pointer.x=event.clientX;pointer.y=event.clientY;};
    resize(); draw(); addEventListener("resize",resize); addEventListener("pointermove",onPointer);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize",resize); removeEventListener("pointermove",onPointer); };
  },[view]);
  return <canvas ref={canvasRef} className="cx-particle-field" aria-hidden="true" />;
}
