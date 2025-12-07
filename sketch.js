let characterSheet; // 載入單一的角色圖片資源
let attackSheet;    // 載入攻擊的圖片資源
let projectileSheet; // 載入投射物的圖片資源

// --- 動畫資料庫 ---
// 集中管理所有動畫的設定
const animations = {
  idle: {
    img: null, // 預載入後設定
    frames: [0, 1, 2, 3, 4, 3, 2, 1], // 使用春麗的呼吸/站立畫格序列
    frameWidth: 192.4, // 2309 / 12
    frameHeight: 193,
    speed: 10, // 調整呼吸動畫速度
  },
  walk: {
    img: null, // 預載入後設定
    frames: [5, 6, 7, 8, 9, 10, 11], // 使用春麗的走路畫格序列
    frameWidth: 192.4, // 2309 / 12
    frameHeight: 193,
    speed: 5,
  },
  jump: {
    img: null, // 預載入後設定
    frames: [0], // 暫時使用站立畫格作為跳躍
    frameWidth: 192.4,
    frameHeight: 193,
    speed: 1,
    loops: false, // 跳躍動畫只播放一次
  },
  attack: {
    img: null, // 預載入後設定
    frames: [0, 1, 2, 3], // 播放所有攻擊畫格
    frameWidth: 154,         // 616 / 4
    frameHeight: 193,
    speed: 5,
    loops: false, // 攻擊動畫只播放一次
    projectileFrame: 2, // 在第3個畫格 (索引2) 發射投射物
  },
};

// --- 角色物件 ---
// 集中管理角色的所有狀態與屬性
const character = {
  x: 0,
  y: 0,
  vy: 0, // Vertical velocity (垂直速度)
  gravity: 0.8,
  jumpStrength: -20, // 跳躍力道 (負數向上)
  speed: 5,
  direction: 1, // 1: 右, -1: 左
  state: 'idle', // 'idle', 'walk', 'jump', 'attack'
  animationIndex: 0,
  previousState: 'idle', // 用於偵測狀態變化
  isOnGround: true,
  groundY: 0, // 地面高度
};

// --- 投射物管理 ---
const projectiles = [];
const projectileInfo = {
  img: null, // 預載入後設定
  speed: 10, // 投射物飛行速度
  frames: [0, 1, 2], // 使用月牙波的畫格
  frameWidth: 197, // 591 / 3
  frameHeight: 229,
  animationIndex: 0,
  animationSpeed: 6, // 投射物自身的動畫速度
};

function preload() {
  // 載入春麗的角色圖片資源
  characterSheet = loadImage('2/全2.png');
  // 攻擊與投射物使用同一張圖
  attackSheet = loadImage('4/全4.png'); // 角色攻擊動畫
  projectileSheet = loadImage('3/全3.png'); // 投射物動畫
}

function setup() {
  // 建立一個全視窗的畫布
  createCanvas(windowWidth, windowHeight);

  // 將載入的圖片連結到所有動畫
  animations.idle.img = characterSheet;
  animations.walk.img = characterSheet;
  animations.jump.img = characterSheet; // 跳躍暫時使用角色圖
  animations.attack.img = attackSheet;

  // 將載入的圖片連結到投射物
  projectileInfo.img = projectileSheet;

  // 初始化角色位置
  character.x = width / 2;
  // 將地面設定在畫面偏下的位置
  character.groundY = height - 150;
  character.y = character.groundY;
}

function draw() {
  // 設定背景顏色為 #d5bdaf
  background('#d5bdaf');

  // 在處理輸入前，先記錄當前的狀態
  character.previousState = character.state;

  // --- 1. 玩家輸入與狀態更新 ---

  // 只有在地面上且不處於攻擊狀態時，才處理移動/跳躍
  if (character.isOnGround && character.state !== 'attack') {
    if (keyIsDown(RIGHT_ARROW)) {
      character.direction = 1;
      character.state = 'walk';
      character.x += character.speed;
    } else if (keyIsDown(LEFT_ARROW)) {
      character.direction = -1;
      character.state = 'walk';
      character.x -= character.speed;
    } else {
      character.state = 'idle';
    }

    // 處理跳躍輸入
    if (keyIsDown(UP_ARROW)) {
      character.isOnGround = false;
      character.vy = character.jumpStrength;
      character.state = 'jump';
      character.animationIndex = 0; // 每次跳躍都從第一格動畫開始
    }

    // 處理攻擊輸入 (使用 keyCode 32 代表空白鍵)
    if (keyIsDown(32)) {
      character.state = 'attack';
      character.animationIndex = 0;
    }
  }

  // --- 2. 套用物理效果 (重力) ---
  character.y += character.vy;

  // 只有在空中時才施加重力
  if (!character.isOnGround) {
    character.vy += character.gravity;
  }

  // --- 3. 著陸判斷 ---
  if (character.y >= character.groundY && !character.isOnGround) {
    character.y = character.groundY;
    character.vy = 0;
    character.isOnGround = true;
    // 著陸後，根據按鍵決定是走路還是站立
    if (character.state === 'jump') {
      character.state = keyIsDown(LEFT_ARROW) || keyIsDown(RIGHT_ARROW) ? 'walk' : 'idle';
    }
  }

  // --- 4. 繪製角色 ---
  const anim = animations[character.state]; // 根據當前狀態取得對應的動畫資料

  // 如果狀態發生了變化 (且不是跳躍或攻擊中)，重設動畫索引以從頭播放
  if (character.state !== character.previousState && character.state !== 'jump' && character.state !== 'attack') {
    character.animationIndex = 0;
  }

  // 每 anim.speed 個繪圖幀更新一次動畫
  if (frameCount % anim.speed === 0) {
    // 如果動畫不循環 (如跳躍/攻擊)
    if (anim.loops === false) {
      if (character.animationIndex < anim.frames.length - 1) {
        character.animationIndex++;

        // 在攻擊動畫的特定畫格發射投射物
        if (character.state === 'attack' && character.animationIndex === anim.projectileFrame) {
          createProjectile();
        }
      } else {
        // 動畫播放完畢
        if (character.state === 'attack') {
          character.state = 'idle'; // 攻擊完畢，回到站立狀態
        }
      }
    } else {
      character.animationIndex = (character.animationIndex + 1) % anim.frames.length;
    }
  }

  const frameIndex = anim.frames[character.animationIndex];
  const sx = frameIndex * anim.frameWidth;

  push(); // 儲存當前的繪圖設定
  translate(character.x, character.y); // 將畫布原點移動到角色位置
  scale(character.direction, 1); // 根據角色方向翻轉畫布

  // 繪製當前畫格
  imageMode(CENTER);
  // 攻擊動畫有不同的Y軸偏移，需要微調讓腳對齊地面
  const yOffset = (character.state === 'attack') ? -10 : 0;
  image(anim.img, 0, yOffset, anim.frameWidth, anim.frameHeight, sx, 0, anim.frameWidth, anim.frameHeight);

  pop(); // 恢復原本的繪圖設定

  // --- 5. 更新與繪製投射物 ---
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.speed * p.direction;

    // 更新投射物自己的動畫
    if (frameCount % projectileInfo.animationSpeed === 0) {
      p.animationIndex = (p.animationIndex + 1) % projectileInfo.frames.length;
    }
    const frameIndex = projectileInfo.frames[p.animationIndex];
    const sx = frameIndex * projectileInfo.frameWidth;
    push();
    translate(p.x, p.y + 30); // 微調Y軸，讓氣功波看起來在地面上
    scale(p.direction, 1);
    imageMode(CENTER);
    image(projectileInfo.img, 0, 0, projectileInfo.frameWidth, projectileInfo.frameHeight, sx, 0, projectileInfo.frameWidth, projectileInfo.frameHeight);
    pop();

    // 如果投射物飛出畫面，就將其移除
    if (p.x < 0 || p.x > width) {
      projectiles.splice(i, 1);
    }
  }

  // --- 6. 邊界處理 (防止角色走出視窗) ---
  if (character.x > width) {
    character.x = width;
  }
  if (character.x < 0) {
    character.x = 0;
  }
}

function createProjectile() {
  const p = {
    x: character.x,
    y: character.y - 100, // 調整Y軸使大氣功波位置更合理
    direction: character.direction,
    speed: projectileInfo.speed,
    animationIndex: 0,
  };
  projectiles.push(p);
}
