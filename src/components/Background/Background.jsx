import { useEffect, useRef } from 'react';
import './Background.css';

function Particles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W, H, animId;
    const COLORS = ['13,148,136', '16,185,129', '244,200,74', '255,255,255'];

    class Particle {
      constructor(initial) {
        this.reset(initial);
      }
      reset(initial = false) {
        this.x = Math.random() * W;
        this.y = initial ? Math.random() * H : H + 10;
        this.size = Math.random() * 2 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = -(Math.random() * 0.5 + 0.15);
        this.life = 1;
        this.decay = Math.random() * 0.002 + 0.001;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        if (this.life <= 0 || this.y < -10) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${this.life * 0.5})`;
        ctx.fill();
      }
    }

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    resize();
    const particles = Array.from({ length: 25 }, () => new Particle(true));

    function animate() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) { p.update(); p.draw(); }
      animId = requestAnimationFrame(animate);
    }

    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas" />;
}

export default function Background() {
  return (
    <>
      <Particles />
      <div className="bg-wrapper">
        <div className="bg-image" />
        <div className="bg-overlay" />
        <div className="bg-vignette" />
      </div>
    </>
  );
}
