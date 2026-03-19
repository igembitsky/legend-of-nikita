import { describe, it, expect } from 'vitest';

function checkCollision(playerX, playerWidth, obstacleX, obstacleWidth, playerY, playerHeight, obstacleY, obstacleHeight) {
  return Math.abs(playerX - obstacleX) < (playerWidth + obstacleWidth) / 2 &&
         Math.abs(playerY - obstacleY) < (playerHeight + obstacleHeight) / 2;
}

function getDrivingConfig(destination) {
  if (destination === 'dojo') return { scrollSpeed: 3, spawnInterval: 800, bgColor: 0x4488aa };
  if (destination === 'home') return { scrollSpeed: 2.4, spawnInterval: 1600, bgColor: 0xaa6633 };
  return {};
}

describe('DrivingScene', () => {
  it('detects collision between overlapping objects', () => {
    expect(checkCollision(100, 40, 110, 24, 300, 64, 310, 40)).toBe(true);
  });

  it('no collision for separated objects', () => {
    expect(checkCollision(100, 40, 300, 24, 300, 64, 300, 40)).toBe(false);
  });

  it('home config has slower scroll and fewer obstacles', () => {
    const dojo = getDrivingConfig('dojo');
    const home = getDrivingConfig('home');
    expect(home.scrollSpeed).toBeLessThan(dojo.scrollSpeed);
    expect(home.spawnInterval).toBeGreaterThan(dojo.spawnInterval);
  });
});
