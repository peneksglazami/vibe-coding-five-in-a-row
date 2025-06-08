import React, { useEffect, useState } from 'react';
import './Fireworks.css';

interface FireworksProps {
    isActive: boolean;
}

interface Firework {
    id: number;
    x: number;
    y: number;
    delay: number;
    duration: number;
    baseHue: number;
    sparks: number;
}

const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;

const Fireworks: React.FC<FireworksProps> = ({ isActive }) => {
    const [fireworks, setFireworks] = useState<Firework[]>([]);

    useEffect(() => {
        if (isActive) {
            // 5x5 сетка для равномерного распределения
            const gridSize = 5;
            const margin = 10; // % отступ от краёв
            const fireworksArr: Firework[] = [];
            let id = 0;
            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    // Центр ячейки + небольшое случайное смещение
                    const x = margin + (col + 0.5) * ((100 - 2 * margin) / gridSize) + getRandom(-5, 5);
                    const y = margin + (row + 0.5) * ((100 - 2 * margin) / gridSize) + getRandom(-5, 5);
                    const delay = getRandom(0, 7);
                    const duration = getRandom(2, 3);
                    const baseHue = Math.floor(getRandom(0, 360));
                    const sparks = Math.floor(getRandom(10, 16));
                    fireworksArr.push({ id, x, y, delay, duration, baseHue, sparks });
                    id++;
                }
            }
            setFireworks(fireworksArr);
            // Очищаем через 10 секунд
            const timer = setTimeout(() => setFireworks([]), 10000);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    if (!isActive) return null;

    return (
        <div className="fireworks">
            {fireworks.map(firework => (
                <div
                    key={firework.id}
                    className="firework"
                    style={{
                        left: `${firework.x}%`,
                        top: `${firework.y}%`,
                        animationDelay: `${firework.delay}s`,
                        animationDuration: `${firework.duration}s`,
                    } as React.CSSProperties}
                >
                    {Array.from({ length: firework.sparks }, (_, i) => {
                        // Искры одного взрыва — оттенки одного hue
                        const hue = firework.baseHue + getRandom(-10, 10);
                        const sat = getRandom(85, 100);
                        const light = getRandom(45, 65);
                        const color = `hsl(${hue}, ${sat}%, ${light}%)`;
                        const angle = (i * 360) / firework.sparks + getRandom(-5, 5);
                        const distance = getRandom(60, 120);
                        const size = getRandom(4, 8);
                        return (
                            <div
                                key={i}
                                className="particle"
                                style={{
                                    '--angle': `${angle}deg`,
                                    '--distance': `${distance}px`,
                                    '--color': color,
                                    '--size': `${size}px`,
                                    animationDelay: `${firework.delay}s`,
                                    animationDuration: `${firework.duration}s`,
                                } as React.CSSProperties}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default Fireworks; 