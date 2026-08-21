"use client";

import { useEffect, useRef } from "react";

const viewIndex:Record<string,number> = { overview:0, matrix:1, jobs:2, weekly:3, learn:4, sources:5 };
const colors = ["#665cff","#00b8d9","#ff3f8e","#9b4dff","#f3a712","#315cff"];

export default function ParticleField({ view }:{ view:string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = window.innerWidth < 760 ? 82 : 176;
    const particles = Array.from({ length:count },(_,index) => ({ x:Math.random()*innerWidth, y:Math.random()*innerHeight, vx:0, vy:0, seed:index/count }));
    const pointer = { x:-1000, y:-1000, active:false };
    let width = 0; let height = 0; let frame = 0; let raf = 0;
    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1,2); width = innerWidth; height = innerHeight;
      canvas.width = width*ratio; canvas.height = height*ratio; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; context.setTransform(ratio,0,0,ratio,0,0);
    };
    const target = (index:number,mode:number) => {
      const t = index/count; const angle = t*Math.PI*2; const cx=width*.68; const cy=height*.49; const r=Math.min(width,height)*.34;
      if (mode === 0) {
        const top = index < count*.42;
        return top ? [cx-r*.7+(index/(count*.42))*r*1.4,cy-r*.66] : [cx+Math.sin(t*25)*8,cy-r*.66+((index-count*.42)/(count*.58))*r*1.45];
      }
      if (mode === 1) {
        const rr=r*(.45+.5*Math.sin(angle)*Math.sin(angle));
        return [cx+Math.cos(angle)*rr,cy+Math.sin(angle)*r*.52];
      }
      if (mode === 2) {
        const y=height*.1+t*height*.8; const side=index%2?1:-1;
        return [cx+side*Math.sin(t*Math.PI*7)*r*.55,y];
      }
      if (mode === 3) {
        const a=t*Math.PI*2; const den=1+Math.sin(a)*Math.sin(a);
        return [cx+r*.86*Math.cos(a)/den,cy+r*.62*Math.sin(a)*Math.cos(a)/den];
      }
      if (mode === 4) {
        const spokes=7; const spoke=index%spokes; const depth=Math.floor(index/spokes)/(count/spokes);
        return [cx+Math.cos(spoke/spokes*Math.PI*2)*(r*.16+depth*r*.78),cy+Math.sin(spoke/spokes*Math.PI*2)*(r*.16+depth*r*.78)];
      }
      const spiral=angle*2.8;
      return [cx+Math.cos(spiral)*r*t,cy+Math.sin(spiral)*r*t];
    };
    const draw = () => {
      const scrollRange=Math.max(1,document.documentElement.scrollHeight-height);
      const scrollStep=Math.round((scrollY/scrollRange)*3);
      const mode=(viewIndex[view]+scrollStep)%6;
      context.clearRect(0,0,width,height);
      context.lineWidth=1.15;
      particles.forEach((particle,index) => {
        const [tx,ty]=target(index,mode); const dx=tx-particle.x; const dy=ty-particle.y;
        particle.vx=(particle.vx+dx*.0055)*.89; particle.vy=(particle.vy+dy*.0055)*.89;
        const mx=particle.x-pointer.x; const my=particle.y-pointer.y; const distance=Math.hypot(mx,my);
        if (pointer.active && distance<190) { particle.vx+=(mx/(distance||1))*(190-distance)*.006; particle.vy+=(my/(distance||1))*(190-distance)*.006; }
        particle.x+=particle.vx; particle.y+=particle.vy;
        const color=colors[(index+mode)%colors.length]; const pulse=.68+.32*Math.sin(frame*.025+particle.seed*18);
        context.save(); context.shadowColor=color; context.shadowBlur=index%8===0?24:12;
        context.beginPath(); context.fillStyle=color; context.globalAlpha=pulse;
        context.arc(particle.x,particle.y,index%11===0?4.1:index%4===0?2.7:1.8,0,Math.PI*2); context.fill(); context.restore();
        if (index>0) {
          const prev=particles[index-1]; const d=Math.hypot(prev.x-particle.x,prev.y-particle.y);
          if(d<115){context.beginPath();context.globalAlpha=(1-d/115)*.42;context.strokeStyle=color;context.moveTo(particle.x,particle.y);context.lineTo(prev.x,prev.y);context.stroke();}
        }
      });
      context.globalAlpha=1;
      frame+=1; if(!reduced) raf=requestAnimationFrame(draw);
    };
    const onPointer=(event:PointerEvent)=>{pointer.x=event.clientX;pointer.y=event.clientY;pointer.active=true;};
    const onLeave=()=>{pointer.active=false;};
    resize(); draw(); addEventListener("resize",resize); addEventListener("pointermove",onPointer); addEventListener("pointerleave",onLeave);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize",resize); removeEventListener("pointermove",onPointer); removeEventListener("pointerleave",onLeave); };
  },[view]);
  return <canvas ref={canvasRef} className="cx-particle-field" aria-hidden="true" />;
}
