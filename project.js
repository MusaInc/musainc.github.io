/**
 * Project Pages — Scroll-Driven Animations
 */

(function() {
    'use strict';

    // =========================================================================
    // Scroll Progress & Scene Animations
    // =========================================================================

    const scenes = document.querySelectorAll('.project-scene');

    function getScrollProgress(element) {
        const rect = element.getBoundingClientRect();
        const elementHeight = element.offsetHeight;
        const windowHeight = window.innerHeight;

        // Calculate when element enters and exits viewport
        const scrollStart = rect.top + window.scrollY - windowHeight;
        const scrollEnd = rect.bottom + window.scrollY;
        const scrollDistance = scrollEnd - scrollStart;
        const currentScroll = window.scrollY + windowHeight;

        // Progress from 0 to 1 as element scrolls through viewport
        const progress = Math.max(0, Math.min(1, (currentScroll - scrollStart) / scrollDistance));

        return progress;
    }

    function animateScene(scene, progress) {
        const sceneType = scene.dataset.scene;

        // Scene 01 — Introduction
        if (sceneType === 'intro') {
            const device = scene.querySelector('.phone-frame, .tv-frame, .laptop-frame');
            const text = scene.querySelector('.scene-text');

            if (device && progress > 0.1) {
                device.classList.add('visible');

                // Subtle scale-up as user scrolls
                const scaleProgress = Math.min(progress * 1.5, 1);
                const scale = 1 + (scaleProgress * 0.05);
                device.style.transform = `scale(${scale}) translateY(0)`;
            }

            if (text && progress > 0.3) {
                text.classList.add('visible');
            }
        }

        // Scene 02 — Identity
        if (sceneType === 'identity') {
            const layers = scene.querySelectorAll('.identity-layer');
            const text = scene.querySelector('.scene-text');

            layers.forEach((layer, index) => {
                const layerDelay = index * 0.15;
                if (progress > 0.2 + layerDelay) {
                    layer.classList.add('visible');
                }
            });

            if (text && progress > 0.5) {
                text.classList.add('visible');
            }
        }

        // Scene 03 — UI/UX
        if (sceneType === 'ui') {
            const screens = scene.querySelectorAll('.app-screen');
            const choices = scene.querySelectorAll('.choice-button');
            const focusRing = scene.querySelector('.focus-ring');
            const cards = scene.querySelectorAll('.dashboard-card');
            const text = scene.querySelector('.scene-text');

            // App screens slide in from depth
            screens.forEach((screen, index) => {
                const screenDelay = index * 0.15;
                if (progress > 0.2 + screenDelay) {
                    screen.classList.add('visible');
                }
            });

            // TV navigation demo
            if (choices.length > 0 && focusRing) {
                if (progress > 0.2) {
                    focusRing.classList.add('visible');
                }
                choices.forEach((choice, index) => {
                    if (progress > 0.25 + (index * 0.1)) {
                        choice.classList.add('visible');
                    }
                });
            }

            // Dashboard cards
            cards.forEach((card, index) => {
                const cardDelay = index * 0.15;
                if (progress > 0.2 + cardDelay) {
                    card.classList.add('visible');
                }
            });

            if (text && progress > 0.6) {
                text.classList.add('visible');
            }
        }

        // Scene 04 — Flow
        if (sceneType === 'flow') {
            const flowDevice = scene.querySelector('.flow-phone, .flow-tv, .flow-laptop');
            const text = scene.querySelector('.scene-text');

            if (flowDevice && progress > 0.2) {
                flowDevice.classList.add('visible');

                // Animate internal content
                const balance = scene.querySelector('.balance-display');
                const cards = scene.querySelectorAll('.mini-card');
                const question = scene.querySelector('.question-display');
                const choiceCards = scene.querySelectorAll('.choice-card');
                const scoreBar = scene.querySelector('.score-bar');
                const scoreProgress = scene.querySelector('.score-progress');
                const websiteScroll = scene.querySelector('.website-scroll');

                if (balance && progress > 0.3) {
                    balance.classList.add('animate');
                }

                if (cards.length > 0 && progress > 0.4) {
                    cards.forEach(card => card.classList.add('animate'));
                }

                if (question && progress > 0.3) {
                    question.classList.add('animate');
                }

                if (choiceCards.length > 0 && progress > 0.4) {
                    choiceCards.forEach(card => card.classList.add('animate'));
                }

                if (scoreBar && progress > 0.5) {
                    scoreBar.classList.add('animate');
                }

                if (scoreProgress && progress > 0.5) {
                    scoreProgress.classList.add('animate');
                }

                if (websiteScroll && progress > 0.4) {
                    websiteScroll.classList.add('animate');
                }
            }

            if (text && progress > 0.6) {
                text.classList.add('visible');
            }
        }

        // Scene 05 — Marketing
        if (sceneType === 'marketing') {
            const assets = scene.querySelectorAll('.marketing-asset');
            const text = scene.querySelector('.scene-text');

            assets.forEach((asset, index) => {
                const assetDelay = index * 0.15;
                if (progress > 0.2 + assetDelay) {
                    asset.classList.add('visible');
                }
            });

            if (text && progress > 0.6) {
                text.classList.add('visible');
            }
        }

        // Scene 06 — Closing
        if (sceneType === 'closing') {
            const closingDevice = scene.querySelector('.closing-phone, .closing-tv, .closing-laptop');
            const text = scene.querySelector('.scene-text');

            if (closingDevice && progress > 0.2) {
                closingDevice.classList.add('visible');

                // Slow settle effect
                const settleProgress = Math.min((progress - 0.2) * 2, 1);
                const scale = 1.1 - (settleProgress * 0.1);
                closingDevice.style.transform = `scale(${scale})`;
            }

            if (text && progress > 0.5) {
                text.classList.add('visible');
            }
        }
    }

    function updateSceneAnimations() {
        scenes.forEach(scene => {
            const progress = getScrollProgress(scene);
            animateScene(scene, progress);
        });
    }

    // Throttle scroll events for performance
    let ticking = false;

    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateSceneAnimations();
                ticking = false;
            });
            ticking = true;
        }
    }

    // Initialize
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateSceneAnimations);

    // Initial check
    updateSceneAnimations();

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

})();
