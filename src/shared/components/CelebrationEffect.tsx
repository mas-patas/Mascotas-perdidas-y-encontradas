import React, { useEffect, useRef } from 'react';

interface CelebrationEffectProps {
    duration?: number; // Duration in milliseconds
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    type: 'confetti' | 'heart';
    rotation: number;
    rotationSpeed: number;
    life: number;
    maxLife: number;
}

export const CelebrationEffect: React.FC<CelebrationEffectProps> = ({ duration = 1000 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Confetti colors (green theme for success)
        const confettiColors = ['#28C76F', '#22C55E', '#16A34A', '#15803D', '#FBBF24', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6'];
        
        // Heart colors (pink/red theme)
        const heartColors = ['#EC4899', '#F472B6', '#FB7185', '#EF4444', '#F87171'];

        // Create particles
        const createParticles = () => {
            const particles: Particle[] = [];
            const particleCount = 150;

            for (let i = 0; i < particleCount; i++) {
                const isHeart = i % 4 === 0; // Every 4th particle is a heart (more visible)
                const colors = isHeart ? heartColors : confettiColors;
                
                particles.push({
                    x: Math.random() * canvas.width,
                    y: -10 - Math.random() * 100, // Start above screen
                    vx: (Math.random() - 0.5) * 3,
                    vy: Math.random() * 1.5 + 1, // Reduced fall speed
                    size: isHeart ? 20 + Math.random() * 12 : 6 + Math.random() * 6, // Even larger hearts for visibility
                    color: colors[Math.floor(Math.random() * colors.length)],
                    type: isHeart ? 'heart' : 'confetti',
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.2,
                    life: 0,
                    maxLife: duration + Math.random() * 500
                });
            }

            particlesRef.current = particles;
        };

        createParticles();

        // Draw heart shape - simple and recognizable
        const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.beginPath();
            // Draw a simple, recognizable heart shape
            const s = size * 0.5; // Half size for easier calculations
            // Top left curve
            ctx.arc(-s * 0.4, -s * 0.2, s * 0.4, Math.PI, 0, false);
            // Top right curve
            ctx.arc(s * 0.4, -s * 0.2, s * 0.4, Math.PI, 0, false);
            // Bottom point
            ctx.lineTo(0, s * 0.6);
            ctx.closePath();
            ctx.fill();
            // Add a subtle stroke for better definition
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        };

        // Draw confetti (rectangle)
        const drawConfetti = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillRect(-size / 2, -size / 2, size, size);
            ctx.restore();
        };

        // Animation loop
        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTimeRef.current;

            if (elapsed > duration) {
                // Cleanup
                window.removeEventListener('resize', resizeCanvas);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                return;
            }

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            particlesRef.current.forEach((particle) => {
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.rotation += particle.rotationSpeed;
                particle.life += 16; // ~60fps

                // Apply gravity to confetti - reduced speed
                if (particle.type === 'confetti') {
                    particle.vy += 0.08; // Reduced gravity
                } else {
                    // Hearts float more gently
                    particle.vy += 0.05; // Even gentler for hearts
                }

                // Fade out as life increases
                const lifeRatio = particle.life / particle.maxLife;
                const alpha = Math.max(0, 1 - lifeRatio);

                // Draw particle
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = particle.color;

                if (particle.type === 'heart') {
                    drawHeart(ctx, particle.x, particle.y, particle.size, particle.rotation);
                } else {
                    drawConfetti(ctx, particle.x, particle.y, particle.size, particle.rotation);
                }

                ctx.restore();

                // Reset particle if it goes off screen
                if (particle.y > canvas.height + 50 || particle.x < -50 || particle.x > canvas.width + 50) {
                    particle.y = -10;
                    particle.x = Math.random() * canvas.width;
                    particle.vx = (Math.random() - 0.5) * 4;
                    particle.vy = Math.random() * 3 + 2;
                    particle.life = 0;
                }
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        // Start animation
        animate();

        // Cleanup function
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [duration]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[9998]"
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
        />
    );
};

