/**
 * Musa Studio — Spatial Environment Physics
 * This is a kinetic installation where scroll = energy input
 * All elements are physical objects with mass, collision, and momentum
 */

(function() {
    'use strict';

    // =========================================================================
    // Scroll Physics System - Scroll is Force, Not Navigation
    // =========================================================================
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollMomentum = 0;
    const momentumDecay = 0.92;

    // All scroll-based physics disabled for stable, predictable behavior
    function updateScrollPhysics() {
        // Scroll physics disabled
        // No transforms, no parallax, no blur effects
    }

    // Scroll tracking disabled

    // =========================================================================
    // Cursor Disturbance Field - Creates force around cursor
    // =========================================================================
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    const mouseSmoothing = 0.15;

    window.addEventListener('mousemove', (e) => {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
    });

    function animateMouseDisturbance() {
        mouseX += (targetMouseX - mouseX) * mouseSmoothing;
        mouseY += (targetMouseY - mouseY) * mouseSmoothing;

        // Disturbance effect disabled to prevent drift
        // Only update mouse position for ball physics

        requestAnimationFrame(animateMouseDisturbance);
    }

    animateMouseDisturbance();

    // =========================================================================
    // Physics Balls - Enhanced Energy Particle System
    // Balls are physical manifestations of kinetic energy
    // =========================================================================
    const ballLayer = document.createElement('div');
    ballLayer.className = 'ball-layer';
    document.body.appendChild(ballLayer);
    const ballContainer = ballLayer;
    const hero = document.querySelector('.hero');
    const balls = [];
    const maxBalls = 15; // Reduced from 25 for better performance

    const gravity = 0.7;
    const airResistance = 0.995;
    const bounceFactor = 0.6;
    const ballBounceFactor = 0.5;
    const ballRadius = 12;
    const stopVelocity = 0.15;
    const maxVelocity = 35;
    const magneticRadius = 150; // Cursor magnetic field radius
    const magneticStrength = 0.3;
    const maskAlphaThreshold = 10;
    let lastTime = 0;
    let lastScrollSpawnTime = 0;

    const maskCache = new WeakMap();

    function getMaskData(el) {
        if (maskCache.has(el)) {
            return maskCache.get(el);
        }

        if (!el.complete || !el.naturalWidth || !el.naturalHeight) {
            return null;
        }

        const canvas = document.createElement('canvas');
        const width = el.naturalWidth;
        const height = el.naturalHeight;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(el, 0, 0, width, height);
        const data = ctx.getImageData(0, 0, width, height).data;

        const mask = { data, width, height };
        maskCache.set(el, mask);
        return mask;
    }

    // Create a new ball element
    function createBall() {
        const ball = document.createElement('div');
        ball.className = 'ball active';
        ball.setAttribute('aria-hidden', 'true');
        ballContainer.appendChild(ball);
        return ball;
    }

    // Remove old balls if too many
    function cleanupBalls() {
        while (balls.length > maxBalls) {
            const oldBall = balls.shift();
            if (oldBall.element && oldBall.element.parentNode) {
                oldBall.element.remove();
            }
        }
    }

    // Get obstacles - only marked elements are collidable
    // Uses viewport coordinates only (no scroll offsets) to match position:fixed balls
    function getObstacles() {
        const obstacles = [];
        document.querySelectorAll('[data-ball-obstacle]').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 6 || rect.height < 6) return;

            const insetX = Math.min(10, rect.width * 0.08);
            const insetY = Math.min(10, rect.height * 0.12);
            // Use viewport coordinates only - no scroll offsets
            const left = rect.left + insetX;
            const right = rect.right - insetX;
            const top = rect.top + insetY;
            const bottom = rect.bottom - insetY;
            if (right - left < 4 || bottom - top < 4) return;

            obstacles.push({
                type: 'rect',
                element: el,
                left,
                right,
                top,
                bottom
            });
        });

        document.querySelectorAll('[data-ball-mask]').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 6 || rect.height < 6) return;

            const mask = getMaskData(el);
            if (!mask) return;

            // Use viewport coordinates only - no scroll offsets
            const left = rect.left;
            const right = rect.right;
            const top = rect.top;
            const bottom = rect.bottom;

            obstacles.push({
                type: 'mask',
                left,
                right,
                top,
                bottom,
                width: rect.width,
                height: rect.height,
                mask
            });
        });

        return obstacles;
    }

    function checkRectCollision(ballObj, obs) {
        if (obs.type !== 'rect') return false;

        const { x, y } = ballObj;
        const ballLeft = x - ballRadius;
        const ballRight = x + ballRadius;
        const ballTop = y - ballRadius;
        const ballBottom = y + ballRadius;

        if (ballRight > obs.left && ballLeft < obs.right &&
            ballBottom > obs.top && ballTop < obs.bottom) {

            const overlapLeft = ballRight - obs.left;
            const overlapRight = obs.right - ballLeft;
            const overlapTop = ballBottom - obs.top;
            const overlapBottom = obs.bottom - ballTop;

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            // Add impact flash effect to ball
            ballObj.element.classList.add('impact');
            setTimeout(() => {
                if (ballObj.element) ballObj.element.classList.remove('impact');
            }, 200);

            // Add flash effect to collided text element
            if (obs.element) {
                obs.element.classList.add('ball-hit');
                setTimeout(() => {
                    if (obs.element) obs.element.classList.remove('ball-hit');
                }, 400);
            }

            if (minOverlapX < minOverlapY) {
                if (overlapLeft < overlapRight) {
                    ballObj.x = obs.left - ballRadius;
                    ballObj.vx = -Math.abs(ballObj.vx) * bounceFactor;
                } else {
                    ballObj.x = obs.right + ballRadius;
                    ballObj.vx = Math.abs(ballObj.vx) * bounceFactor;
                }
                if (Math.abs(ballObj.vx) < stopVelocity) {
                    ballObj.vx = 0;
                }
                // Add rotation on side collision
                ballObj.rotation = (ballObj.rotation || 0) + ballObj.vx * 2;
            } else {
                if (overlapTop < overlapBottom) {
                    ballObj.y = obs.top - ballRadius;
                    ballObj.vy = -Math.abs(ballObj.vy) * bounceFactor;
                    // Enhanced squash effect
                    const impactForce = Math.min(Math.abs(ballObj.vy) / maxVelocity, 1);
                    const squashX = 1 + impactForce * 0.5;
                    const squashY = 1 - impactForce * 0.4;
                    ballObj.element.style.transform = `translate(-50%, -50%) scaleX(${squashX}) scaleY(${squashY}) rotate(${ballObj.rotation || 0}deg)`;
                    setTimeout(() => {
                        if (ballObj.element) {
                            ballObj.element.style.transform = `translate(-50%, -50%) rotate(${ballObj.rotation || 0}deg)`;
                        }
                    }, 120);
                } else {
                    ballObj.y = obs.bottom + ballRadius;
                    ballObj.vy = Math.abs(ballObj.vy) * bounceFactor;
                }
                if (Math.abs(ballObj.vy) < stopVelocity) {
                    ballObj.vy = 0;
                }
            }
            return true;
        }
        return false;
    }

    function checkMaskCollision(ballObj, obs) {
        if (obs.type !== 'mask') return false;

        const { x, y } = ballObj;
        const ballLeft = x - ballRadius;
        const ballRight = x + ballRadius;
        const ballTop = y - ballRadius;
        const ballBottom = y + ballRadius;

        if (ballRight < obs.left || ballLeft > obs.right || ballBottom < obs.top || ballTop > obs.bottom) {
            return false;
        }

        const localX = x - obs.left;
        const localY = y - obs.top;

        if (localX < 0 || localY < 0 || localX > obs.width || localY > obs.height) {
            return false;
        }

        const sampleX = Math.max(0, Math.min(obs.mask.width - 1, Math.floor((localX / obs.width) * obs.mask.width)));
        const sampleY = Math.max(0, Math.min(obs.mask.height - 1, Math.floor((localY / obs.height) * obs.mask.height)));
        const alphaIndex = (sampleY * obs.mask.width + sampleX) * 4 + 3;
        const alpha = obs.mask.data[alphaIndex];

        if (alpha <= maskAlphaThreshold) {
            return false;
        }

        const sampleOpaque = (dx, dy) => {
            const ix = Math.max(0, Math.min(obs.mask.width - 1, sampleX + dx));
            const iy = Math.max(0, Math.min(obs.mask.height - 1, sampleY + dy));
            const a = obs.mask.data[(iy * obs.mask.width + ix) * 4 + 3];
            return a > maskAlphaThreshold ? 1 : 0;
        };

        let nx = sampleOpaque(1, 0) - sampleOpaque(-1, 0);
        let ny = sampleOpaque(0, 1) - sampleOpaque(0, -1);
        if (nx === 0 && ny === 0) {
            const speed = Math.hypot(ballObj.vx, ballObj.vy) || 1;
            nx = ballObj.vx / speed;
            ny = ballObj.vy / speed;
        }

        const nLen = Math.hypot(nx, ny) || 1;
        nx /= nLen;
        ny /= nLen;

        const vDot = ballObj.vx * nx + ballObj.vy * ny;
        ballObj.vx = (ballObj.vx - 2 * vDot * nx) * bounceFactor;
        ballObj.vy = (ballObj.vy - 2 * vDot * ny) * bounceFactor;

        ballObj.x = ballObj.prevX ?? ballObj.x;
        ballObj.y = ballObj.prevY ?? ballObj.y;

        // Impact flash
        ballObj.element.classList.add('impact');
        setTimeout(() => {
            if (ballObj.element) ballObj.element.classList.remove('impact');
        }, 150);

        return true;
    }

    function resolveBallCollision(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = ballRadius * 2;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) {
            dist = 0.01;
        }

        if (dist < minDist) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;
            const separation = overlap / 2;

            a.x -= nx * separation;
            a.y -= ny * separation;
            b.x += nx * separation;
            b.y += ny * separation;

            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal > 0) return;

            const impulse = -(1 + ballBounceFactor) * velAlongNormal / 2;
            const ix = impulse * nx;
            const iy = impulse * ny;

            a.vx -= ix;
            a.vy -= iy;
            b.vx += ix;
            b.vy += iy;

            // Visual feedback on ball collision
            a.element.classList.add('impact');
            b.element.classList.add('impact');

            setTimeout(() => {
                if (a.element) a.element.classList.remove('impact');
                if (b.element) b.element.classList.remove('impact');
            }, 150);

            // Add spin to both balls
            const spinTransfer = 5;
            a.rotation = (a.rotation || 0) + spinTransfer * (Math.random() - 0.5);
            b.rotation = (b.rotation || 0) + spinTransfer * (Math.random() - 0.5);
        }
    }

    // Clamp velocity and apply visual effects based on speed
    function clampVelocity(ballObj) {
        const speed = Math.sqrt(ballObj.vx * ballObj.vx + ballObj.vy * ballObj.vy);

        // Add high-velocity class for visual trail effect
        if (speed > maxVelocity * 0.6) {
            ballObj.element.classList.add('high-velocity');
            ballObj.element.classList.remove('resting');
        } else if (speed < stopVelocity * 2) {
            // Ball is nearly at rest
            ballObj.element.classList.remove('high-velocity');
            ballObj.element.classList.add('resting');
        } else {
            ballObj.element.classList.remove('high-velocity');
            ballObj.element.classList.remove('resting');
        }

        if (speed > maxVelocity) {
            const scale = maxVelocity / speed;
            ballObj.vx *= scale;
            ballObj.vy *= scale;
        }
    }

    // Apply cursor magnetic field to ball
    function applyCursorMagnetism(ballObj) {
        // Use viewport coordinates directly since balls are position:fixed
        const dx = mouseX - ballObj.x;
        const dy = mouseY - ballObj.y;
        const distanceSq = dx * dx + dy * dy;
        const magneticRadiusSq = magneticRadius * magneticRadius;

        if (distanceSq < magneticRadiusSq && distanceSq > 25) { // Prevent division by zero and extreme forces
            const distance = Math.sqrt(distanceSq);
            const force = (1 - distance / magneticRadius) * magneticStrength;
            const angle = Math.atan2(dy, dx);

            // Attract ball to cursor with damping
            const forceX = Math.cos(angle) * force;
            const forceY = Math.sin(angle) * force;

            // Apply force with velocity damping to prevent runaway acceleration
            ballObj.vx += forceX * 0.8;
            ballObj.vy += forceY * 0.8;
        }
    }

    // Animation loop for all balls
    let animating = false;
    let obstacleCache = [];
    let obstacleCacheTime = 0;
    const obstacleCacheDuration = 100; // Cache obstacles for 100ms to reduce DOM queries

    function animateAll(currentTime) {
        if (balls.length === 0) {
            animating = false;
            lastTime = 0;
            return;
        }

        // Calculate delta time for frame-independent physics
        if (lastTime === 0) lastTime = currentTime;
        const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2); // Normalize to ~60fps, cap at 2x
        lastTime = currentTime;

        // Cache obstacles to reduce expensive DOM queries
        if (currentTime - obstacleCacheTime > obstacleCacheDuration) {
            obstacleCache = getObstacles();
            obstacleCacheTime = currentTime;
        }
        const obstacles = obstacleCache;

        const docWidth = window.innerWidth;
        // Use viewport height only - balls are position:fixed so they stay in viewport
        const docHeight = window.innerHeight;

        balls.forEach((ballObj) => {
            if (!ballObj.active) return;

            ballObj.prevX = ballObj.x;
            ballObj.prevY = ballObj.y;

            // Apply cursor magnetism
            applyCursorMagnetism(ballObj);

            // Apply gravity (frame-independent)
            ballObj.vy += gravity * deltaTime;

            // Apply air resistance to both axes
            ballObj.vx *= Math.pow(airResistance, deltaTime);
            ballObj.vy *= Math.pow(airResistance, deltaTime);

            // Clamp velocity and update visuals
            clampVelocity(ballObj);

            // Update position (frame-independent)
            ballObj.x += ballObj.vx * deltaTime;
            ballObj.y += ballObj.vy * deltaTime;

            // Update rotation with custom spin speed
            if (!ballObj.rotation) ballObj.rotation = 0;
            ballObj.rotation += ((ballObj.vx * 0.5) + (ballObj.spinSpeed || 0)) * deltaTime;
        });

        // Check collisions with obstacles
        balls.forEach((ballObj) => {
            if (!ballObj.active) return;
            // Check collisions
            for (const obs of obstacles) {
                if (obs.type === 'rect') {
                    checkRectCollision(ballObj, obs);
                } else if (obs.type === 'mask') {
                    checkMaskCollision(ballObj, obs);
                }
            }
        });

        // Ball to ball collisions
        for (let i = 0; i < balls.length; i++) {
            const a = balls[i];
            if (!a.active) continue;
            for (let j = i + 1; j < balls.length; j++) {
                const b = balls[j];
                if (!b.active) continue;
                resolveBallCollision(a, b);
            }
        }

        // Walls, ceiling, and floor
        balls.forEach((ballObj) => {
            if (!ballObj.active) return;

            // Left wall
            if (ballObj.x - ballRadius < 0) {
                ballObj.x = ballRadius;
                ballObj.vx = Math.abs(ballObj.vx) * bounceFactor;
                if (Math.abs(ballObj.vx) < stopVelocity) {
                    ballObj.vx = 0;
                }
            }

            // Right wall
            if (ballObj.x + ballRadius > docWidth) {
                ballObj.x = docWidth - ballRadius;
                ballObj.vx = -Math.abs(ballObj.vx) * bounceFactor;
                if (Math.abs(ballObj.vx) < stopVelocity) {
                    ballObj.vx = 0;
                }
            }

            // Ceiling (prevent balls going above viewport)
            if (ballObj.y - ballRadius < 0) {
                ballObj.y = ballRadius;
                ballObj.vy = Math.abs(ballObj.vy) * bounceFactor;
                if (Math.abs(ballObj.vy) < stopVelocity) {
                    ballObj.vy = 0;
                }
            }

            // Remove balls that fall below the page or go way off screen
            if (ballObj.y > docHeight + 200) {
                ballObj.active = false;
                ballObj.element.classList.add('fade-out');
                setTimeout(() => {
                    if (ballObj.element && ballObj.element.parentNode) {
                        ballObj.element.parentNode.removeChild(ballObj.element);
                    }
                }, 300);
                return;
            }

            // Floor with bounce - only bounce if near the bottom
            if (ballObj.y + ballRadius > docHeight) {
                ballObj.y = docHeight - ballRadius;
                ballObj.vy = -Math.abs(ballObj.vy) * bounceFactor;

                // Squash on floor bounce
                const impactForce = Math.min(Math.abs(ballObj.vy) / maxVelocity, 1);
                const squashX = 1 + impactForce * 0.5;
                const squashY = 1 - impactForce * 0.4;
                ballObj.element.style.transform = `translate(-50%, -50%) scaleX(${squashX}) scaleY(${squashY}) rotate(${ballObj.rotation || 0}deg)`;
                setTimeout(() => {
                    if (ballObj.element) {
                        ballObj.element.style.transform = `translate(-50%, -50%) rotate(${ballObj.rotation || 0}deg)`;
                    }
                }, 120);

                if (Math.abs(ballObj.vy) < stopVelocity) {
                    ballObj.vy = 0;
                }

                // Track resting time at bottom
                if (Math.abs(ballObj.vx) < stopVelocity && Math.abs(ballObj.vy) < stopVelocity) {
                    if (!ballObj.restingStartTime) {
                        ballObj.restingStartTime = currentTime;
                    } else if (currentTime - ballObj.restingStartTime > 3000) {
                        // Ball has been resting for 3 seconds, fade out and delete
                        ballObj.element.style.opacity = '0';
                        ballObj.element.style.transition = 'opacity 0.5s ease';
                        setTimeout(() => {
                            if (ballObj.element && ballObj.element.parentNode) {
                                ballObj.element.parentNode.removeChild(ballObj.element);
                            }
                        }, 500);
                        ballObj.active = false;
                    }
                } else {
                    ballObj.restingStartTime = null;
                }
            } else {
                ballObj.restingStartTime = null;
            }

            // Update element position using transform for better performance
            ballObj.element.style.left = ballObj.x + 'px';
            ballObj.element.style.top = ballObj.y + 'px';

            // Apply rotation if not in squash animation
            if (!ballObj.element.style.transform.includes('scale')) {
                ballObj.element.style.transform = `translate(-50%, -50%) rotate(${ballObj.rotation || 0}deg)`;
            }
        });

        // Remove inactive balls from array
        for (let i = balls.length - 1; i >= 0; i--) {
            if (!balls[i].active) {
                balls.splice(i, 1);
            }
        }

        if (balls.some(b => b.active)) {
            requestAnimationFrame(animateAll);
        } else {
            animating = false;
        }
    }

    // Spawn ball at position with velocity and optional color variant
    function spawnBall(x, y, vx = 0, vy = 2, variant = 'normal') {
        cleanupBalls();

        const ball = createBall();

        // Add variety to ball appearance
        if (variant === 'fast') {
            ball.classList.add('high-velocity');
        } else if (variant === 'slow') {
            ball.classList.add('resting');
        }

        const ballObj = {
            element: ball,
            x: x,
            y: y,
            vx: vx + (Math.random() - 0.5) * 6, // Increased randomness
            vy: vy + (Math.random() - 0.5) * 4, // Increased randomness
            active: true,
            stopping: false,
            rotation: Math.random() * 360,
            spinSpeed: (Math.random() - 0.5) * 10 // Random spin speed
        };

        ball.style.left = ballObj.x + 'px';
        ball.style.top = ballObj.y + 'px';

        balls.push(ballObj);

        if (!animating) {
            animating = true;
            requestAnimationFrame(animateAll);
        }

        return ballObj;
    }

    // Click in hero to spawn ball with variety
    if (hero) {
        hero.addEventListener('click', (e) => {
            if (e.target.closest('a, button')) return;

            // Varied spawn patterns
            const patterns = ['burst', 'straight', 'arc', 'random'];
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];

            const clickForce = 8 + Math.random() * 4; // 8-12 force
            const angle = (Math.random() - 0.5) * Math.PI / 2; // -45 to +45 degrees

            let vx, vy;

            switch(pattern) {
                case 'burst':
                    // Explode outward from click point
                    const burstAngle = Math.random() * Math.PI * 2;
                    vx = Math.cos(burstAngle) * clickForce;
                    vy = Math.sin(burstAngle) * clickForce;
                    break;
                case 'straight':
                    // Straight down with slight variation
                    vx = (Math.random() - 0.5) * 2;
                    vy = clickForce;
                    break;
                case 'arc':
                    // Arcing shot
                    vx = (Math.random() - 0.5) * clickForce * 1.5;
                    vy = -clickForce * 0.5; // Initial upward velocity
                    break;
                default:
                    // Random direction
                    vx = (Math.random() - 0.5) * clickForce * 2;
                    vy = Math.random() * clickForce;
            }

            const variant = Math.random() > 0.7 ? 'fast' : 'normal';

            spawnBall(
                e.pageX,
                e.pageY,
                vx,
                vy,
                variant
            );
        });
    }

    // Note: Scroll-based ball spawning removed per user request

    // =========================================================================
    // Smooth Scroll
    // =========================================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // =========================================================================
    // Reveal on Scroll
    // =========================================================================
    const reveals = document.querySelectorAll('[data-reveal]');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => revealObserver.observe(el));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        reveals.forEach(el => el.classList.add('revealed'));
    }

    // =========================================================================
    // Project Page Navigation with Smooth Transitions
    // =========================================================================
    const workItems = document.querySelectorAll('.work-item');

    const projectLinks = {
        'MoneyUp': 'moneyup.html',
        'Would You Rather': 'wouldyourather.html',
        'FoundersFlow': 'foundersflow.html'
    };

    // Staggered entrance animation for work items
    const workObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100); // Stagger by 100ms
                workObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    });

    workItems.forEach((item, index) => {
        // Set initial state for stagger animation
        item.style.opacity = '0';
        item.style.transform = 'translateY(40px)';
        item.style.transition = `opacity 0.8s var(--ease-out) ${index * 0.1}s, transform 0.8s var(--ease-out) ${index * 0.1}s`;

        workObserver.observe(item);

        item.addEventListener('click', (e) => {
            e.preventDefault();

            const projectTitle = item.querySelector('.work-title').textContent.trim();
            const projectUrl = projectLinks[projectTitle];

            if (projectUrl) {
                window.location.href = projectUrl;
            }
        });
    });

    // =========================================================================
    // Copy Email to Clipboard
    // =========================================================================
    const emailButton = document.querySelector('.contact-email');

    if (emailButton) {
        emailButton.addEventListener('click', async () => {
            const email = emailButton.dataset.email;

            try {
                await navigator.clipboard.writeText(email);
                emailButton.classList.add('copied');

                setTimeout(() => {
                    emailButton.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.log('Failed to copy email');
            }
        });
    }

    // =========================================================================
    // Contact Form Handling - Formspree Integration
    // =========================================================================
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitButton = contactForm.querySelector('.form-submit');
            const formData = new FormData(contactForm);

            // Show sending state
            submitButton.classList.add('sending');
            submitButton.disabled = true;

            try {
                // Submit to Formspree
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Submission failed');
                }

                // Show success state
                submitButton.classList.remove('sending');
                submitButton.classList.add('success');

                // Reset form after delay
                setTimeout(() => {
                    contactForm.reset();
                    submitButton.classList.remove('success');
                    submitButton.disabled = false;
                }, 3000);

            } catch (error) {
                console.error('Form submission error:', error);

                // Show error state
                submitButton.classList.remove('sending');
                submitButton.disabled = false;

                // Show error message
                alert('Sorry, there was an error sending your message. Please try emailing us directly at abdulmusa9812@gmail.com');
            }
        });
    }

})();
