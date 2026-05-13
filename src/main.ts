import Phaser from 'phaser';
import { PreloadScene }          from './scenes/PreloadScene';
import { MenuScene }             from './scenes/MenuScene';
import { StageSelectScene }      from './scenes/StageSelectScene';
import { CharacterSelectScene }  from './scenes/CharacterSelectScene';
import { BattleScene }           from './scenes/BattleScene';
import { ResultsScene }          from './scenes/ResultsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#000000',
  physics: { default: 'arcade' },
  scene: [PreloadScene, MenuScene, StageSelectScene, CharacterSelectScene, BattleScene, ResultsScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
