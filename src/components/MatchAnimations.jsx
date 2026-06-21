import { useEffect, useState, useRef } from 'react';

let triggerBoundaryFn = null;
let triggerWicketFn = null;

export function triggerBoundary(runs) {
  if (triggerBoundaryFn) triggerBoundaryFn(runs);
}

export function triggerWicket() {
  if (triggerWicketFn) triggerWicketFn();
}

export default function MatchAnimations() {
  const [boundaryRuns, setBoundaryRuns] = useState(null);
  const [showWicket, setShowWicket] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 8 + 4;
        this.speedX = (Math.random() - 0.5) * 15;
        this.speedY = (Math.random() - 0.5) * 15;
        this.gravity = 0.2;
        this.alpha = 1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.alpha -= 0.01;
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function createExplosion(x, y, colors) {
      for (let i = 0; i < 100; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, color));
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.alpha > 0);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animateParticles);
    }
    animateParticles();

    triggerBoundaryFn = (runs) => {
      setBoundaryRuns(runs);
      createExplosion(window.innerWidth / 2, window.innerHeight / 2, ['#22c55e', '#ffffff', '#16a34a', '#10b981']);
      setTimeout(() => {
        setBoundaryRuns(null);
      }, 2000);
    };

    triggerWicketFn = () => {
      setShowWicket(true);
      document.body.classList.add('animate-shake');
      setTimeout(() => {
        setShowWicket(false);
        document.body.classList.remove('animate-shake');
      }, 2500);
    };

    return () => {
      triggerBoundaryFn = null;
      triggerWicketFn = null;
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        id="animation-canvas"
        style={{
          pointerEvents: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1000,
        }}
      />
      
      {/* Boundary Overlay */}
      {boundaryRuns && (
        <div 
          className="animate-fade-out-zoom"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1100,
          }}
        >
          <span style={{
            fontSize: '15rem',
            fontWeight: 900,
            color: 'var(--color-primary)',
            fontStyle: 'italic',
            textShadow: '0 0 50px rgba(34,197,94,0.8)',
          }}>
            {boundaryRuns}
          </span>
        </div>
      )}

      {/* Wicket Banner & Flash */}
      {showWicket && (
        <>
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(239, 68, 68, 0.3)',
            zIndex: 1050,
            pointerEvents: 'none',
          }} />
          <div 
            className="animate-slide-in-right"
            style={{
              position: 'fixed',
              top: '50%',
              right: 0,
              transform: 'translateY(-50%)',
              backgroundColor: '#ef4444',
              color: 'white',
              fontWeight: 900,
              fontSize: '4rem',
              padding: '2rem 4rem',
              zIndex: 1100,
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)'
            }}
          >
            WICKET!
          </div>
        </>
      )}
    </>
  );
}
