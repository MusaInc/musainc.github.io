/**
 * Musa Studio — Portfolio Interactions
 */

(function() {
    'use strict';

    // =========================================================================
    // Physics Balls - Gravity Drop (Multiple balls supported)
    // =========================================================================
    const ballContainer = document.body;
    const hero = document.querySelector('.hero');
    const balls = [];
    const maxBalls = 20;

    const gravity = 0.6;
    const airResistance = 0.992;
    const bounceFactor = 0.45;
    const ballBounceFactor = 0.35;
    const ballRadius = 10;
    const stopVelocity = 0.2;
    const maxVelocity = 30;
    let lastTime = 0;

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
    function getObstacles() {
        const obstacles = [];
        document.querySelectorAll('[data-ball-obstacle]').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 6 || rect.height < 6) return;

            const insetX = Math.min(10, rect.width * 0.08);
            const insetY = Math.min(10, rect.height * 0.12);
            const left = rect.left + insetX;
            const right = rect.right - insetX;
            const top = rect.top + window.scrollY + insetY;
            const bottom = rect.bottom + window.scrollY - insetY;
            if (right - left < 4 || bottom - top < 4) return;

            obstacles.push({
                type: 'rect',
                left,
                right,
                top,
                bottom
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
            } else {
                if (overlapTop < overlapBottom) {
                    ballObj.y = obs.top - ballRadius;
                    ballObj.vy = -Math.abs(ballObj.vy) * bounceFactor;
                    // Squash
                    ballObj.element.style.transform = `translate(-50%, -50%) scaleX(1.3) scaleY(0.7)`;
                    setTimeout(() => {
                        if (ballObj.element) ballObj.element.style.transform = `translate(-50%, -50%)`;
                    }, 100);
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
        }
    }

    // Clamp velocity to prevent extreme speeds
    function clampVelocity(ballObj) {
        const speed = Math.sqrt(ballObj.vx * ballObj.vx + ballObj.vy * ballObj.vy);
        if (speed > maxVelocity) {
            const scale = maxVelocity / speed;
            ballObj.vx *= scale;
            ballObj.vy *= scale;
        }
    }

    // Animation loop for all balls
    let animating = false;

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

        const obstacles = getObstacles();
        const docWidth = document.documentElement.clientWidth;
        const docHeight = document.documentElement.scrollHeight;

        balls.forEach((ballObj) => {
            if (!ballObj.active) return;

            // Apply gravity (frame-independent)
            ballObj.vy += gravity * deltaTime;

            // Apply air resistance to both axes
            ballObj.vx *= Math.pow(airResistance, deltaTime);
            ballObj.vy *= Math.pow(airResistance, deltaTime);

            // Clamp velocity
            clampVelocity(ballObj);

            // Update position (frame-independent)
            ballObj.x += ballObj.vx * deltaTime;
            ballObj.y += ballObj.vy * deltaTime;
        });

        // Check collisions with obstacles
        balls.forEach((ballObj) => {
            if (!ballObj.active) return;
            // Check collisions
            for (const obs of obstacles) {
                checkRectCollision(ballObj, obs);
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
            if (ballObj.y - ballRadius < window.scrollY) {
                ballObj.y = window.scrollY + ballRadius;
                ballObj.vy = Math.abs(ballObj.vy) * bounceFactor;
                if (Math.abs(ballObj.vy) < stopVelocity) {
                    ballObj.vy = 0;
                }
            }

            // Floor: let balls fall off screen, then remove
            if (ballObj.y - ballRadius > docHeight + 50) {
                if (ballObj.element && ballObj.element.parentNode) {
                    ballObj.element.remove();
                }
                ballObj.active = false;
                return;
            }

            // Update element position
            ballObj.element.style.left = ballObj.x + 'px';
            ballObj.element.style.top = ballObj.y + 'px';
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

    // Click in hero to spawn ball
    if (hero) {
        hero.addEventListener('click', (e) => {
            if (e.target.closest('a, button')) return;

            cleanupBalls();

            const ball = createBall();
            const ballObj = {
                element: ball,
                x: e.clientX,
                y: e.clientY + window.scrollY,
                vx: (Math.random() - 0.5) * 6,
                vy: 2,
                active: true,
                stopping: false
            };

            ball.style.left = ballObj.x + 'px';
            ball.style.top = ballObj.y + 'px';

            balls.push(ballObj);

            if (!animating) {
                animating = true;
                requestAnimationFrame(animateAll);
            }
        });
    }

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

})();
